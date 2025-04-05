// src/app/login/page.tsx
'use client'; // Diese Seite benötigt Client-Interaktivität

import { createClient } from '@/utils/supabase/client'; // Wichtig: Den Browser-Client importieren!
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared'; // Vorgefertigtes Supabase-Theme
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const supabase = createClient(); // Browser-Client-Instanz
  const router = useRouter();

  // Überprüfen, ob Benutzer bereits eingeloggt ist (optional, aber gut für UX)
  // Wenn ja, leite direkt zur Startseite weiter
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
        router.refresh();
      }
    };
    checkSession();
  }, [supabase, router]);


  // Auf Änderungen des Auth-Status hören (z.B. nach erfolgreichem Login)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
        // Nach erfolgreichem Login zur Startseite weiterleiten
        router.push('/');
        router.refresh(); // Wichtig, damit Server Components die neue Session erkennen
      }
      // Hier könnten weitere Events behandelt werden, z.B. SIGNED_OUT
    });

    // Subscription beim Verlassen der Komponente beenden
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 px-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-neutral-900 rounded-xl shadow-xl">
         {/* Kleiner Header oder Logo optional hier */}
        <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Willkommen zurück!</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">Melde dich an oder registriere dich.</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa, // Vorgefertigtes Theme nutzen
            variables: { default: { colors: { brand: '#4f46e5', brandAccent: '#6366f1' }}}, // Farben anpassen (optional)
           }}
          theme="dark" // UI explizit im Dark Mode
          providers={['google', 'github']} // OAuth-Anbieter (optional, müssen im Supabase Dashboard aktiviert sein!)
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`} // Wichtig für OAuth Redirects! Passt sich an localhost/Deployment an.
          localization={{ // Deutsche Texte (Beispiele, erweiterbar)
            variables: {
              sign_in: { email_label: 'E-Mail-Adresse', password_label: 'Passwort', button_label: 'Anmelden', link_text: 'Bereits registriert? Anmelden', loading_button_label: 'Anmelden ...' },
              sign_up: { email_label: 'E-Mail-Adresse', password_label: 'Passwort erstellen', button_label: 'Registrieren', link_text: 'Noch kein Konto? Registrieren', loading_button_label: 'Registrieren ...' },
              forgotten_password: { email_label: 'E-Mail-Adresse', password_label: 'Dein Passwort', button_label: 'Passwort zurücksetzen', link_text: 'Passwort vergessen?', loading_button_label: 'Sende Reset-Anleitung ...', confirmation_text: 'Prüfe deine E-Mails für den Reset-Link.' }
              // ... weitere Texte hier nach Bedarf anpassen von: https://supabase.com/docs/guides/auth/auth-helpers/auth-ui#localization
            },
          }}
          // SocialLayout="horizontal" // Alternative Darstellung für OAuth-Buttons
        />
      </div>
    </div>
  );
}