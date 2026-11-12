import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/cookie"
import { decodeJwt } from "@/lib/jwt"
import { aplicarRegraTelefoneServico } from "@/lib/telefoneStore"

const API_BASE_URL = process.env.API_BASE_URL

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ usuarioId: string }> }
) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const jwtPayload = decodeJwt(token)
    const userIdLogado = jwtPayload?.sub
    const { usuarioId } = await params

    // Impede que um usuário consulte as candidaturas de outro costureiro
    if (userIdLogado && String(userIdLogado) !== String(usuarioId)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const response = await fetch(`${API_BASE_URL}/api/candidaturas/em-andamento/${usuarioId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao obter candidaturas em andamento" },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (Array.isArray(data)) {
      const aprovados = new Set<number>()
      for (const c of data) {
        const status = Number(c?.status ?? c?.Status)
        const servico = c?.servico ?? c?.Servico
        const sId = servico?.id ?? servico?.Id ?? c?.servicoId ?? c?.ServicoId
        if (status === 1 && sId != null) {
          aprovados.add(Number(sId))
        }
      }

      const sanitizadas = await Promise.all(
        data.map(async (c: Record<string, unknown>) => {
          const copia = { ...c }
          const status = Number(copia?.status ?? copia?.Status)
          if (status !== 1) {
            delete copia.telefone
            delete copia.Telefone
            delete copia.telefoneFornecedor
            delete copia.TelefoneFornecedor
          }
          const servico = (copia.servico ?? copia.Servico) as Record<string, unknown> | undefined
          if (servico && typeof servico === "object") {
            const servicoSanitizado = await aplicarRegraTelefoneServico(servico, userIdLogado ?? usuarioId, aprovados, {
              token,
              apiBaseUrl: API_BASE_URL,
            })
            if ("servico" in copia) copia.servico = servicoSanitizado
            else if ("Servico" in copia) copia.Servico = servicoSanitizado
          }
          return copia
        })
      )
      return NextResponse.json(sanitizadas)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
