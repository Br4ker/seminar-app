// src/components/CourseList.tsx
'use client'; // Wichtig für useState, useTransition, onClick

import React, { useState, useTransition } from 'react';
// Korrigierter Import für die Typen (stelle sicher, dass Course und CourseLevel in page.tsx exportiert werden!)
import type { Course, CourseLevel } from '@/app/topics/[slug]/page';
// Korrekter Import für die Server Action (Pfad prüfen!)
import { handleCourseInquiry } from '@/app/actions';

interface CourseListProps {
    courses: Course[];
    levels: CourseLevel[]; // Stelle sicher, dass CourseLevel exportiert wird
    errorMessage: string | null;
}

export default function CourseList({ courses, levels, errorMessage }: CourseListProps) {
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ [key: string]: { type: 'success' | 'error'; message: string } | null }>({});

    const handleInquiryClick = (courseId: string, courseTitle: string) => {
        setFeedback(prev => ({ ...prev, [courseId]: null }));

        startTransition(async () => {
            console.log(`Anfrage für "${courseTitle}" (ID: ${courseId}) wird gesendet über handleCourseInquiry...`);
            // Rufe die importierte Server Action auf
            const result = await handleCourseInquiry(courseId, courseTitle);

            if (result.success) {
                setFeedback(prev => ({ ...prev, [courseId]: { type: 'success', message: result.message } }));
            } else {
                setFeedback(prev => ({ ...prev, [courseId]: { type: 'error', message: result.message } }));
            }
        });
    };

    if (errorMessage) {
        return <p className="text-red-500 px-4 md:px-0">{errorMessage}</p>; // Etwas Padding hinzugefügt
    }
    if (courses.length === 0 && !errorMessage) {
        return <p className="text-neutral-400 px-4 md:px-0">Für dieses Thema sind aktuell keine Kurse verfügbar.</p>; // Etwas Padding hinzugefügt
    }

    // Kurse nach Level gruppieren
    const coursesByLevel = levels.reduce((acc, level) => {
        acc[level] = courses.filter(course => course.experience_level === level);
        return acc;
    }, {} as Record<CourseLevel, Course[]>);


    return (
        <div className="space-y-10 px-4 md:px-0"> {/* Hauptcontainer mit Abstand und Padding */}
            {levels.map(level => (
                // Rendere nur Level, die auch Kurse haben
                coursesByLevel[level]?.length > 0 && (
                    <div key={level} className="mb-8 last:mb-0"> {/* Abstand zwischen Level-Sektionen */}
                        <h2 className="text-2xl font-semibold capitalize mb-4 border-b border-neutral-700 pb-2">
                            {level}
                        </h2>
                        <ul className="space-y-4">
                            {/* Hier den Typ für 'course' explizit angeben */}
                            {coursesByLevel[level].map((course: Course) => (
                                <li key={course.id} className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-shadow hover:shadow-md hover:shadow-indigo-900/20"> {/* Leichter Hover-Effekt */}
                                    {/* Kursdetails (linke Seite) */}
                                    <div className="flex-grow"> {/* Nimmt verfügbaren Platz ein */}
                                        <h3 className="text-xl font-medium mb-1 text-white">{course.title}</h3>
                                        <p className="text-neutral-300 text-sm mb-2">{course.content || 'Keine Beschreibung verfügbar.'}</p> {/* Fallback für content */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400 mt-1"> {/* Flex-Wrap für kleinere Schirme */}
                                            {course.duration_estimate && <span><span className="font-medium">Dauer:</span> ~{course.duration_estimate}</span>}
                                            {/* Hier könnten weitere Details stehen, z.B. */}
                                            {/* <span>Format: Online</span> */}
                                        </div>

                                        {/* Feedback-Anzeige */}
                                        {feedback[course.id] && (
                                            <p className={`mt-3 text-sm font-medium ${feedback[course.id]?.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                                {feedback[course.id]?.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Button (rechte Seite) */}
                                    <div className="flex-shrink-0 mt-3 sm:mt-0"> {/* Verhindert Schrumpfen, Abstand oben auf kleinen Schirmen */}
                                        <button
                                            onClick={() => handleInquiryClick(course.id, course.title)}
                                            disabled={isPending || feedback[course.id]?.type === 'success'}
                                            className={`px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all duration-150 ease-in-out whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900`} // Bessere Focus-Styles
                                        >
                                            {isPending && feedback[course.id] === null
                                                ? 'Wird gesendet...'
                                                : feedback[course.id]?.type === 'success'
                                                    ? 'Angefragt'
                                                    : 'Kurs anfragen'
                                            }
                                        </button>
                                     </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            ))}
        </div>
    );
}