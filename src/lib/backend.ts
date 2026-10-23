import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/cookie"

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

/**
 * Encaminha a requisição ao backend .NET com o token do cookie e devolve
 * { error } com a mensagem do backend em caso de falha (mesmo padrão das demais rotas).
 */
export async function encaminhar(
  request: NextRequest,
  caminho: string,
  { method = "GET", erroPadrao }: { method?: string; erroPadrao: string }
) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const temCorpo = method !== "GET" && method !== "DELETE"
    const response = await fetch(`${API_BASE_URL}${caminho}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(temCorpo ? { "Content-Type": "application/json" } : {}),
      },
      body: temCorpo ? await request.text() : undefined,
      cache: "no-store",
    })

    if (!response.ok) {
      const error = await extractError(response, erroPadrao)
      return NextResponse.json({ error }, { status: response.status })
    }

    if (response.status === 204) return NextResponse.json({ success: true })
    return NextResponse.json(await response.json(), { status: response.status })
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
