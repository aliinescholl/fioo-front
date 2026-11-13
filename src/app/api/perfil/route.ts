import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/cookie"
import { decodeJwt } from "@/lib/jwt"
import { getMediaUrl } from "@/lib/media"
import {
  extrairFotoPerfilBackend,
  extrairPortfoliosBackend,
  mesclarPerfilCompleto,
  obterPerfilPersistido,
  salvarArquivoLocal,
  salvarPerfilPersistido,
} from "@/lib/perfilStore"
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

function lerStrForm(fd: FormData, ...chaves: string[]): string {
  for (const chave of chaves) {
    const val = fd.get(chave)
    if (typeof val === "string") return val.trim()
  }
  return ""
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
      cache: "no-store",
    })

    if (!response.ok) {
      const error = await extractError(response, "Erro ao obter perfil")
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = (await response.json()) as Record<string, unknown>
    const idUsuario = (data?.id ?? data?.Id ?? jwtPayload?.sub) as string | number | undefined

    // Caso o endpoint /api/usuarios/me não retorne fotoPerfilUrl ou portfólio,
    // consulta também /api/usuarios/{id}/publico (mesma fonte usada em /usuarios/[id])
    if (idUsuario != null && (!extrairFotoPerfilBackend(data) || extrairPortfoliosBackend(data).length === 0)) {
      try {
        const resPublico = await fetch(
          `${API_BASE_URL}/api/usuarios/${encodeURIComponent(String(idUsuario))}/publico`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        )
        if (resPublico.ok) {
          const dadosPublicos = (await resPublico.json()) as Record<string, unknown>
          const fotoPublica = extrairFotoPerfilBackend(dadosPublicos)
          if (fotoPublica && !extrairFotoPerfilBackend(data)) {
            data.fotoPerfilUrl = fotoPublica
          }
          const portfoliosPublicos = extrairPortfoliosBackend(dadosPublicos)
          if (portfoliosPublicos.length > 0 && extrairPortfoliosBackend(data).length === 0) {
            data.portfolios = portfoliosPublicos
          }
        }
      } catch {
        // ignora falha secundária
      }
    }

    const telBackend = (data?.telefone ?? data?.Telefone) as string | undefined
    if (idUsuario != null && telBackend) {
      salvarTelefoneUsuario(idUsuario, String(telBackend))
      data.telefone = formatTelefone(String(telBackend))
    } else if (idUsuario != null) {
      const telCache = obterTelefoneUsuario(idUsuario)
      if (telCache) {
        data.telefone = formatTelefone(telCache)
      }
    }

    const perfilCompleto = mesclarPerfilCompleto(data, idUsuario, jwtPayload?.email)

    return NextResponse.json(perfilCompleto)
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
    const telefoneRaw = lerStrForm(formData, "Telefone", "telefone")
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
    const nome = lerStrForm(formData, "Nome", "nome")
    const nomeSocial = lerStrForm(formData, "NomeSocial", "NomeFantasia", "nomeSocial")
    const pronome = lerStrForm(formData, "Pronome", "pronome")
    const nomeUsuario = lerStrForm(formData, "NomeUsuario", "nomeUsuario")
    const email = lerStrForm(formData, "Email", "email") || (jwtPayload?.email ?? "")
    const cpfCnpjLimpo = lerStrForm(formData, "CpfCnpj", "cpfCnpj").replace(/\D/g, "")
    const cepLimpo = lerStrForm(formData, "Endereco.Cep", "Cep", "cep").replace(/\D/g, "").slice(0, 8)
    const rua = lerStrForm(formData, "Endereco.Rua", "Rua", "rua")
    const numeroLimpo = lerStrForm(formData, "Endereco.Numero", "Numero", "numero").replace(/\D/g, "")
    const bairro = lerStrForm(formData, "Endereco.Bairro", "Bairro", "bairro")
    const complemento = lerStrForm(formData, "Endereco.Complemento", "Complemento", "complemento")
    const cidade = lerStrForm(formData, "Cidade", "Endereco.Cidade", "cidade")
    const estado = lerStrForm(formData, "Estado", "Endereco.Estado", "estado")
    const anosLimpo = lerStrForm(formData, "AnosExperiencia", "anosExperiencia").replace(/\D/g, "") || "0"

    // Lista de URLs de portfólio que o usuário manteve na tela
    let portfoliosMantidos: string[] | null = null
    const mantidosRaw = formData.get("PortfoliosMantidos")
    if (typeof mantidosRaw === "string") {
      try {
        const parsed = JSON.parse(mantidosRaw)
        if (Array.isArray(parsed)) {
          portfoliosMantidos = parsed
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map(item => getMediaUrl(item) ?? item)
        }
      } catch {
        portfoliosMantidos = null
      }
    }

    // Salva localmente arquivos enviados (FotoPerfil e Portfolios) para persistência garantida
    const fotoEntry = formData.get("FotoPerfil")
    let novaFotoLocalUrl: string | null = null
    if (fotoEntry instanceof File && fotoEntry.size > 0) {
      novaFotoLocalUrl = await salvarArquivoLocal(fotoEntry, "foto")
    }

    const portfolioEntries = formData.getAll("Portfolios")
    const novosPortfoliosUrls: string[] = []
    for (const entry of portfolioEntries) {
      if (entry instanceof File && entry.size > 0) {
        const urlSalva = await salvarArquivoLocal(entry, "portfolio")
        novosPortfoliosUrls.push(urlSalva)
      }
    }

    // Prepara FormData normalizado para o backend C# (incluindo variações de nomes de propriedades)
    const backendFormData = new FormData()
    backendFormData.set("Nome", nome)
    backendFormData.set("NomeSocial", nomeSocial)
    backendFormData.set("NomeFantasia", nomeSocial)
    backendFormData.set("Pronome", pronome)
    backendFormData.set("NomeUsuario", nomeUsuario)
    backendFormData.set("Email", email)
    backendFormData.set("CpfCnpj", cpfCnpjLimpo)
    backendFormData.set("Telefone", telefoneLimpo)
    backendFormData.set("TelefoneVisivel", "false")
    backendFormData.set("Tipo", isFornecedor ? "1" : "0")
    backendFormData.set("AnosExperiencia", anosLimpo)

    backendFormData.set("Cep", cepLimpo)
    backendFormData.set("Rua", rua)
    backendFormData.set("Numero", numeroLimpo)
    backendFormData.set("Bairro", bairro)
    backendFormData.set("Complemento", complemento)
    backendFormData.set("Cidade", cidade)
    backendFormData.set("Estado", estado)

    backendFormData.set("Endereco.Cep", cepLimpo)
    backendFormData.set("Endereco.Rua", rua)
    backendFormData.set("Endereco.Numero", numeroLimpo)
    backendFormData.set("Endereco.Bairro", bairro)
    backendFormData.set("Endereco.Complemento", complemento)
    backendFormData.set("Endereco.Cidade", cidade)
    backendFormData.set("Endereco.Estado", estado)

    if (fotoEntry instanceof File && fotoEntry.size > 0) {
      backendFormData.append("FotoPerfil", fotoEntry)
    }
    for (const entry of portfolioEntries) {
      if (entry instanceof File && entry.size > 0) {
        backendFormData.append("Portfolios", entry)
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/usuarios/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendFormData,
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: data.message ?? data.title ?? "Erro ao salvar perfil" },
        { status: response.status }
      )
    }

    const dadosRetornoPut = (await response.json().catch(() => ({}))) as Record<string, unknown>

    // Resolve ID do usuário (do retorno, do JWT ou de /api/usuarios/me)
    let idResolvido: string | number | undefined =
      (dadosRetornoPut?.id ?? dadosRetornoPut?.Id ?? userId) as string | number | undefined

    let fotoBackend = extrairFotoPerfilBackend(dadosRetornoPut)
    let portfoliosBackend = extrairPortfoliosBackend(dadosRetornoPut)

    if (!idResolvido || (!novaFotoLocalUrl && !fotoBackend)) {
      try {
        const resMe = await fetch(`${API_BASE_URL}/api/usuarios/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        if (resMe.ok) {
          const meData = (await resMe.json()) as Record<string, unknown>
          idResolvido = idResolvido ?? ((meData?.id ?? meData?.Id) as string | number | undefined)
          fotoBackend = fotoBackend ?? extrairFotoPerfilBackend(meData)
          if (portfoliosBackend.length === 0) {
            portfoliosBackend = extrairPortfoliosBackend(meData)
          }
        }
      } catch {
        // ignora erro secundário
      }
    }

    const idChave = idResolvido ?? email
    if (idChave) {
      const anterior = obterPerfilPersistido(idResolvido, email)
      const fotoFinal =
        novaFotoLocalUrl ??
        fotoBackend ??
        anterior?.fotoPerfilUrl ??
        null

      const basePortfolios =
        portfoliosMantidos !== null
          ? portfoliosMantidos
          : (anterior?.portfolios ?? portfoliosBackend)

      const portfoliosFinais = Array.from(new Set([...basePortfolios, ...novosPortfoliosUrls]))

      salvarPerfilPersistido(idChave, {
        nome,
        nomeSocial,
        pronome,
        nomeUsuario,
        email,
        cpfCnpj: cpfCnpjLimpo,
        telefone: telefoneLimpo,
        cep: cepLimpo,
        rua,
        numero: numeroLimpo,
        bairro,
        complemento,
        cidade,
        estado,
        anosExperiencia: Number(anosLimpo) || 0,
        fotoPerfilUrl: fotoFinal,
        portfolios: portfoliosFinais,
      })

      if (telefoneLimpo) {
        salvarTelefoneUsuario(idChave, telefoneLimpo)
      }
    }

    const perfilAtualizado = mesclarPerfilCompleto(dadosRetornoPut, idResolvido, email)

    return NextResponse.json({ ok: true, perfil: perfilAtualizado })
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
