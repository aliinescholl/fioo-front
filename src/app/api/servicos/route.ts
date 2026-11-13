import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/cookie"
import { decodeJwt } from "@/lib/jwt"
import { aplicarRegraTelefoneServico } from "@/lib/telefoneStore"
import { normalizarDataParaIso, parseMoedaParaNumero } from "@/lib/validation"

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
    // falha silenciosa ao consultar candidaturas auxiliares
  }
  return aprovados
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    if (body && typeof body === "object") {
      if (typeof body.valor === "string") {
        body.valor = parseMoedaParaNumero(body.valor)
      }
      if (typeof body.dataPrazo === "string" && body.dataPrazo.trim()) {
        body.dataPrazo = normalizarDataParaIso(body.dataPrazo) || body.dataPrazo
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/servicos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await extractError(response, "Erro ao cadastrar serviço")
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const jwtPayload = decodeJwt(token)
    const userId = jwtPayload?.sub

    // Repassa filtros, ordenação e paginação; o usuário vem do token no backend
    const url = new URL(`${API_BASE_URL}/api/servicos`)
    url.search = request.nextUrl.search

    const [response, servicosAprovadosIds] = await Promise.all([
      fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }),
      obterServicosAprovadosDoUsuario(userId, token),
    ])

    if (!response.ok) {
      const error = await extractError(response, "Erro ao obter serviços")
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    const opcoesBackend = { token, apiBaseUrl: API_BASE_URL }

    if (Array.isArray(data)) {
      const itens = await Promise.all(
        data.map((s: Record<string, unknown>) =>
          aplicarRegraTelefoneServico(s, userId, servicosAprovadosIds, opcoesBackend)
        )
      )
      return NextResponse.json(itens)
    }

    if (data && typeof data === "object" && Array.isArray(data.itens)) {
      const itens = await Promise.all(
        data.itens.map((s: Record<string, unknown>) =>
          aplicarRegraTelefoneServico(s, userId, servicosAprovadosIds, opcoesBackend)
        )
      )
      return NextResponse.json({ ...data, itens })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
