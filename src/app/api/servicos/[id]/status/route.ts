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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { id } = await params

    // Impede alteração de status em serviço já concluído ou cancelado
    const atualRes = await fetch(`${API_BASE_URL}/api/servicos/${id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })

    if (atualRes.ok) {
      const servicoAtual = await atualRes.json()
      const statusAtual = Number(servicoAtual?.status ?? servicoAtual?.Status)
      if (statusAtual === SERVICO_STATUS.Concluido) {
        return NextResponse.json(
          { error: "Este serviço já foi concluído e não pode mais ser alterado." },
          { status: 403 }
        )
      }
      if (statusAtual && statusAtual !== SERVICO_STATUS.EmAndamento) {
        return NextResponse.json(
          { error: "Este serviço já foi encerrado e seu status não pode ser alterado." },
          { status: 403 }
        )
      }
    }

    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/api/servicos/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await extractError(response, "Erro ao alterar o status")
      return NextResponse.json({ error }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
