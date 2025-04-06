/* eslint-disable @typescript-eslint/no-unused-vars */
// src/utils/supabase/server.ts - Workaround mit async Handlern
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// createClient selbst bleibt synchron
export function createClient() {
  // cookies() hier aufrufen. TypeScript denkt vielleicht, dies ist ein Promise.
  const cookieStoreInstance = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Handler wird async
        async get(name: string) {
          // Wir warten hier auf das vermeintliche Promise
          const store = await cookieStoreInstance;
          // Dann greifen wir synchron auf .get zu
          return store.get(name)?.value;
        },
        // Handler wird async
        async set(name: string, value: string, options: CookieOptions) {
          try {
            // Wir warten hier auf das vermeintliche Promise
            const store = await cookieStoreInstance;
            // Dann greifen wir synchron auf .set zu
            store.set({ name, value, ...options });
          } catch (_error) {
             
            // Fehler beim Setzen im Server Component ignorieren
          }
        },
        // Handler wird async
        async remove(name: string, options: CookieOptions) {
          try {
            // Wir warten hier auf das vermeintliche Promise
            const store = await cookieStoreInstance;
             // Dann greifen wir synchron auf .set zu (für remove)
            store.set({ name, value: '', ...options });
          } catch (_error) {
             
            // Fehler beim Entfernen im Server Component ignorieren
          }
        },
      },
    }
  );
}