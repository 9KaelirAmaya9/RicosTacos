import { Bell, BellOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationSettings = () => {
  const { isSupported, isSubscribed, isLoading, permissionState, subscribe, unsubscribe } =
    usePushNotifications();

  if (!isSupported) {
    return (
      <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-orange-700 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Push Notifications Unavailable
          </CardTitle>
          <CardDescription>
            This browser or device doesn't support push notifications. Use Chrome on Android or
            desktop for reliable order alerts. Email alerts are still active as a backup.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (permissionState === 'denied') {
    return (
      <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-400">
            <BellOff className="h-5 w-5" />
            Notifications Blocked
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            Notifications are blocked in browser settings. To fix:{' '}
            <strong>Settings → Site Settings → Notifications → losricostacos.com → Allow</strong>.
            Email alerts are still active as a backup.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isSubscribed) {
    return (
      <Card className="border-green-300 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-400">
            <Bell className="h-5 w-5" />
            Order Alerts Active
          </CardTitle>
          <CardDescription>
            This device will receive an OS notification for every new order — even if the browser
            tab is closed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={unsubscribe}
            disabled={isLoading}
            className="text-muted-foreground"
          >
            <BellOff className="mr-2 h-4 w-4" />
            {isLoading ? 'Disabling…' : 'Disable on this device'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Not yet subscribed — show a prominent call-to-action
  return (
    <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 animate-pulse hover:animate-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-yellow-800 dark:text-yellow-300">
          <Bell className="h-5 w-5" />
          Enable Order Alerts on This Device
        </CardTitle>
        <CardDescription className="text-yellow-700 dark:text-yellow-400">
          Get an OS notification for every new order — works even when this tab is closed or the
          screen is locked.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={subscribe}
          disabled={isLoading}
          className="bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-bold w-full sm:w-auto"
        >
          <Bell className="mr-2 h-4 w-4" />
          {isLoading ? 'Enabling…' : '🔔 Enable Push Notifications'}
        </Button>
      </CardContent>
    </Card>
  );
};
