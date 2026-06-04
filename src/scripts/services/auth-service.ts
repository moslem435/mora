import { supabase, isSupabaseConfigured } from '../storage';

export function isAuthEnabled() {
  return isSupabaseConfigured;
}

export async function getSession() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function login(email: string, password: string) {
  return supabase!.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  return supabase!.auth.signUp({ email, password });
}

export async function logout() {
  return supabase!.auth.signOut();
}
