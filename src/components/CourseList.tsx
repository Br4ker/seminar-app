/* eslint-disable react/no-unescaped-entities */
// src/components/CourseList.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client'; // Client für Browser-Interaktionen importieren

// Typdefinitionen (sollten mit der Seite übereinstimmen)
type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
type Course = {
  id: string;
  title: string;
  content: string;
  experience_level: CourseLevel;
};
type CourseListProps = {
  courses: Course[];
  levels: CourseLevel[];
  errorMessage: string | null; // Fehlermeldung vom Server-Datenabruf
};

// Typ für den Status des Sendevorgangs pro Kurs
type SubmissionStatus = 'idle' | 'loading' | 'submitted' | 'error';
// State-Objekt, das den Status für jede Kurs-ID speichert
type CourseSubmissionStatus = {
  [courseId: string]: SubmissionStatus;
};

export default function CourseList({ courses, levels, errorMessage }: CourseListProps) {
  // State für das ausgewählte Level (wie bisher)
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel>(levels[0] || 'beginner');
  // State für den Sende-Status der Buttons (pro Kurs)
  const [submissionStatus, setSubmissionStatus] = useState<CourseSubmissionStatus>({});
  // State für eine allgemeine Fehlermeldung beim Senden
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Supabase Client-Instanz erstellen (nur einmal)
  const supabase = createClient();

  // Filterung der Kurse (wie bisher)
  const filteredCourses = courses.filter(
    (course) => course.experience_level === selectedLevel
  );

  // Async Funktion, die beim Klick auf den Button aufgerufen wird
  const handleRequest = async (courseId: string) => {
    setSubmissionError(null); // Vorherige Fehlermeldungen zurücksetzen
    setSubmissionStatus(prev => ({ ...prev, [courseId]: 'loading' })); // Status für diesen Kurs auf 'loading' setzen

    try {
      // 1. Aktuellen Benutzer holen
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      // Wenn kein User gefunden oder Fehler -> Abbrechen
      if (userError || !user) {
        throw new Error('Benutzer nicht gefunden oder nicht eingeloggt.');
      }

      // 2. Anfrage in die Datenbank einfügen
      const { error: insertError } = await supabase
        .from('training_requests')
        .insert({
          course_id: courseId,
          user_id: user.id
          // Der 'status' wird durch den DB-Default auf 'pending' gesetzt
        });

      // Wenn Fehler beim Einfügen -> Abbrechen
      if (insertError) {
        throw insertError;
      }

      // 3. Erfolg! Status auf 'submitted' setzen
      setSubmissionStatus(prev => ({ ...prev, [courseId]: 'submitted' }));

      // Optional: Nach ein paar Sekunden den Status zurücksetzen,
      // damit der Benutzer evtl. erneut anfragen kann (falls gewünscht).
      // setTimeout(() => {
      //   setSubmissionStatus(prev => ({ ...prev, [courseId]: 'idle' }));
      // }, 5000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Fehlerbehandlung für alle Fehler im try-Block
      console.error('Fehler beim Senden der Schulungsanfrage:', error);
      setSubmissionStatus(prev => ({ ...prev, [courseId]: 'error' }));
      setSubmissionError(`Fehler: ${error.message || 'Unbekannter Fehler.'}`);

      // Optional: Fehlerstatus nach einiger Zeit zurücksetzen, um erneuten Versuch zu ermöglichen
      // setTimeout(() => {
      //    setSubmissionStatus(prev => ({ ...prev, [courseId]: 'idle' }));
      //    setSubmissionError(null);
      // }, 5000);
    }
  };

  // Hilfsfunktion, um Text, Deaktivierungsstatus und CSS-Klasse für den Button zu bestimmen
  const getButtonState = (courseId: string) => {
    const status = submissionStatus[courseId] || 'idle';
    switch (status) {
      case 'loading':
        return { text: 'Sende...', disabled: true, className: 'bg-gray-500' };
      case 'submitted':
        // Hier könnte man auch ein Icon hinzufügen
        return { text: 'Angefragt ✓', disabled: true, className: 'bg-green-600 cursor-not-allowed' };
      case 'error':
        // Erlaube erneuten Versuch bei Fehler
        return { text: 'Erneut versuchen', disabled: false, className: 'bg-red-600 hover:bg-red-700' };
      case 'idle':
      default:
        return { text: 'Schulung anfragen', disabled: false, className: 'bg-indigo-600 hover:bg-indigo-700' };
    }
  };

  // --- JSX Rendering ---
  return (
    <div>
      {/* Überschrift und Level-Selector (wie bisher) */}
      <h2 className="text-2xl font-semibold mb-5 border-b border-neutral-700 pb-2">
        Kurse für Level: <span className="capitalize text-indigo-400">{selectedLevel}</span>
      </h2>
      <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-medium text-neutral-400 text-sm">Level wählen:</span>
        {levels.map((level) => (
          <label key={level} /* ... Styling wie bisher ... */ data-checked={selectedLevel === level}>
            <input
              type="radio"
              name="experienceLevel"
              value={level}
              checked={selectedLevel === level}
              onChange={(e) => setSelectedLevel(e.target.value as CourseLevel)}
              className="opacity-0 w-0 h-0 absolute"
            />
            {level}
          </label>
        ))}
      </div>

      {/* Anzeige einer allgemeinen Fehlermeldung vom Sendevorgang */}
      {submissionError && (
        <div className="text-red-300 bg-red-900/60 border border-red-700 p-3 rounded-md mb-6 text-sm transition-opacity duration-300">
          <p><span className="font-semibold">Fehler bei der Anfrage:</span> {submissionError}</p>
        </div>
      )}

      {/* Anzeige der Fehlermeldung vom Server (falls Kurse nicht geladen werden konnten) */}
      {errorMessage && (
        <div className="text-red-400 bg-red-900/50 border border-red-800 p-4 rounded-md mb-6">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Anzeige der gefilterten Kurse */}
      {!errorMessage && filteredCourses.length > 0 && (
        <div className="space-y-5">
          {filteredCourses.map((course) => {
            // Hole den aktuellen Status für diesen spezifischen Button
            const buttonState = getButtonState(course.id);
            return (
              <div key={course.id} className="border border-neutral-800 bg-neutral-950/30 p-5 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-white">{course.title}</h3>
                <p className="text-neutral-300 text-sm mt-2 mb-4">{course.content}</p>
                <button
                  // Rufe handleRequest mit der ID dieses Kurses auf
                  onClick={() => handleRequest(course.id)}
                  // Deaktiviere Button basierend auf Status
                  disabled={buttonState.disabled}
                  // Setze CSS-Klassen und Text basierend auf Status
                  className={`min-w-[120px] text-center px-4 py-1.5 text-white text-xs font-semibold rounded-md transition-all duration-200 disabled:opacity-70 ${buttonState.className}`}
                >
                  {buttonState.text}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Nachricht, wenn keine Kurse für das Level gefunden wurden (wie bisher) */}
      {!errorMessage && filteredCourses.length === 0 && (
        <div className="text-center p-8 border border-dashed border-neutral-700 rounded-lg bg-neutral-900/50">
          <p className="text-neutral-500">Für das Level <span className="capitalize font-semibold text-neutral-400">"{selectedLevel}"</span> wurden keine Kurse gefunden.</p>
        </div>
      )}
    </div>
  );
}