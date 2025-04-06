// src/components/LogoutButton.tsx
'use client'; // Benötigt Client-Interaktivität

import { createClient } from '@/utils/supabase/client'; // Browser Client
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // router.refresh(); // Entfernt oder auskommentiert
    router.push('/login'); // Zur Login-Seite weiterleiten
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
    >
      Abmelden
    </button>
  );
}