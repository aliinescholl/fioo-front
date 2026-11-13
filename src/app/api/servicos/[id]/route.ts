import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/cookie"
import { decodeJwt } from "@/lib/jwt"
import { aplicarRegraTelefoneServico } from "@/lib/telefoneStore"
import { normalizarDataParaIso, parseMoedaParaNumero } from "@/lib/validation"
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

async function obterServicosAprovadosDoUsuario(userId: string | undefined, token: string): Promise<Set<number>> {
  const aprovados = new Set<number>()
  if (!userId || !API_BASE_URL) return aprovados
  try {
    const res = await fetch(`${API_BASE_URL}/api/candidaturas/em-andamento/${userId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (res.ok) {
      const candidaturas = await res.json()
      if (Array.isArray(candidaturas)) {
        for (const c of candidaturas) {
          const status = c?.status ?? c?.Status
          const servico = c?.servico ?? c?.Servico
          const servicoId = servico?.id ?? servico?.Id ?? c?.servicoId ?? c?.ServicoId
          if (Number(status) === 1 && servicoId != null) {
            aprovados.add(Number(servicoId))
          }
        }
      }
    }
  } catch {
    // ignora falha auxiliar
  }
  return aprovados
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const jwtPayload = decodeJwt(token)
    const userId = jwtPayload?.sub
    const { id } = await params

    const [response, servicosAprovadosIds] = await Promise.all([
      fetch(`${API_BASE_URL}/api/servicos/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }),
      obterServicosAprovadosDoUsuario(userId, token),
    ])

    if (!response.ok) {
      const error = await extractError(response, "Erro ao obter serviço")
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    const sanitizado = await aplicarRegraTelefoneServico(data, userId, servicosAprovadosIds, {
      token,
      apiBaseUrl: API_BASE_URL,
    })
    return NextResponse.json(sanitizado)
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { id } = await params

    // Verifica no backend se o serviço já está concluído ou encerrado antes de permitir edição
    const atualRes = await fetch(`${API_BASE_URL}/api/servicos/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (atualRes.ok) {
      const servicoAtual = await atualRes.json()
      const statusAtual = Number(servicoAtual?.status ?? servicoAtual?.Status)
      if (statusAtual === SERVICO_STATUS.Concluido) {
        return NextResponse.json(
          { error: "Este serviço já foi concluído e suas informações não podem mais ser editadas." },
          { status: 403 }
        )
      }
      if (statusAtual && statusAtual !== SERVICO_STATUS.EmAndamento) {
        return NextResponse.json(
          { error: "Este serviço foi encerrado e não pode mais ser editado." },
          { status: 403 }
        )
      }
    }

    const body = await request.json()

    // Impede qualquer tentativa de alterar status indiretamente via PUT e normaliza campos
    if (body && typeof body === "object") {
      delete body.status
      delete body.Status
      if (typeof body.valor === "string") {
        body.valor = parseMoedaParaNumero(body.valor)
      }
      if (typeof body.dataPrazo === "string" && body.dataPrazo.trim()) {
        body.dataPrazo = normalizarDataParaIso(body.dataPrazo) || body.dataPrazo
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/servicos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await extractError(response, "Erro ao atualizar serviço")
      return NextResponse.json({ error }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
