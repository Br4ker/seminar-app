// src/app/layout.tsx
import type { Metadata } from "next";
// Korrekte Imports für die Geist-Schriftart
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Header from "@/components/Header"; // Dein Header-Import

// Metadaten (angepasst an deine App)
export const metadata: Metadata = {
  title: "Seminar Portal", // Titel anpassen
  description: "Interne Seminare finden und anfragen", // Beschreibung anpassen
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Korrekte Verwendung der importierten Font-Variablen im className
    <html lang="de" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      {/* Dark Theme Hintergrund für den gesamten Body */}
      <body className="bg-neutral-950 text-neutral-100 antialiased flex flex-col min-h-screen">
        <Header /> {/* <-- Header hier einfügen */}
        <div className="flex-grow"> {/* Sorgt dafür, dass der Inhalt den verfügbaren Platz einnimmt */}
          {children} {/* Hier werden deine Seiteninhalte gerendert */}
        </div>
        {/* Optionaler Footer
        <footer className="container mx-auto p-4 text-center text-xs text-neutral-500">
          Seminar Portal Footer
        </footer>
        */}
      </body>
    </html>
  );
}