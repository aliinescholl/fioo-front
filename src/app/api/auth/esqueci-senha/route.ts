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
    const { email } = await request.json()
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/api/usuarios/esqueci-senha`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    })

    if (!response.ok) {
      const errorMsg = await extractError(response, "Erro ao processar solicitação de recuperação de senha")
      return NextResponse.json({ error: errorMsg }, { status: response.status })
    }

    let data = {}
    try {
      data = await response.json()
    } catch {
      data = { message: "Solicitação processada com sucesso" }
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Erro interno ao processar solicitação" }, { status: 500 })
  }
}
