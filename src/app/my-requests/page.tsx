// src/app/my-requests/page.tsx
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { format, parseISO } from 'date-fns'; // Für Datumsformatierung
import { de } from 'date-fns/locale'; // Deutsches Format für date-fns
import Link from 'next/link'; // Für Links

// Typ für die Daten, die wir für jede Anfrage des Benutzers abrufen
type UserTrainingRequest = {
  id: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  // Verknüpfte Kursdaten (kann null sein, falls Kurs gelöscht)
  courses: {
    title: string | null;
  } | null;
};

export default async function MyRequestsPage() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // 1. Prüfen, ob der Benutzer überhaupt eingeloggt ist
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    // Wenn nicht eingeloggt, zur Login-Seite umleiten
    redirect('/login?message=Bitte anmelden, um Ihre Anfragen zu sehen.');
  }

  // Der Benutzer ist eingeloggt, hole seine User-ID
  const userId = session.user.id;

  // 2. Anfragen NUR für diesen spezifischen Benutzer abrufen
  const { data: requests, error: requestsError } = await supabase
    .from('training_requests')
    .select(`
      id,
      created_at,
      status,
      courses ( title )
    `)
    .eq('user_id', userId) // Filter nach user_id
    // KORREKTUR HIER: ascending: false für absteigende Sortierung
    .order('created_at', { ascending: false })
    .returns<UserTrainingRequest[]>();

  // Fehlerbehandlung für die Datenabfrage
  if (requestsError) {
    console.error('Fehler beim Abrufen der Benutzeranfragen:', requestsError);
    // Hier könnte man eine freundlichere Fehlermeldung anzeigen
  }

  // Hilfsfunktion zur Datumsformatierung
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), "dd.MM.yy HH:mm", { locale: de });
    } catch (_e) {
      console.error("Error formatting date:", _e);
      return dateString;
    }
  };

  // Hilfsfunktion für Status-Styling
  const getStatusClass = (status: UserTrainingRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-400/10 text-yellow-300';
      case 'approved': return 'bg-green-500/10 text-green-300';
      case 'rejected': return 'bg-red-500/10 text-red-300';
      case 'completed': return 'bg-blue-500/10 text-blue-300';
      default: return 'bg-gray-600/10 text-gray-400';
    }
  };

  // --- JSX Rendering ---
  return (
    <main className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Meine Schulungsanfragen</h1>
        <Link href="/" className="text-sm text-indigo-400 hover:underline whitespace-nowrap">
          ← Zur Themenübersicht
        </Link>
      </div>

      {requestsError && (
        <div className="text-red-400 bg-red-900/50 border border-red-800 p-4 rounded-md mb-6">
          <p><span className="font-semibold">Fehler:</span> Konnte Ihre Anfragen nicht laden. (${requestsError.message})</p>
        </div>
      )}

      {!requestsError && (!requests || requests.length === 0) && (
         <div className="text-center p-8 border border-dashed border-neutral-700 rounded-lg bg-neutral-900/50">
            <p className="text-neutral-500">Sie haben noch keine Schulungsanfragen gestellt.</p>
            <Link href="/" className="inline-block mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors text-sm">
                Seminare durchsuchen & anfragen
            </Link>
        </div>
      )}

      {!requestsError && requests && requests.length > 0 && (
        <div className="rounded-lg border border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-700">
              <thead className="bg-neutral-800/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">Angefragt am</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">Kurs</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-900">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-300">{formatDate(req.created_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-300">{req.courses?.title ?? <span className="italic text-neutral-500">Unbekannt/Gelöscht</span>}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`capitalize px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}