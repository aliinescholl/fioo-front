import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/cookie"
import { SERVICO_STATUS } from "@/types/servico"

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
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const servicoId = body?.servicoId ?? body?.ServicoId

    if (servicoId != null) {
      const atualRes = await fetch(`${API_BASE_URL}/api/servicos/${servicoId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (atualRes.ok) {
        const servicoAtual = await atualRes.json()
        const statusAtual = Number(servicoAtual?.status ?? servicoAtual?.Status)
        if (statusAtual === SERVICO_STATUS.Concluido) {
          return NextResponse.json(
            { error: "Não é permitido candidatar-se a um serviço concluído." },
            { status: 403 }
          )
        }
        if (statusAtual && statusAtual !== SERVICO_STATUS.EmAndamento) {
          return NextResponse.json(
            { error: "Este serviço foi encerrado e não aceita novas candidaturas." },
            { status: 403 }
          )
        }
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/candidaturas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await extractError(response, "Erro ao criar candidatura")
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
