/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/SubmitButton.tsx
'use client'; // Diese Komponente benötigt den Client-Hook

// Wichtig: Import aus 'react-dom', nicht 'react'
import { useFormStatus } from 'react-dom';

// Typdefinition für die Props unseres Buttons
type SubmitButtonProps = {
  text: string; // Text für den normalen Zustand
  pendingText: string; // Text während des Ladens
  className?: string; // Optionale CSS-Klassen für den normalen Zustand
  pendingClassName?: string; // Optionale CSS-Klassen für den Ladezustand
  // Erlaubt das Weitergeben anderer Standard-Button-Attribute wie 'title'
  [key: string]: any;
};

export default function SubmitButton({
  text,
  pendingText,
  className = "px-2 py-0.5 text-xs font-medium rounded transition-colors border", // Standard-Styling
  pendingClassName = "bg-gray-500/50 border-gray-600 text-neutral-400 cursor-wait", // Styling während des Ladens
  ...props // Restliche Props (z.B. title)
}: SubmitButtonProps) {
  // useFormStatus muss *innerhalb* eines <form>-Elements verwendet werden.
  // Es gibt den pending-Status des übergeordneten Formulars zurück.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      // Button deaktivieren, während das Formular sendet
      disabled={pending}
      // Kombinieren der Basis-Klassen mit den spezifischen und den pending-Klassen
      className={`${className} ${pending ? pendingClassName : ''} disabled:opacity-70 disabled:cursor-not-allowed`}
      aria-disabled={pending} // Für Barrierefreiheit
      {...props} // Restliche Props weitergeben
    >
      {/* Text ändern, wenn 'pending' true ist */}
      {pending ? pendingText : text}
    </button>
  );
}