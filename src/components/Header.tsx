// src/components/Header.tsx
import Link from 'next/link';
//import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server'; // Server Client wird hier benötigt
import LogoutButton from './LogoutButton'; // LogoutButton importieren

// Dies ist eine Server Component, da sie Daten (Session, Rolle) serverseitig abruft
export default async function Header() {
  //const cookieStore = cookies();
  const supabase = createClient();

  // Aktuelle Benutzersession holen
  const { data: { session } } = await supabase.auth.getSession();

  // Prüfen, ob der Benutzer Admin ist (nur wenn eingeloggt)
  let isAdmin = false;
  if (session) {
    // Wir verwenden hier die gleiche Logik wie in der Server Action und auf der Admin-Seite
    // TODO: Diese Logik sollte idealerweise an einen zentralen Ort ausgelagert werden!
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      // Fehler ignorieren wir hier vorerst oder loggen sie nur
      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Header: Fehler beim Abrufen der Profilrolle:", profileError.message);
      }
      if (profileData?.role === 'admin') {
        isAdmin = true;
      }
    } catch (error) {
       console.error("Header: Fehler bei der Admin-Rollen-Prüfung:", error);
    }
  }

  // --- JSX für den Header ---
  return (
    <header className="bg-neutral-800/80 backdrop-blur-sm text-neutral-100 sticky top-0 z-50 shadow-lg border-b border-neutral-700/50 print:hidden">
      {/* Container für zentrierten Inhalt und Padding */}
      <nav className="container mx-auto flex items-center justify-between p-4 h-16"> {/* Feste Höhe für Header */}

        {/* Logo oder App-Name (Link zur Startseite) */}
        <Link href="/" className="text-lg font-semibold hover:text-indigo-300 transition-colors">
          Seminar Portal
        </Link>

        {/* Navigationslinks & Buttons */}
        <div className="flex items-center gap-x-4 md:gap-x-6"> {/* Abstand zwischen Elementen */}

          {/* Link zur Themenübersicht (immer sichtbar) */}
          <Link href="/" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
            Themen
          </Link>

          {/* Links/Buttons nur für eingeloggte Benutzer */}
          {session && (
            <>
              <Link href="/my-requests" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                Meine Anfragen
              </Link>

              {/* Admin Dashboard Link nur für Admins */}
              {isAdmin && (
                <Link href="/admin/dashboard" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                  Admin
                </Link>
              )}

              {/* Logout Button */}
              <LogoutButton />
            </>
          )}

          {/* Login Button nur für ausgeloggte Benutzer */}
          {!session && (
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Anmelden
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}