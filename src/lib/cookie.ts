import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies"

export const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "fioo_token"

/** Opções seguras para o cookie de autenticação */
export const COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,                                      // inacessível via document.cookie (anti-XSS)
  secure: process.env.NODE_ENV === "production",       // HTTPS only em produção
  sameSite: "lax",                                     // protege contra CSRF cross-site
  path: "/",
  maxAge: 60 * 60 * 24 * 7,                           // 7 dias
}

/** Opções para invalidar o cookie no logout */
export const COOKIE_CLEAR_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 0,
}
