import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const authRoutes = ['/login', '/register', '/setup']
  const isAuthRoute = authRoutes.some(r => pathname.startsWith(r))

  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(
    c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  if (!hasSession && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasSession && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
