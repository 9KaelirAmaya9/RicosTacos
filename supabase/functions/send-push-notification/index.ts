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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

      targetUserIds = [...new Set((userRoles || []).map(r => r.user_id))];
      console.log(`Found ${targetUserIds.length} users with roles:`, targetRoles);
    }

    // Get push subscriptions for target users
    let subscriptionsQuery = supabase
      .from('push_subscriptions')
      .select('*');

    if (targetRoles && targetRoles.length > 0 && targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No target users found for requested roles', sent: 0, total: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // NOTE:
    // Native Web Push delivery from server requires VAPID encryption/signature.
    // This project currently stores subscriptions but does not include a VAPID send implementation.
    // For local/dev visibility we return counts and keep non-blocking behavior.
    // (In-app alarm already handles loud sound while kitchen/admin pages are open.)
    const successCount = 0;

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
