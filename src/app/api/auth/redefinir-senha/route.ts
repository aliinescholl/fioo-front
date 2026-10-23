import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.API_BASE_URL

async function extractError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data === "string") return data
    return data.message ?? data.title ?? data.detail ?? fallback
  } catch {
    return fallback
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, novaSenha } = await request.json()
    if (!token || !novaSenha) {
      return NextResponse.json({ error: "Token e nova senha são obrigatórios" }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/api/usuarios/redefinir-senha`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, novaSenha }),
    })

    if (!response.ok) {
      const errorMsg = await extractError(response, "Token inválido ou expirado")
      return NextResponse.json({ error: errorMsg }, { status: response.status })
    }

    let data = {}
    try {
      data = await response.json()
    } catch {
      data = { message: "Senha redefinida com sucesso" }
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Erro ao redefinir senha" }, { status: 500 })
  }
}
