// src/app/page.tsx
//import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
// LogoutButton wird hier nicht mehr importiert, da er nur im Header ist
// import LogoutButton from '@/components/LogoutButton';
import type { PostgrestError } from '@supabase/supabase-js';
import Link from 'next/link'; // Link wird weiterhin für die Themenkarten benötigt

// Typdefinition für Themen (könnte ausgelagert werden)
type Topic = {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
};

export default async function HomePage() {
  //const cookieStore = cookies();
  const supabase = createClient();

  // Session holen (um zu entscheiden, ob Themen oder Login-Aufforderung gezeigt wird)
  const { data: { session } } = await supabase.auth.getSession();

  // Themen nur laden, wenn User eingeloggt ist (RLS würde es auch verhindern, aber so ist UI klarer)
  let topics: Topic[] | null = null;
  let error: PostgrestError | null = null;

  if (session) {
      const { data: fetchedTopics, error: fetchError } = await supabase
          .from('topics')
          .select('*')
          .order('name', { ascending: true });

      // Typ-Zuweisung (oder Cast, falls nötig)
      topics = fetchedTopics as Topic[] | null;
      error = fetchError;
  }

  return (
    // Hauptcontainer für den Seiteninhalt
    <main className="container mx-auto p-6">

      {/* Überschrift - Der Logout-Button wurde hier entfernt */}
      <h1 className="text-3xl font-bold mb-8 text-center">Verfügbare Seminarthemen</h1>

      {/* Fall 1: Nicht eingeloggt -> Aufforderung anzeigen */}
      {!session && (
        <div className="text-center p-10 border border-dashed border-neutral-700 rounded-lg bg-neutral-900">
            <p className="text-neutral-400">Bitte melde dich an, um die verfügbaren Seminarthemen zu sehen.</p>
            <a href="/login" className="inline-block mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors">
                Zur Anmeldung
            </a>
        </div>
      )}

      {/* Fall 2: Eingeloggt, aber Fehler beim Laden der Themen */}
      {session && error && (
         <div className="text-red-500 bg-red-900/30 p-4 rounded-md">
            <p className="font-semibold">Datenbankfehler:</p>
            <pre className="mt-1 text-sm">{`Code: ${error.code}\nMessage: ${error.message}\nDetails: ${error.details}`}</pre>
         </div>
      )}

      {/* Fall 3: Eingeloggt, keine Themen gefunden */}
      {session && !error && (!topics || topics.length === 0) && (
        <p className="text-neutral-500">Keine Seminarthemen in der Datenbank gefunden.</p>
      )}

      {/* Fall 4: Eingeloggt und Themen erfolgreich geladen -> Grid anzeigen */}
      {session && topics && topics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic: Topic) => (
            // Jede Karte ist ein Link zur Detailseite
            <Link key={topic.id} href={`/topics/${topic.slug}`} className="block hover:no-underline group">
              <div className="border border-neutral-700 rounded-xl p-5 bg-neutral-900 group-hover:bg-neutral-800 transition-colors shadow-lg h-full flex flex-col">
                 <h2 className="text-xl font-semibold mb-3 text-white">{topic.name}</h2>
                 <p className="text-neutral-300 text-sm flex-grow">{topic.description ?? 'Keine Beschreibung verfügbar.'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}