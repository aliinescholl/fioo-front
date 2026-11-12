import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/cookie"
import { decodeJwt } from "@/lib/jwt"
import { salvarTelefoneUsuario } from "@/lib/telefoneStore"
import { extrairDigitosTelefone, validateTelefone } from "@/lib/validation"

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

/** Mapeia status codes específicos do backend para mensagens amigáveis */
function friendlyMessage(status: number, message: string): string {
  if (status === 429) return "Limite de consultas de CNPJ atingido. Aguarde 1 minuto e tente novamente."
  if (status === 503) return "Serviço de consulta de CNPJ temporariamente indisponível."
  return message
}

export async function POST(request: NextRequest) {
  try {
    const { nome, email, senha, ehCostureiro = true, cnpj, telefone } = await request.json()

    // ── Validações básicas ────────────────────────────────────────────────────
    if (!email || !senha) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 })
    }

    if (ehCostureiro && !nome) {
      return NextResponse.json({ error: "Nome é obrigatório para Costureiro" }, { status: 400 })
    }

    if (!ehCostureiro && !cnpj) {
      return NextResponse.json({ error: "CNPJ é obrigatório para Fornecedor" }, { status: 400 })
    }

    if (!ehCostureiro) {
      if (!telefone || !String(telefone).trim()) {
        return NextResponse.json({ error: "Telefone é obrigatório para Fornecedor" }, { status: 400 })
      }
      if (!validateTelefone(String(telefone))) {
        return NextResponse.json(
          { error: "Telefone inválido. Informe um número válido com DDD para WhatsApp." },
          { status: 400 }
        )
      }
    }

    const telefoneLimpo = telefone ? extrairDigitosTelefone(String(telefone)) : undefined

    // ── Monta payload conforme tipo de conta ──────────────────────────────────
    const payload = ehCostureiro
      ? { nome, email, senha, ehCostureiro: true, ...(telefoneLimpo ? { telefone: telefoneLimpo } : {}) }
      : { cnpj, email, senha, ehCostureiro: false, telefone: telefoneLimpo }

    // 1️⃣ Cadastrar usuário
    const registerRes = await fetch(`${API_BASE_URL}/api/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!registerRes.ok) {
      const message = await extractError(registerRes, "Erro ao realizar cadastro")
      const friendly = friendlyMessage(registerRes.status, message)
      return NextResponse.json({ error: friendly }, { status: registerRes.status })
    }

    // 2️⃣ Login automático — cadastro não retorna token
    const loginRes = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    })

    if (!loginRes.ok) {
      const error = await extractError(loginRes, "Cadastro realizado, mas erro no login automático")
      return NextResponse.json({ error }, { status: 500 })
    }

    const { token } = await loginRes.json()
    const jwtPayload = decodeJwt(token)

    // Persiste o telefone no cache local e garante atualização no perfil do backend
    if (telefoneLimpo) {
      if (jwtPayload?.sub) {
        salvarTelefoneUsuario(jwtPayload.sub, telefoneLimpo)
      }
      try {
        const meRes = await fetch(`${API_BASE_URL}/api/usuarios/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (meRes.ok) {
          const meData = await meRes.json()
          const idUsuario = meData?.id ?? meData?.Id ?? jwtPayload?.sub
          if (idUsuario) salvarTelefoneUsuario(idUsuario, telefoneLimpo)

          const telAtual = meData?.telefone ?? meData?.Telefone
          if (!telAtual) {
            const fd = new FormData()
            fd.append("Nome", String(meData?.nome ?? meData?.Nome ?? jwtPayload?.nome ?? ""))
            fd.append("NomeUsuario", String(meData?.nomeUsuario ?? meData?.NomeUsuario ?? jwtPayload?.nome_usuario ?? ""))
            fd.append("Email", String(meData?.email ?? meData?.Email ?? email))
            fd.append("CpfCnpj", String(meData?.cpfCnpj ?? meData?.CpfCnpj ?? (cnpj ? String(cnpj).replace(/\D/g, "") : "")))
            fd.append("Telefone", telefoneLimpo)
            fd.append("TelefoneVisivel", "false")
            fd.append("Tipo", ehCostureiro ? "0" : "1")
            await fetch(`${API_BASE_URL}/api/usuarios/me`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            })
          }
        }
      } catch {
        // se o endpoint /me falhar, o cache já garante a disponibilidade do telefone
      }
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    return res
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
