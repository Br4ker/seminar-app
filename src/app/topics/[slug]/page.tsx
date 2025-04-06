// src/app/topics/[slug]/page.tsx
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation'; // notFound wird verwendet
// import { redirect } from 'next/navigation'; // Entfernt, da nicht verwendet
import CourseList from '@/components/CourseList';
// import type { PostgrestError } from '@supabase/supabase-js'; // Entfernt, da Typinferenz genutzt wird
import Link from 'next/link';

// Typen (bleiben wichtig für die Struktur)
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type Topic = {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
};
export type Course = {
  id: string;
  created_at: string;
  topic_id: string;
  title: string;
  content: string;
  experience_level: CourseLevel;
  duration_estimate: string | null;
  is_active: boolean;
};

interface PageProps {
  params: {
    slug?: string;
  };
}

export default async function TopicPage({ params }: PageProps) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const topicSlug = params?.slug;

  // 1. Details des spezifischen Themas anhand des Slugs abrufen
  //    Entferne .returns<Topic>() - lass TS den Typ aus der Abfrage ableiten
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', topicSlug)
    .single(); // single() liefert das Objekt oder null

  // Wenn Thema nicht gefunden oder Fehler -> 404-Seite anzeigen
  // Diese Prüfung sollte TypeScript helfen zu verstehen, dass 'topic' danach nicht null ist.
  if (topicError || !topic) {
    console.error(`Fehler beim Abrufen des Themas mit Slug "${topicSlug}":`, topicError);
    notFound();
  }

  // Ab hier wissen wir (und TS sollte es auch wissen), dass 'topic' vom Typ Topic (oder ähnlich) ist und nicht null.

  // 2. Alle aktiven Kurse für dieses Thema abrufen
  //    Entferne .returns<Course[]>()
  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .eq('topic_id', topic.id) // topic.id sollte jetzt verfügbar sein
    .eq('is_active', true)
    .order('title', { ascending: true });

  // Fehlermeldung vorbereiten
  let courseLoadErrorMessage: string | null = null;
  if (coursesError) {
    console.error(`Fehler beim Abrufen der Kurse für Topic ID ${topic.id}:`, coursesError);
     // topic.name sollte jetzt verfügbar sein
    courseLoadErrorMessage = `Beim Laden der Kurse für "${topic.name}" ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.`;
  }

  // Die 'coursesData' können wir jetzt sicher als Course[] behandeln (oder null/leer)
  const courses = (coursesData as Course[]) ?? []; // Cast oder Standardwert

  const availableLevels: CourseLevel[] = ['beginner', 'intermediate', 'advanced'];

  return (
    <main className="container mx-auto p-6">
      {/* Zurück-Button */}
      <div className="mb-6 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-indigo-400 transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1">
            <path fillRule="evenodd" d="M14 8a.75.75 0 0 1-.75.75H4.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 1.06L4.56 7.25H13.25A.75.75 0 0 1 14 8Z" clipRule="evenodd" />
          </svg>
          Zur Themenübersicht
        </Link>
      </div>

      {/* Anzeige der Themen-Details - topic.* sollte jetzt funktionieren */}
      <div className="mb-10 border-b border-neutral-800 pb-6">
        <h1 className="text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">{topic.name}</h1>
        <p className="text-lg text-neutral-400 max-w-3xl">{topic.description ?? 'Keine Beschreibung verfügbar.'}</p>
      </div>

      {/* Rendern der Client Component */}
      <CourseList
        courses={courses} // Übergeben der (hoffentlich) korrekt typisierten Kurse
        levels={availableLevels}
        errorMessage={courseLoadErrorMessage}
      />
    </main>
  );
}