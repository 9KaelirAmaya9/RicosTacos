/**
 * Debug utility for authentication and role checking
 * Use this in browser console to diagnose auth issues
 */

import { supabase } from '@/integrations/supabase/client';

export async function debugAuth() {
  console.log('=== AUTH DEBUG ===');
  
  // Check env vars
  console.log('Environment Variables:');
  console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING');
  console.log('  SUPABASE_URL:', import.meta.env.SUPABASE_URL ? 'SET' : 'MISSING');
  console.log('  VITE_SUPABASE_PUBLISHABLE_KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'SET' : 'MISSING');
  console.log('  SUPABASE_PUBLISHABLE_KEY:', import.meta.env.SUPABASE_PUBLISHABLE_KEY ? 'SET' : 'MISSING');
  
  // Check session
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('\nSession:');
    if (sessionError) {
      console.error('  Error:', sessionError);
    } else if (sessionData.session) {
      console.log('  ✅ Logged in');
      console.log('  User ID:', sessionData.session.user.id);
      console.log('  Email:', sessionData.session.user.email);
    } else {
      console.log('  ❌ Not logged in');
    }
    
    // Check roles
    if (sessionData.session) {
      console.log('\nRoles:');
      try {
        const { data: roles, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', sessionData.session.user.id);
        
        if (roleError) {
          console.error('  Error fetching roles:', roleError);
        } else {
          console.log('  Roles:', roles?.map(r => r.role) || 'None');
        }
      } catch (e) {
        console.error('  Exception checking roles:', e);
      }
    }
  } catch (e) {
    console.error('Exception in auth check:', e);
  }
  
  console.log('=== END DEBUG ===');
}

// Make available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
}

