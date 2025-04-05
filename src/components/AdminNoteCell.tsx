// src/components/AdminNoteCell.tsx
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { saveAdminNote } from '@/app/admin/actions'; // Importiere die neue Server Action

type AdminNoteCellProps = {
  requestId: string;
  initialNote: string | null; // Die aktuelle Notiz aus der DB
};

export default function AdminNoteCell({ requestId, initialNote }: AdminNoteCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  // State für den Text im Textarea, initialisiert mit der aktuellen Notiz
  const [noteText, setNoteText] = useState(initialNote ?? '');
  // useTransition für Ladezustand ohne UI-Blockierung
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref für Fokus

  // Effekt, um das Textarea zu fokussieren, wenn der Editier-Modus startet
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select(); // Optional: Text markieren
    }
  }, [isEditing]);

  // Handler für das Absenden des Formulars
  const handleFormSubmit = async (formData: FormData) => {
    setError(null); // Fehler zurücksetzen

    // startTransition sorgt dafür, dass die UI während der Action nicht blockiert
    startTransition(async () => {
      try {
        // Rufe die Server Action auf
        await saveAdminNote(formData);
        // Schließe den Editor bei Erfolg (revalidatePath aktualisiert die Anzeige)
        setIsEditing(false);
      } catch (e) {
        // Fängt Fehler, falls die Action selbst einen wirft (sollte sie aber nicht mehr tun)
        console.error("Fehler beim Aufruf von saveAdminNote:", e);
        setError("Fehler beim Speichern der Notiz.");
      }
    });
  };

  // --- Rendering-Logik ---

  // Wenn im Bearbeitungsmodus: Zeige Formular mit Textarea
  if (isEditing) {
    return (
      <form action={handleFormSubmit} className="space-y-2">
        {/* Wichtig: Die Request-ID muss mitgesendet werden */}
        <input type="hidden" name="requestId" value={requestId} />
        <textarea
          ref={textareaRef} // Ref zuweisen
          name="adminNote" // Dieser Name wird in der Action erwartet
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={4} // Mehr Platz für Notizen
          className="w-full p-2 text-sm bg-neutral-700 border border-neutral-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-neutral-400 disabled:opacity-50"
          placeholder="Admin-Notiz eingeben..."
          disabled={isPending} // Deaktivieren während des Speicherns
        />
        {/* Fehlermeldung anzeigen, falls Speichern fehlschlägt */}
        {error && <p className="text-xs text-red-400">{error}</p>}
        {/* Buttons zum Speichern und Abbrechen */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-2.5 py-1 text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-wait"
          >
            {isPending ? 'Speichern...' : 'Speichern'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)} // Schließt den Editor
            disabled={isPending}
            className="px-2.5 py-1 text-xs font-medium rounded text-neutral-300 hover:bg-neutral-700 disabled:opacity-50"
          >
            Abbrechen
          </button>
        </div>
      </form>
    );
  }

  // Wenn NICHT im Bearbeitungsmodus: Zeige die Notiz und den Bearbeiten-Button
  return (
    // Gruppe für Hover-Effekt auf Button
    <div className="flex items-start justify-between gap-2 group min-h-[24px]">
      {/* Angezeigte Notiz (oder Platzhalter) */}
      <div className="text-sm text-neutral-400 max-w-xs break-words flex-grow pt-0.5 pr-1">
        {/* Zeige initialNote, da noteText nur während der Bearbeitung aktuell ist */}
        {initialNote || <span className="italic text-neutral-600">Keine Notiz</span>}
      </div>
      {/* Bearbeiten-Button (wird bei Hover auf Zeile sichtbar) */}
      <button
        onClick={() => {
          setNoteText(initialNote ?? ''); // Textarea mit aktueller Notiz füllen
          setIsEditing(true);          // Editier-Modus starten
          setError(null);              // Fehler zurücksetzen
        }}
        // Macht Button etwas unauffälliger, bis man hovert
        className="text-indigo-400 hover:text-indigo-300 text-xs hover:underline pt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        title="Notiz bearbeiten"
      >
        Bearbeiten
      </button>
    </div>
  );
}