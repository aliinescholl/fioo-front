export type JwtPayload = {
  sub?: string           // ID do usuário
  email?: string
  nome?: string          // claim "nome"
  nome_usuario?: string  // claim "nome_usuario"
  tipo?: string          // claim "tipo" (UsuarioTipo enum)
  exp?: number
  iat?: number
  [key: string]: unknown
}

/**
 * Decodifica o payload de um JWT sem verificar a assinatura.
 * A verificação real é feita pelo backend a cada chamada autenticada.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const json = atob(base64)
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

/** Extrai a role (UsuarioTipo) do payload JWT */
export function getRoleFromToken(token: string): string | null {
  const payload = decodeJwt(token)
  return (payload?.tipo as string | undefined) ?? null
}

/** Verifica se o token está expirado com base no campo `exp` */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload?.exp) return false
  return Date.now() >= payload.exp * 1000
}
