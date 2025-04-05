// src/components/CourseList.tsx
'use client';

// Korrektur: Ungenutzte Imports entfernt (useTransition, useRef, useEffect, saveAdminNote)
import { useState } from 'react';
// Falls du saveAdminNote später wieder brauchst, musst du es wieder importieren:
// import { saveAdminNote } from '@/app/admin/actions';

// Typdefinitionen
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
  errorMessage: string | null;
};

// Korrektur: Ungenutzte State-Typen entfernt
// type SubmissionStatus = 'idle' | 'loading' | 'submitted' | 'error';
// type CourseSubmissionStatus = {
//   [courseId: string]: SubmissionStatus;
// };

export default function CourseList({ courses, levels, errorMessage }: CourseListProps) {
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel>(levels[0] || 'beginner');
  // Korrektur: Ungenutzte States für Notiz-Submission entfernt
  // const [submissionStatus, setSubmissionStatus] = useState<CourseSubmissionStatus>({});
  // const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Filterung der Kurse
  const filteredCourses = courses.filter(
    (course) => course.experience_level === selectedLevel
  );

  // Korrektur: Ungenutzte handleFormSubmit und getButtonState entfernt (bezogen sich auf Notizen)

  // --- JSX Rendering ---
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-5 border-b border-neutral-700 pb-2">
        Kurse für Level: <span className="capitalize text-indigo-400">{selectedLevel}</span>
      </h2>

      {/* Level-Auswahl */}
      <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-3">
        <span className="font-medium text-neutral-400 text-sm mr-2">Level wählen:</span>
        {levels.map((level) => (
          <label
            key={level}
            className={`
              cursor-pointer capitalize px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-150 ease-in-out focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-neutral-950 focus-within:ring-indigo-500
              border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-700/60
              data-[checked=true]:bg-indigo-600 data-[checked=true]:border-indigo-500 data-[checked=true]:text-white data-[checked=true]:shadow-md
            `}
            data-checked={selectedLevel === level}
          >
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

      {/* Notiz-Fehleranzeige (entfernt, da Logik fehlt) */}
      {/* {submissionError && (...)} */}

      {/* Server-Fehleranzeige */}
      {errorMessage && (
        <div className="text-red-400 bg-red-900/50 border border-red-800 p-4 rounded-md mb-6">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Anzeige der gefilterten Kurse */}
      {!errorMessage && filteredCourses.length > 0 && (
        <div className="space-y-5">
          {filteredCourses.map((course) => (
            <div key={course.id} className="border border-neutral-800 bg-neutral-950/30 p-5 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-white">{course.title}</h3>
              <p className="text-neutral-300 text-sm mt-2 mb-4">{course.content}</p>
              {/* Anfrage-Button */}
              <button
                 // Hier muss die Logik für die Anfrage rein (z.B. Aufruf einer Server Action)
                 onClick={() => alert(`Anfrage für "${course.title}" (ID: ${course.id}) - Logik fehlt noch!`)}
                 className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
              >
                Schulung anfragen
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Nachricht, wenn keine Kurse für das Level gefunden */}
      {!errorMessage && filteredCourses.length === 0 && (
        <div className="text-center p-8 border border-dashed border-neutral-700 rounded-lg bg-neutral-900/50">
            {/* Korrektur: Anführungszeichen entfernt */}
            <p className="text-neutral-500">Für das Level <span className="capitalize font-semibold text-neutral-400">{selectedLevel}</span> wurden keine Kurse gefunden.</p>
        </div>
      )}
    </div>
  );
}