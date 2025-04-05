// src/app/admin/dashboard/page.tsx
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { format, parseISO } from 'date-fns'; // Für Datumsformatierung
import { de } from 'date-fns/locale'; // Deutsches Format für date-fns
import { updateRequestStatus } from '../actions'; // Server Action für Status importieren
import AdminNoteCell from '@/components/AdminNoteCell'; // Komponente für Notizen importieren
import SubmitButton from '@/components/SubmitButton'; // NEU: SubmitButton importieren

// --- Typdefinitionen ---
type Profile = {
  id: string;
  full_name: string | null;
  department: string | null;
};
type Course = {
  id: string;
  title: string | null;
};
type TrainingRequest = {
  id: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_notes: string | null;
  processed_at: string | null;
  user_id: string;
  course_id: string;
};
type CombinedRequest = TrainingRequest & {
  course_title: string | null;
  user_full_name: string | null;
  user_department: string | null;
};
// --- Ende Typdefinitionen ---


export default async function AdminDashboardPage() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // 1. Authentifizierung prüfen
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.log("Keine Session im Admin Dashboard (Server)", sessionError);
    redirect('/login?message=Adminbereich erfordert Anmeldung.');
  }

  // ----- HIER ADMIN-ROLLEN-PRÜFUNG EINFÜGEN -----
  try {
    // console.log(`[Admin Page Check] Prüfe Rolle für User ID: ${session.user.id}`); // Debugging entfernt
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error(`Profilprüfung fehlgeschlagen: ${profileError.message}`);
    }
    if (profileData?.role !== 'admin') {
      console.warn(`Zugriffsversuch auf /admin/dashboard durch Nicht-Admin: User ${session.user.id}`);
      redirect('/?error=Keine Berechtigung für Admin-Bereich');
    }
    // console.log(`[Admin Page Check] Zugriff erlaubt für Admin User ${session.user.id}`); // Debugging entfernt
  } catch (error) {
    console.error("Fehler bei der Admin-Rollen-Prüfung auf der Seite:", error);
    redirect('/?error=Fehler bei Berechtigungsprüfung');
  }
  // -----------------------------------------------------


  // 2. Daten abrufen (separate Abfragen)
  let combinedRequests: CombinedRequest[] = [];
  let fetchError: string | null = null;

  try {
    // Schritt A: Trainingsanfragen holen
    const { data: requestsData, error: requestsError } = await supabase
      .from('training_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<TrainingRequest[]>();

    if (requestsError) throw requestsError;
    if (!requestsData) throw new Error("Keine Anfragedaten erhalten.");

    if (requestsData.length > 0) {
      // Schritt B: IDs extrahieren
      const userIds = [...new Set(requestsData.map(req => req.user_id).filter(id => !!id))];
      const courseIds = [...new Set(requestsData.map(req => req.course_id).filter(id => !!id))];

      // Schritt C: Profile holen
      const profilesMap = new Map<string, Profile>();
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles').select('id, full_name, department').in('id', userIds).returns<Profile[]>();
        if (profilesError) throw profilesError;
        profilesData?.forEach(p => profilesMap.set(p.id, p));
      }

      // Schritt D: Kurse holen
      const coursesMap = new Map<string, Course>();
      if (courseIds.length > 0) {
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses').select('id, title').in('id', courseIds).returns<Course[]>();
        if (coursesError) throw coursesError;
        coursesData?.forEach(c => coursesMap.set(c.id, c));
      }

      // Schritt E: Daten kombinieren
      combinedRequests = requestsData.map(req => {
        const profile = profilesMap.get(req.user_id);
        const course = coursesMap.get(req.course_id);
        return {
          ...req,
          course_title: course?.title ?? null,
          user_full_name: profile?.full_name ?? null,
          user_department: profile?.department ?? null,
        };
      });
    }
  } catch (error: unknown) {
    console.error('Fehler beim Abrufen oder Kombinieren der Trainingsanfragen:', JSON.stringify(error, null, 2));
    let message = 'Ein unbekannter Fehler ist aufgetreten.';
    if (error instanceof Error) message = error.message;
    fetchError = message;
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

  // --- JSX Rendering der Seite ---
  return (
    <main className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Admin Dashboard - Schulungsanfragen</h1>

      {/* Fehleranzeige */}
      {fetchError && (
        <div className="text-red-400 bg-red-900/50 border border-red-800 p-4 rounded-md mb-6">
          <p><span className="font-semibold">Fehler:</span> {fetchError}</p>
        </div>
      )}

      {/* Nachricht, wenn keine Anfragen vorhanden */}
      {!fetchError && combinedRequests.length === 0 && (
        <div className="text-center p-8 border border-dashed border-neutral-700 rounded-lg bg-neutral-900/50">
           <p className="text-neutral-500">Aktuell liegen keine Schulungsanfragen vor.</p>
        </div>
      )}

      {/* Tabelle mit Anfragen */}
      {!fetchError && combinedRequests.length > 0 && (
        <div className="rounded-lg border border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-700 ">
              <thead className="bg-neutral-800/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">Angefragt</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">Benutzer</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">Kurs</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">Status</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400 w-[30%]">Notizen</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-900">{
                combinedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-800/40 transition-colors group">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-300 align-top">{formatDate(req.created_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white align-top">
                      {req.user_full_name ?? <span className="italic text-neutral-500">Unbekannt</span>}
                      {req.user_department && <span className="block text-xs text-neutral-400">{req.user_department}</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-300 align-top">{req.course_title ?? <span className="italic text-neutral-500">N/A</span>}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm align-top">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        req.status === 'pending' ? 'bg-yellow-400/10 text-yellow-300' :
                        req.status === 'approved' ? 'bg-green-500/10 text-green-300' :
                        req.status === 'rejected' ? 'bg-red-500/10 text-red-300' :
                        req.status === 'completed' ? 'bg-blue-500/10 text-blue-300' : 'bg-gray-600/10 text-gray-400'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400 align-top">
                       <AdminNoteCell requestId={req.id} initialNote={req.admin_notes} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium align-top">
                       <div className="flex items-center gap-2">
                        {req.status === 'pending' && (
                          <>
                            <form action={updateRequestStatus}>
                              <input type="hidden" name="requestId" value={req.id} />
                              <input type="hidden" name="newStatus" value="approved" />
                              <SubmitButton
                                  text="Genehmigen"
                                  pendingText="Speichern..."
                                  className="text-green-200 bg-green-600/30 hover:bg-green-600/50 border-green-600/50"
                                  title="Anfrage genehmigen"
                              />
                            </form>
                            <form action={updateRequestStatus}>
                              <input type="hidden" name="requestId" value={req.id} />
                              <input type="hidden" name="newStatus" value="rejected" />
                              <SubmitButton
                                  text="Ablehnen"
                                  pendingText="Speichern..."
                                  className="text-red-200 bg-red-600/30 hover:bg-red-600/50 border-red-600/50"
                                  title="Anfrage ablehnen"
                              />
                            </form>
                          </>
                        )}
                        {(req.status === 'approved' || req.status === 'rejected' || req.status === 'completed') && (
                          <form action={updateRequestStatus}>
                            <input type="hidden" name="requestId" value={req.id} />
                            <input type="hidden" name="newStatus" value="pending" />
                            <SubmitButton
                                text="Zurücksetzen"
                                pendingText="Speichern..."
                                className="text-yellow-200 bg-yellow-600/30 hover:bg-yellow-600/50 border-yellow-600/50"
                                title="Status auf 'pending' zurücksetzen"
                            />
                          </form>
                         )}
                      </div>
                    </td>
                  </tr>
                ))
              }</tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}