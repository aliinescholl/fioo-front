import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME, COOKIE_CLEAR_OPTIONS } from "@/lib/cookie"
import { decodeJwt, isTokenExpired } from "@/lib/jwt"

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  if (isTokenExpired(token)) {
    const res = NextResponse.json({ user: null }, { status: 401 })
    res.cookies.set(COOKIE_NAME, "", COOKIE_CLEAR_OPTIONS)
    return res
  }

  const payload = decodeJwt(token)
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  // Claims geradas pelo GerarJwt() do backend:
  // sub → ID, email → email, nome → nome, nome_usuario → username, tipo → UsuarioTipo
  const nome = payload.nome ?? payload.email?.split("@")[0] ?? "Usuário"

  return NextResponse.json({
    user: {
      id: payload.sub ?? "",
      email: payload.email ?? "",
      nome,
      nomeUsuario: payload.nome_usuario ?? "",
      role: payload.tipo ?? null,     // UsuarioTipo: "Costureiro" | "Fornecedor" | ...
      inicial: nome.charAt(0).toUpperCase(),
    },
  })
}
