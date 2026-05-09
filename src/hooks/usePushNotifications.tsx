import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// VAPID public key — must match VAPID_PUBLIC_KEY set in Supabase Edge Function secrets
// and VITE_VAPID_PUBLIC_KEY set in Vercel environment variables.
// No hardcoded fallback: a missing key means misconfiguration and push should not silently
// subscribe against a wrong/stale key (which would fail silently on send).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    if (supported && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('[Push] Error checking subscription:', error);
    }
  };

  const saveSubscriptionToDb = async (subscription: PushSubscription) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user) throw new Error('User not authenticated');

    const sub = subscription.toJSON();
    const endpoint = sub.endpoint || '';

    // Remove the existing row for this specific (user_id, endpoint) pair before
    // re-inserting. Deleting by user_id alone would wipe subscriptions from all
    // other devices the user is logged into (phone, tablet, etc).
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user.id,
        endpoint,
        p256dh: sub.keys?.p256dh || '',
        auth: sub.keys?.auth || '',
      });

    if (error) throw error;
  };

  // subscribe — requests permission if needed, then creates the push subscription
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported on this device',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);

    try {
      // Request notification permission if not already granted
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      setPermissionState(permission);

      if (permission !== 'granted') {
        toast({
          title: 'Notifications blocked',
          description: 'Enable notifications in browser settings → Site Settings → Notifications',
          variant: 'destructive',
        });
        setIsLoading(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed — if the key matches, reuse it
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Unsubscribe and re-subscribe to ensure key consistency
        await subscription.unsubscribe();
      }

      if (!VAPID_PUBLIC_KEY) {
        toast({
          title: 'Configuration error',
          description: 'Push notifications are not configured on this server',
          variant: 'destructive',
        });
        setIsLoading(false);
        return false;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await saveSubscriptionToDb(subscription);

      setIsSubscribed(true);
      toast({
        title: '🔔 Notifications enabled',
        description: 'You will be alerted on this device for every new order',
      });

      return true;
    } catch (error: any) {
      console.error('[Push] Subscribe error:', error);
      toast({
        title: 'Subscription failed',
        description: error.message || 'Could not enable notifications',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, toast]);

  // autoSubscribe — silently subscribes if permission already granted, otherwise no-ops.
  // Call this on kitchen page mount so staff who already said "yes" are always subscribed.
  const autoSubscribe = useCallback(async (): Promise<void> => {
    if (!isSupported) return;
    if (Notification.permission !== 'granted') return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      // Already subscribed with a valid endpoint — nothing to do
      if (existing) {
        await saveSubscriptionToDb(existing); // keep DB in sync in case row was lost
        setIsSubscribed(true);
        return;
      }

      if (!VAPID_PUBLIC_KEY) {
        console.warn('[Push] VITE_VAPID_PUBLIC_KEY not set — auto-subscribe skipped');
        return;
      }

      // Permission is granted but no active subscription — re-subscribe silently
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await saveSubscriptionToDb(subscription);
      setIsSubscribed(true);
      console.log('[Push] Auto-subscribed successfully');
    } catch (err) {
      console.warn('[Push] Auto-subscribe failed (non-critical):', err);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }
      }

      setIsSubscribed(false);
      toast({ title: 'Notifications disabled' });
      return true;
    } catch (error: any) {
      console.error('[Push] Unsubscribe error:', error);
      toast({
        title: 'Unsubscribe failed',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permissionState,
    subscribe,
    unsubscribe,
    autoSubscribe,
  };
};
