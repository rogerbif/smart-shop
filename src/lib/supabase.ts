import { createServerClient as _createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Cria um cliente Supabase server-side que gerencia sessão via cookies.
 * Usado em Server Actions e Server Components para autenticação.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll é chamado de Server Components onde cookies não podem ser escritos.
            // Pode ser ignorado se o middleware já está refreshando a sessão.
          }
        },
      },
    }
  );
}

/**
 * Cliente admin com service_role_key.
 * Bypass de RLS — usar APENAS para operações administrativas.
 */
export function createAdminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
