// src/app/admin/actions.ts (oder src/app/actions.ts) - KORRIGIERTE VERSION
'use server';

import { createClient } from '@/utils/supabase/server';
// import { cookies } from 'next/headers'; // Nicht mehr direkt hier benötigt
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js'; // User-Typ importieren

// ==============================================================
// HILFSFUNKTION: Stellt sicher, dass der aktuelle User Admin ist
// Gibt bei Erfolg das User-Objekt zurück, sonst leitet sie um oder wirft Fehler.
// ==============================================================
async function ensureAdmin(): Promise<User> {
  // KEIN 'const cookieStore = cookies();' hier
  // createClient OHNE await und OHNE Argument aufrufen
  const supabase = createClient();

  // 1. Authentifizierung prüfen
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('ensureAdmin Check: Kein Benutzer gefunden.');
    redirect('/login?message=Aktion fehlgeschlagen: Nicht angemeldet');
  }

  // 2. Admin-Rolle aus dem Profil prüfen
  let isAdmin = false;
  try {
    console.log(`[ensureAdmin] Prüfe Rolle für User ID: ${user.id}`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role') // Nur die 'role'-Spalte holen
      .eq('id', user.id) // Für den aktuell eingeloggten Benutzer
      .single();

    console.log(`[ensureAdmin] Profilabfrage Ergebnis: data=${JSON.stringify(profileData)}, error=${JSON.stringify(profileError)}`);

    // Fehler behandeln (außer 'nicht gefunden')
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = Row not found
       throw new Error(`Profilprüfung fehlgeschlagen: ${profileError.message}`);
    }

    // Rolle prüfen
    if (profileData?.role === 'admin') {
      isAdmin = true;
    }
  } catch (error) {
     console.error("[ensureAdmin] Fehler während der Admin-Prüfung:", error);
     // Bei Fehlern in der Prüfung sicherheitshalber den Zugriff verweigern
     throw new Error('Fehler bei der Berechtigungsprüfung.');
  }

  // 3. Wenn kein Admin, Fehler werfen oder umleiten
  if (!isAdmin) {
    console.warn(`[ensureAdmin] Zugriff verweigert: User ${user.id} (${user.email}) ist kein Admin.`);
    // Wir werfen einen Fehler, der in der aufrufenden Action gefangen werden kann
    throw new Error('Keine Berechtigung für diese Aktion.');
    // Alternative: redirect('/?error=Permission Denied');
  }

  console.log(`[ensureAdmin] Admin-Check erfolgreich für User ${user.id}`);
  return user; // Gebe das User-Objekt zurück, falls es benötigt wird
}
// ==============================================================


type NewStatus = 'approved' | 'rejected' | 'pending' | 'completed';

// --- Server Action: updateRequestStatus (jetzt mit ensureAdmin) ---
export async function updateRequestStatus(formData: FormData) {
  console.log('[Server Action] updateRequestStatus gestartet.');
  // createClient OHNE await und OHNE Argument aufrufen
  const supabase = createClient();

  try {
    // 1. Sicherstellen, dass der User Admin ist (wirft Fehler/redirect wenn nicht)
    await ensureAdmin();

    // 2. Daten aus FormData holen
    const requestId = formData.get('requestId') as string;
    const newStatus = formData.get('newStatus') as NewStatus;

    if (!requestId || !newStatus || !['approved', 'rejected', 'pending', 'completed'].includes(newStatus)) {
      console.error('Ungültige Daten für Status-Update:', { requestId, newStatus });
      throw new Error('Ungültige Eingabedaten.');
    }
    console.log(`Parameter erhalten: requestId=${requestId}, newStatus=${newStatus}`);

    // 3. Datenbank-Update
    const { error: updateError } = await supabase
      .from('training_requests')
      .update({ status: newStatus, processed_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // 4. Revalidate
    revalidatePath('/admin/dashboard');
    console.log(`Request ${requestId} erfolgreich auf Status ${newStatus} gesetzt.`);

  } catch (error) {
    console.error('Fehler in updateRequestStatus:', error);
    // Fehler wird geloggt. Funktion gibt implizit void zurück.
  }
}

// --- Server Action: saveAdminNote (jetzt mit ensureAdmin) ---
export async function saveAdminNote(formData: FormData) {
   console.log('[Server Action] saveAdminNote gestartet.');
   // createClient OHNE await und OHNE Argument aufrufen
   const supabase = createClient();

   try {
     // 1. Sicherstellen, dass der User Admin ist
     await ensureAdmin(); // Wirft Fehler/redirect wenn nicht

     // 2. Daten holen
     const requestId = formData.get('requestId') as string;
     const adminNote = formData.get('adminNote') as string;

     if (!requestId) {
         console.error('Missing requestId for saving note.');
         throw new Error('Fehlende Request ID.');
     }
     console.log(`Parameter erhalten: requestId=${requestId}`);

     // 3. Datenbank-Update
     const { error: updateError } = await supabase
       .from('training_requests')
       .update({ admin_notes: adminNote })
       .eq('id', requestId);

     if (updateError) throw updateError;

     // 4. Revalidate
     revalidatePath('/admin/dashboard');
     console.log(`Notiz für Request ${requestId} gespeichert.`);

   } catch (error) {
        console.error('Fehler in saveAdminNote:', error);
   }
}

// --- Server Action: handleCourseInquiry ---
export async function handleCourseInquiry(courseId: string, courseTitle: string) {
  console.log(`[Server Action] handleCourseInquiry gestartet für Kurs "${courseTitle}" (ID: ${courseId}).`);

  try {
    // KEIN 'const cookieStore = cookies();' hier
    // createClient OHNE await und OHNE Argument aufrufen
    const supabase = createClient();

    // Use getUser() to securely get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('handleCourseInquiry: No user found.');
      throw new Error('Nicht angemeldet.');
    }

    const userId = user.id;

    // Validate the data
    if (!courseId || typeof courseId !== 'string') {
      console.error('handleCourseInquiry: Invalid courseId:', courseId);
      throw new Error('Ungültige Kurs-ID.');
    }
    if (!courseTitle || typeof courseTitle !== 'string') {
      console.error('handleCourseInquiry: Invalid courseTitle:', courseTitle);
      throw new Error('Ungültiger Kurstitel.');
    }
      if (!userId || typeof userId !== 'string') {
      console.error('handleCourseInquiry: Invalid userId:', userId);
      throw new Error('Ungültige User-ID.');
    }

    // Save the course inquiry to the database
    const { data, error } = await supabase
      .from('training_requests')
      .insert([
        {
          course_id: courseId,
          //course_title: courseTitle, // Falls diese Spalte nicht existiert, auskommentieren/entfernen
          user_id: userId,
          status: 'pending', // You can set a default status
        },
      ])
      .select('*'); // Select the inserted row to get the ID

    if (error) {
      console.error('handleCourseInquiry: Error saving inquiry to database:', error.message, error.details);
      throw new Error(`Fehler beim Speichern der Anfrage: ${error.message || 'Unbekannter Fehler'}`);
    }

    console.log(`[Server Action] handleCourseInquiry: Kursanfrage für Kurs "${courseTitle}" (ID: ${courseId}) erfolgreich gespeichert. Inquiry ID: ${data && data[0]?.id}`);

    // You can add further logic here, such as sending an email notification to the admin

    revalidatePath('/'); // or a more specific path if needed
    return { success: true, message: 'Anfrage erfolgreich gesendet!' };

  } catch (error) {
    console.error('handleCourseInquiry: Error:', error);
    return { success: false, message: (error as Error).message || 'Ein Fehler ist aufgetreten.' };
  }
}