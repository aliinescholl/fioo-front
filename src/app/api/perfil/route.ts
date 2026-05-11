import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/cookie"

const API_BASE_URL = process.env.API_BASE_URL

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Repassa o FormData diretamente ao backend adicionando o token de auth
    const formData = await request.formData()

    const response = await fetch(`${API_BASE_URL}/api/usuarios/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        // Não definir Content-Type: o fetch define automaticamente com o boundary correto
      },
      body: formData,
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: data.message ?? "Erro ao salvar perfil" },
        { status: response.status }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
