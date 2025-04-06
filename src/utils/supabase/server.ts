/* eslint-disable @typescript-eslint/no-unused-vars */
// src/utils/supabase/server.ts - Angepasste Version für vermeintliches Promise
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Machen wir die Funktion async, um auf das vermeintliche Promise zu warten
export async function createClient(cookieStoreParam: ReturnType<typeof cookies>) {
  // Warten auf das Ergebnis, da TypeScript hier ein Promise erwartet
  const cookieStore = await cookieStoreParam;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Verwende das (jetzt aufgelöste) cookieStore Objekt
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Verwende das (jetzt aufgelöste) cookieStore Objekt
            // Hinweis: Dies wird in Server Components immer noch fehlschlagen,
            // aber der try/catch fängt es ab.
            cookieStore.set({ name, value, ...options });
          } catch (_error) {
            // ESLint-Warnung für ungenutzte Variable explizit deaktivieren:
             
            // Der Fehler wird hier absichtlich ignoriert, da die Middleware
            // das Cookie-Handling übernehmen sollte.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // Verwende das (jetzt aufgelöste) cookieStore Objekt
            // Hinweis: Dies wird in Server Components immer noch fehlschlagen,
            // aber der try/catch fängt es ab.
            cookieStore.set({ name, value: '', ...options });
          } catch (_error) {
             // ESLint-Warnung für ungenutzte Variable explizit deaktivieren:
             
            // Der Fehler wird hier absichtlich ignoriert.
          }
        },
      },
    }
  );
}