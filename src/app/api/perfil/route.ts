import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/cookie"
import { decodeJwt } from "@/lib/jwt"
import { obterTelefoneUsuario, salvarTelefoneUsuario } from "@/lib/telefoneStore"
import { extrairDigitosTelefone, formatTelefone, validateTelefone } from "@/lib/validation"

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

function ehFornecedorRole(role: unknown): boolean {
  return role === 1 || role === "1" || role === "Fornecedor" || role === "fornecedor"
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const jwtPayload = decodeJwt(token)

    const response = await fetch(`${API_BASE_URL}/api/usuarios/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await extractError(response, "Erro ao obter perfil")
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    const idUsuario = data?.id ?? data?.Id ?? jwtPayload?.sub
    const telBackend = data?.telefone ?? data?.Telefone

    if (idUsuario && telBackend) {
      salvarTelefoneUsuario(idUsuario, String(telBackend))
      data.telefone = formatTelefone(String(telBackend))
    } else if (idUsuario) {
      const telCache = obterTelefoneUsuario(idUsuario)
      if (telCache) {
        data.telefone = formatTelefone(telCache)
      }
    }

    delete data.telefoneVisivel
    delete data.TelefoneVisivel

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const jwtPayload = decodeJwt(token)
    const userId = jwtPayload?.sub
    const isFornecedor = ehFornecedorRole(jwtPayload?.tipo)

    const formData = await request.formData()

    // Validação do telefone (obrigatório para fornecedor e formato WhatsApp válido)
    const telefoneRaw = String(formData.get("Telefone") ?? "").trim()
    if (isFornecedor && !telefoneRaw) {
      return NextResponse.json(
        { error: "O número de telefone é obrigatório para fornecedores." },
        { status: 400 }
      )
    }

    if (telefoneRaw && !validateTelefone(telefoneRaw)) {
      return NextResponse.json(
        { error: "Informe um telefone válido com DDD aceito pelo WhatsApp." },
        { status: 400 }
      )
    }

    const telefoneLimpo = telefoneRaw ? extrairDigitosTelefone(telefoneRaw) : ""
    formData.set("Telefone", telefoneLimpo)

    // Normaliza campos formatados (CPF/CNPJ, CEP, Número, Anos de experiência) para armazenar sem máscara
    const cpfCnpjRaw = formData.get("CpfCnpj")
    if (cpfCnpjRaw !== null) {
      formData.set("CpfCnpj", String(cpfCnpjRaw).replace(/\D/g, ""))
    }

    const cepRaw = formData.get("Endereco.Cep")
    if (cepRaw !== null) {
      formData.set("Endereco.Cep", String(cepRaw).replace(/\D/g, "").slice(0, 8))
    }

    const numeroRaw = formData.get("Endereco.Numero")
    if (numeroRaw !== null) {
      formData.set("Endereco.Numero", String(numeroRaw).replace(/\D/g, ""))
    }

    const anosRaw = formData.get("AnosExperiencia")
    if (anosRaw !== null) {
      formData.set("AnosExperiencia", String(anosRaw).replace(/\D/g, "") || "0")
    }

    // O telefone nunca fica visível publicamente; só é liberado após aceite de candidatura
    formData.set("TelefoneVisivel", "false")

    // Impede alteração do tipo de conta ("Serviço prestado") pelo perfil
    formData.delete("ServicoPrestado")
    formData.set("Tipo", isFornecedor ? "1" : "0")

    const response = await fetch(`${API_BASE_URL}/api/usuarios/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        // Não definir Content-Type: o fetch define automaticamente com o boundary correto
      },
      body: formData,
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: data.message ?? data.title ?? "Erro ao salvar perfil" },
        { status: response.status }
      )
    }

    if (userId && telefoneLimpo) {
      salvarTelefoneUsuario(userId, telefoneLimpo)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
