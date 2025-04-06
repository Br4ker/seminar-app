// src/app/topics/[slug]/page.tsx
import { createClient } from '@/utils/supabase/server'; // Import bleibt
import { notFound } from 'next/navigation';
import CourseList from '@/components/CourseList';
import Link from 'next/link';

// Typen (bleiben unverändert)
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

// Props-Typ an Next.js 15 anpassen: params ist ein Promise!
interface TopicPageProps {
  params: Promise<{ slug: string }>;
  // searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // Falls du searchParams brauchst
}

// Props-Typ hier verwenden
export default async function TopicPage({ params }: TopicPageProps) {
  // Zuerst das params-Promise auflösen
  const resolvedParams = await params;
  // Dann auf den slug im aufgelösten Objekt zugreifen
  const topicSlug = resolvedParams.slug;

  // createClient bleibt synchron (wie im Workaround von server.ts)
  const supabase = createClient();

  // 1. Details des spezifischen Themas anhand des Slugs abrufen
  // Hier den aufgelösten topicSlug verwenden
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', topicSlug)
    .single();

  if (topicError || !topic) {
    console.error(`Fehler beim Abrufen des Themas mit Slug "${topicSlug}":`, topicError);
    notFound();
  }

  // 2. Alle aktiven Kurse für dieses Thema abrufen (Rest bleibt gleich)
  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .eq('topic_id', topic.id)
    .eq('is_active', true)
    .order('title', { ascending: true });

  let courseLoadErrorMessage: string | null = null;
  if (coursesError) {
    console.error(`Fehler beim Abrufen der Kurse für Topic ID ${topic.id}:`, coursesError);
    courseLoadErrorMessage = `Beim Laden der Kurse für "${topic.name}" ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.`;
  }

  const courses = (coursesData as Course[]) ?? [];
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

      {/* Anzeige der Themen-Details */}
      <div className="mb-10 border-b border-neutral-800 pb-6">
        <h1 className="text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">{topic.name}</h1>
        <p className="text-lg text-neutral-400 max-w-3xl">{topic.description ?? 'Keine Beschreibung verfügbar.'}</p>
      </div>

      {/* Rendern der Client Component */}
      <CourseList
        courses={courses}
        levels={availableLevels}
        errorMessage={courseLoadErrorMessage}
      />
    </main>
  );
}