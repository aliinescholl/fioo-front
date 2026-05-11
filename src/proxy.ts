import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isTokenExpired } from "@/lib/jwt"

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "fioo_token"

const PUBLIC_ROUTES = ["/", "/login", "/cadastro"]
const PROTECTED_PREFIXES = ["/consulta", "/perfil", "/servicos"]

// Next.js 16: a função DEVE se chamar "proxy" (ou ser default export)
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value
  const isAuthenticated = token && !isTokenExpired(token)

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const isProtectedRoute = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/consulta", request.url))
  }

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token && isTokenExpired(token) && isProtectedRoute) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
}
