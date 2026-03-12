import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
  targetRoles?: string[];
}

// ─── VAPID helpers ────────────────────────────────────────────────────────────

function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  const binary = atob(padded);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBytes: Uint8Array,
): Promise<string> {
  const enc = new TextEncoder();
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 43200, sub: subject };

  const headerB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  // Build minimal PKCS#8 DER wrapper around the raw 32-byte P-256 scalar.
  // This is the smallest valid structure that WebCrypto will accept.
  const oidEcPublicKey = [0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01];
  const oidPrime256v1 = [0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07];

  // ECPrivateKey (RFC 5915) — version 1, private key bytes, named curve OID
  const ecPrivKey = new Uint8Array([
    0x30, 0x31,
    0x02, 0x01, 0x01,
    0x04, 0x20, ...privateKeyBytes,
    0xa0, 0x0a,
    0x06, 0x08, ...oidPrime256v1,
  ]);

  // AlgorithmIdentifier
  const algId = new Uint8Array([
    0x30, 0x13,
    0x06, 0x07, ...oidEcPublicKey,
    0x06, 0x08, ...oidPrime256v1,
  ]);

  // PKCS#8 PrivateKeyInfo
  const pkcs8 = new Uint8Array([
    0x30, 0x41,
    0x02, 0x01, 0x00,
    ...algId,
    0x04, 0x23,
    ...ecPrivKey,
  ]);

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8.buffer as ArrayBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    enc.encode(signingInput),
  );

  return `${signingInput}.${uint8ArrayToBase64url(new Uint8Array(sig))}`;
}

// ─── Web Push encryption (RFC 8291 / aes128gcm) ───────────────────────────────

async function sendWebPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payloadStr: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const enc = new TextEncoder();
    const url = new URL(sub.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const jwt = await createVapidJwt(
      audience,
      vapidSubject,
      base64urlToUint8Array(vapidPrivateKey),
    );

    // ── Encryption ──────────────────────────────────────────────────────────
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const ephemeralPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits'],
    );

    const receiverPubKey = await crypto.subtle.importKey(
      'raw',
      base64urlToUint8Array(sub.p256dh).buffer as ArrayBuffer,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      [],
    );

    const sharedBits = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: receiverPubKey },
      ephemeralPair.privateKey,
      256,
    );

    const ephPubRaw = new Uint8Array(
      await crypto.subtle.exportKey('raw', ephemeralPair.publicKey),
    );
    const authBytes = base64urlToUint8Array(sub.auth);
    const recvPubBytes = base64urlToUint8Array(sub.p256dh);

    // PRK via HKDF-Extract(auth, sharedSecret) with info = "WebPush: info\0" + recvPub + ephPub
    const hkdfBase = await crypto.subtle.importKey(
      'raw',
      sharedBits,
      { name: 'HKDF' },
      false,
      ['deriveBits'],
    );

    const prkInfo = new Uint8Array([
      ...enc.encode('WebPush: info\0'),
      ...recvPubBytes,
      ...ephPubRaw,
    ]);

    const prk = await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: authBytes, info: prkInfo },
      hkdfBase,
      256,
    );

    const prkKey = await crypto.subtle.importKey(
      'raw',
      prk,
      { name: 'HKDF' },
      false,
      ['deriveBits'],
    );

    const cekBits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info: new Uint8Array([...enc.encode('Content-Encoding: aes128gcm\0'), 0x01]),
      },
      prkKey,
      128,
    );

    const nonceBits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info: new Uint8Array([...enc.encode('Content-Encoding: nonce\0'), 0x01]),
      },
      prkKey,
      96,
    );

    const cekKey = await crypto.subtle.importKey(
      'raw',
      cekBits,
      { name: 'AES-GCM' },
      false,
      ['encrypt'],
    );

    // Plaintext: 2-byte padding length (0) + payload bytes + 0x02 delimiter
    const plaintext = new Uint8Array([0, 0, ...enc.encode(payloadStr), 0x02]);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonceBits },
      cekKey,
      plaintext.buffer as ArrayBuffer,
    );

    // aes128gcm header: salt(16) + rs(4 BE) + idlen(1) + keyid(65)
    const bodyHeader = new Uint8Array(86);
    bodyHeader.set(salt, 0);
    new DataView(bodyHeader.buffer).setUint32(16, 4096, false);
    bodyHeader[20] = 65;
    bodyHeader.set(ephPubRaw, 21);

    const body = new Uint8Array(bodyHeader.byteLength + ciphertext.byteLength);
    body.set(bodyHeader, 0);
    body.set(new Uint8Array(ciphertext), bodyHeader.byteLength);

    const response = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `vapid t=${jwt},k=${vapidPublicKey}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        TTL: '86400',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return { ok: false, status: response.status, error: text };
    }

    return { ok: true, status: response.status };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, status: 0, error: msg };
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
    const vapidSubject =
      Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@losricostacos.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { title, body, icon, data, targetRoles }: PushNotificationRequest =
      await req.json();

    console.log('send-push-notification:', { title, targetRoles });

    // ── Resolve target user IDs from roles ──────────────────────────────────
    let targetUserIds: string[] = [];

    if (targetRoles && targetRoles.length > 0) {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', targetRoles);

      if (rolesError) throw rolesError;

      targetUserIds = [
        ...new Set(
          ((userRoles ?? []) as Array<{ user_id: string }>).map((r) => r.user_id),
        ),
      ];

      if (targetUserIds.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No target users found', sent: 0, total: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // ── Fetch subscriptions ─────────────────────────────────────────────────
    type PushSub = { endpoint: string; p256dh: string; auth: string };
    let query = supabase.from('push_subscriptions').select('endpoint, p256dh, auth');
    if (targetUserIds.length > 0) {
      query = query.in('user_id', targetUserIds);
    }

    const { data: subscriptions, error: subsError } = await query;
    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: icon ?? '/logo.png',
      badge: '/logo.png',
      data: { ...(data ?? {}), url: (data?.url as string) ?? '/kitchen' },
    });

    // ── Send in parallel ────────────────────────────────────────────────────
    const results = await Promise.allSettled(
      (subscriptions as PushSub[]).map(async (sub) => {
        const result = await sendWebPush(
          sub,
          notificationPayload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject,
        );

        if (!result.ok) {
          console.error(`Push failed (${result.status}):`, result.error?.slice(0, 120));
          // Remove expired/invalid subscriptions
          if (result.status === 410 || result.status === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
        }

        return result;
      }),
    );

    const sent = results.filter(
      (r): r is PromiseFulfilledResult<{ ok: boolean; status: number }> =>
        r.status === 'fulfilled' && r.value.ok,
    ).length;

    console.log(`Sent ${sent}/${subscriptions.length} push notifications`);

    return new Response(
      JSON.stringify({ message: 'Done', sent, total: subscriptions.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-push-notification error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
