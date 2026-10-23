import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.API_BASE_URL

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/api/usuarios/verificar-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      // Backend retorna strings diretas em BadRequest — extrair a mensagem real
      try {
        const data = await response.json()
        const error = typeof data === "string" ? data : (data.message ?? data.title ?? "Erro ao verificar email")
        return NextResponse.json({ error }, { status: response.status })
      } catch {
        return NextResponse.json({ error: "Erro ao verificar email" }, { status: response.status })
      }
    }

    const data = await response.json()

    // Normaliza: backend pode retornar boolean puro (true/false)
    // ou objeto com campos variados
    let exists: boolean
    if (typeof data === "boolean") {
      exists = data
    } else {
      exists =
        data.exists ??
        data.existente ??
        data.emailExists ??
        data.emailExistente ??
        false
    }

    return NextResponse.json({ exists })
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
