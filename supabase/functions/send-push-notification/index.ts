import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  title: string;
  body: string;
  icon?: string;
  data?: any;
  targetRoles?: string[]; // e.g., ['admin', 'kitchen']
}

// Web Push requires proper VAPID authentication and payload encryption.
// For this to work, you need to set these environment variables in Supabase:
// - VAPID_PUBLIC_KEY: Your VAPID public key (same as used in frontend)
// - VAPID_PRIVATE_KEY: Your VAPID private key
// - VAPID_SUBJECT: mailto:your-email@example.com

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<boolean> {
  try {
    // Import web-push compatible encryption
    const { default: webpush } = await import('https://esm.sh/web-push@3.6.7');

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webpush.sendNotification(pushSubscription, payload);
    return true;
  } catch (error: any) {
    console.error('Web push error:', error);
    // Check if subscription is expired/invalid
    if (error.statusCode === 404 || error.statusCode === 410) {
      throw { expired: true, error };
    }
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@ricostacos.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('VAPID keys not configured - push notifications will not work');
      console.warn('Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Supabase secrets');
      return new Response(
        JSON.stringify({
          message: 'Push notifications not configured - VAPID keys missing',
          sent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { title, body, icon, data, targetRoles }: PushNotificationRequest = await req.json();

    console.log('Sending push notification:', { title, targetRoles });

    // Get users with target roles
    let targetUserIds: string[] = [];

    if (targetRoles && targetRoles.length > 0) {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', targetRoles);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        throw rolesError;
      }

      targetUserIds = userRoles?.map(r => r.user_id) || [];
      console.log(`Found ${targetUserIds.length} users with roles:`, targetRoles);
    }

    // Get push subscriptions for target users
    let subscriptionsQuery = supabase
      .from('push_subscriptions')
      .select('*');

    if (targetUserIds.length > 0) {
      subscriptionsQuery = subscriptionsQuery.in('user_id', targetUserIds);
    }

    const { data: subscriptions, error: subsError } = await subscriptionsQuery;

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      throw subsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for target users');
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending to ${subscriptions.length} subscriptions`);

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/logo.png',
      data: data || {},
    });

    // Send push notifications
    const notifications = subscriptions.map(async (sub) => {
      try {
        const success = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        );
        return { success, subId: sub.id };
      } catch (error: any) {
        if (error.expired) {
          // Remove expired subscription
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
          console.log('Removed expired subscription:', sub.id);
        }
        return { success: false, subId: sub.id };
      }
    });

    const results = await Promise.all(notifications);
    const successCount = results.filter(r => r.success).length;

    console.log(`Successfully sent ${successCount}/${subscriptions.length} notifications`);

    return new Response(
      JSON.stringify({
        message: 'Push notifications sent',
        sent: successCount,
        total: subscriptions.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
