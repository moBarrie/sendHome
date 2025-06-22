// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { getAuth } from 'firebase/auth';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to set the Firebase ID token as the auth header for Supabase
export async function setSupabaseAuthHeader() {
  const auth = getAuth();
  const user = auth.currentUser;
  console.debug('[setSupabaseAuthHeader] user:', user);
  if (user) {
    const token = await user.getIdToken();
    console.debug('[setSupabaseAuthHeader] token:', token);
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: '' // No refresh token for external JWT
    });
  } else {
    console.warn('[setSupabaseAuthHeader] No user found!');
  }
}

