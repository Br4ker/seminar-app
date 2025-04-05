// src/components/LogoutButton.tsx
'use client'; // Benötigt Client-Interaktivität

import { createClient } from '@/utils/supabase/client'; // Browser Client
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); // Wichtig: Server Components neu laden lassen
    // Optional: Nach Logout zur Login-Seite weiterleiten
    // router.push('/login');
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