// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Session aktualisieren (wichtig)
  const { data: { session } } = await supabase.auth.getSession()

  // ==================================================
  // NEU: Admin-Routen schützen
  // ==================================================
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/admin') && !session) {
    // Wenn Pfad mit /admin beginnt und KEINE Session existiert -> zum Login umleiten
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    // Optional: Füge eine Nachricht oder den ursprünglichen Pfad hinzu
    redirectUrl.searchParams.set(`message`, 'Bitte für den Admin-Bereich anmelden.')
    redirectUrl.searchParams.set(`redirectedFrom`, pathname)
    console.log('Redirecting to login from admin path'); // Log für Debugging
    return NextResponse.redirect(redirectUrl)
  }
  // ==================================================

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}