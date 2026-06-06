import { supabase, isSupabaseConfigured, storage } from '../storage';

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
  // 防御性校验：如果前端配置关闭了注册，直接拦截
  const config = storage.getSiteConfig();
  if (!config.allowRegistration) {
    return { 
      data: { user: null, session: null }, 
      error: { message: '注册功能已关闭，请联系管理员。', status: 403 } 
    } as any;
  }
  return supabase!.auth.signUp({ email, password });
}

export async function logout() {
  return supabase!.auth.signOut();
}
