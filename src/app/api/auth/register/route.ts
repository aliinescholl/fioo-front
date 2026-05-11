import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/cookie"

const API_BASE_URL = process.env.API_BASE_URL

/** Extrai mensagem de erro da resposta — backend retorna strings ou objetos */
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
    const { nome, email, password } = await request.json()

    if (!nome || !email || !password) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // 1️⃣ Cadastrar usuário
    const registerRes = await fetch(`${API_BASE_URL}/api/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha: password }),
    })

    if (!registerRes.ok) {
      const error = await extractError(registerRes, "Erro ao realizar cadastro")
      return NextResponse.json({ error }, { status: registerRes.status })
    }

    // 2️⃣ Login automático — cadastro não retorna token
    const loginRes = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha: password }),
    })

    if (!loginRes.ok) {
      const error = await extractError(loginRes, "Cadastro realizado, mas erro no login automático")
      return NextResponse.json({ error }, { status: 500 })
    }

    const { token } = await loginRes.json()

    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    return res
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
