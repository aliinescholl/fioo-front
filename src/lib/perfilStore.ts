import fs from "fs"
import path from "path"
import { getMediaUrl } from "@/lib/media"
import { extrairDigitosTelefone, formatCEP, formatCpfCnpj, formatTelefone } from "@/lib/validation"

export interface PerfilPersistido {
  id: string
  nome?: string
  nomeSocial?: string
  pronome?: string
  nomeUsuario?: string
  email?: string
  cpfCnpj?: string
  telefone?: string
  cep?: string
  rua?: string
  numero?: string
  bairro?: string
  complemento?: string
  cidade?: string
  estado?: string
  anosExperiencia?: number
  fotoPerfilUrl?: string | null
  portfolios?: string[]
  updatedAt: string
}

const DATA_DIR = path.join(process.cwd(), ".data")
const PERFIS_FILE = path.join(DATA_DIR, "perfis.json")
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads")

function garantirDiretorios() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true })
    }
  } catch {
    // ignora erro caso o sistema de arquivos seja somente leitura
  }
}

function lerMapaPerfis(): Record<string, PerfilPersistido> {
  try {
    if (!fs.existsSync(PERFIS_FILE)) return {}
    const raw = fs.readFileSync(PERFIS_FILE, "utf-8")
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function gravarMapaPerfis(mapa: Record<string, PerfilPersistido>) {
  try {
    garantirDiretorios()
    fs.writeFileSync(PERFIS_FILE, JSON.stringify(mapa, null, 2), "utf-8")
  } catch {
    // ignora falha de escrita em disco
  }
}

function getProp<T = unknown>(obj: Record<string, unknown> | null | undefined, camel: string): T | undefined {
  if (!obj || typeof obj !== "object") return undefined
  if (camel in obj) return obj[camel] as T
  const pascal = camel.charAt(0).toUpperCase() + camel.slice(1)
  if (pascal in obj) return obj[pascal] as T
  return undefined
}

function strNaoVazia(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined
  const s = String(val).trim()
  return s.length > 0 ? s : undefined
}

/** Extrai URL de foto de perfil de qualquer propriedade retornada pelo backend */
export function extrairFotoPerfilBackend(obj: Record<string, unknown> | null | undefined): string | null {
  if (!obj || typeof obj !== "object") return null
  const candidato =
    getProp(obj, "fotoPerfilUrl") ??
    getProp(obj, "foto") ??
    getProp(obj, "fotoUrl") ??
    getProp(obj, "imagemUrl") ??
    getProp(obj, "avatarUrl")
  if (typeof candidato === "string" && candidato.trim()) {
    return getMediaUrl(candidato)
  }
  return null
}

/** Extrai lista de URLs de portfólio de qualquer formato retornado pelo backend */
export function extrairPortfoliosBackend(obj: Record<string, unknown> | null | undefined): string[] {
  if (!obj || typeof obj !== "object") return []
  const bruto =
    getProp(obj, "portfolios") ??
    getProp(obj, "portfolioUrls") ??
    getProp(obj, "imagensPortfolio") ??
    getProp(obj, "portfolio") ??
    getProp(obj, "fotosPortfolio")

  if (!Array.isArray(bruto)) return []

  const urls: string[] = []
  for (const item of bruto) {
    if (typeof item === "string" && item.trim()) {
      const u = getMediaUrl(item)
      if (u && !urls.includes(u)) urls.push(u)
    } else if (item && typeof item === "object") {
      const rec = item as Record<string, unknown>
      const rawUrl =
        getProp<string>(rec, "url") ??
        getProp<string>(rec, "imagemUrl") ??
        getProp<string>(rec, "fotoUrl") ??
        getProp<string>(rec, "caminho") ??
        getProp<string>(rec, "arquivoUrl")
      if (typeof rawUrl === "string" && rawUrl.trim()) {
        const u = getMediaUrl(rawUrl)
        if (u && !urls.includes(u)) urls.push(u)
      }
    }
  }
  return urls
}

/** Obtém os dados de perfil persistidos localmente para um usuário (por ID ou e-mail) */
export function obterPerfilPersistido(
  userId?: string | number | null,
  email?: string | null
): PerfilPersistido | null {
  const mapa = lerMapaPerfis()
  if (userId !== null && userId !== undefined && String(userId).trim() !== "") {
    const porId = mapa[String(userId).trim()]
    if (porId) return porId
  }
  if (email && email.trim()) {
    const emailLower = email.trim().toLowerCase()
    const encontrado = Object.values(mapa).find(
      p => p.email && p.email.trim().toLowerCase() === emailLower
    )
    if (encontrado) return encontrado
  }
  return null
}

/** Salva ou atualiza os dados persistidos de um usuário no disco */
export function salvarPerfilPersistido(
  userId: string | number,
  dados: Partial<PerfilPersistido>
): PerfilPersistido {
  const idStr = String(userId).trim()
  const mapa = lerMapaPerfis()
  const atual = mapa[idStr] ?? { id: idStr, updatedAt: new Date().toISOString() }

  const atualizado: PerfilPersistido = {
    ...atual,
    ...dados,
    id: idStr,
    updatedAt: new Date().toISOString(),
  }

  mapa[idStr] = atualizado
  gravarMapaPerfis(mapa)
  return atualizado
}

/** Salva um arquivo enviado (FotoPerfil ou Portfolio) em .data/uploads e retorna sua URL pública */
export async function salvarArquivoLocal(file: File, prefixo = "img"): Promise<string> {
  garantirDiretorios()
  const extRaw = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(extRaw) ? extRaw : "jpg"
  const nomeArquivo = `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`
  const caminhoCompleto = path.join(UPLOADS_DIR, nomeArquivo)

  const arrayBuffer = await file.arrayBuffer()
  fs.writeFileSync(caminhoCompleto, Buffer.from(arrayBuffer))

  return `/api/uploads/${nomeArquivo}`
}

/**
 * Mescla o retorno de GET /api/usuarios/me do backend com os dados salvos em perfilStore,
 * garantindo que todos os campos do perfil (foto, nomeSocial, pronome, CEP, número, bairro,
 * complemento, portfólio) sejam recuperados consistentemente.
 */
export function mesclarPerfilCompleto(
  dadosBackend: Record<string, unknown>,
  userIdFallback?: string | number | null,
  emailFallback?: string | null
): Record<string, unknown> {
  const idUsuario =
    getProp<string | number>(dadosBackend, "id") ??
    userIdFallback ??
    ""
  const emailUsuario =
    getProp<string>(dadosBackend, "email") ??
    emailFallback ??
    ""

  const salvo = obterPerfilPersistido(idUsuario, emailUsuario)
  const endBackend = (getProp<Record<string, unknown>>(dadosBackend, "endereco") ?? {}) as Record<string, unknown>

  const nome = strNaoVazia(getProp(dadosBackend, "nome")) ?? salvo?.nome ?? ""
  const nomeSocial =
    strNaoVazia(getProp(dadosBackend, "nomeSocial")) ??
    strNaoVazia(getProp(dadosBackend, "nomeFantasia")) ??
    salvo?.nomeSocial ??
    ""
  const pronome = strNaoVazia(getProp(dadosBackend, "pronome")) ?? salvo?.pronome ?? ""
  const nomeUsuario = strNaoVazia(getProp(dadosBackend, "nomeUsuario")) ?? salvo?.nomeUsuario ?? ""
  const email = strNaoVazia(emailUsuario) ?? salvo?.email ?? ""

  const cpfCnpjRaw = strNaoVazia(getProp(dadosBackend, "cpfCnpj")) ?? salvo?.cpfCnpj ?? ""
  const cpfCnpj = cpfCnpjRaw ? formatCpfCnpj(cpfCnpjRaw) : ""

  const telRaw = strNaoVazia(getProp(dadosBackend, "telefone")) ?? salvo?.telefone ?? ""
  const telefone = telRaw ? formatTelefone(telRaw) : ""

  const cepRaw =
    strNaoVazia(getProp(endBackend, "cep")) ??
    strNaoVazia(getProp(dadosBackend, "cep")) ??
    salvo?.cep ??
    ""
  const cep = cepRaw ? formatCEP(cepRaw) : ""

  const rua =
    strNaoVazia(getProp(endBackend, "rua")) ??
    strNaoVazia(getProp(dadosBackend, "rua")) ??
    salvo?.rua ??
    ""
  const numero =
    strNaoVazia(getProp(endBackend, "numero")) ??
    strNaoVazia(getProp(dadosBackend, "numero")) ??
    salvo?.numero ??
    ""
  const bairro =
    strNaoVazia(getProp(endBackend, "bairro")) ??
    strNaoVazia(getProp(dadosBackend, "bairro")) ??
    salvo?.bairro ??
    ""
  const complemento =
    strNaoVazia(getProp(endBackend, "complemento")) ??
    strNaoVazia(getProp(dadosBackend, "complemento")) ??
    salvo?.complemento ??
    ""
  const cidade =
    strNaoVazia(getProp(endBackend, "cidade")) ??
    strNaoVazia(getProp(dadosBackend, "cidade")) ??
    salvo?.cidade ??
    ""
  const estado =
    strNaoVazia(getProp(endBackend, "estado")) ??
    strNaoVazia(getProp(dadosBackend, "estado")) ??
    salvo?.estado ??
    ""

  const anosBackend = getProp<number>(dadosBackend, "anosExperiencia")
  const anosExperiencia =
    anosBackend !== undefined && anosBackend !== null && Number(anosBackend) > 0
      ? Number(anosBackend)
      : (salvo?.anosExperiencia ?? Number(anosBackend ?? 0))

  // Foto de perfil: prioriza o que foi salvo no store ou o retorno do backend
  const fotoBackend = extrairFotoPerfilBackend(dadosBackend)
  const fotoPerfilUrl = (salvo?.fotoPerfilUrl ? getMediaUrl(salvo.fotoPerfilUrl) : null) ?? fotoBackend

  // Portfólio: combina URLs do backend e do store persistido
  const portfoliosBackend = extrairPortfoliosBackend(dadosBackend)
  const portfoliosSalvos = (salvo?.portfolios ?? [])
    .map(u => getMediaUrl(u))
    .filter((u): u is string => Boolean(u))
  const portfolios = portfoliosSalvos.length > 0
    ? portfoliosSalvos
    : portfoliosBackend

  // Sincroniza no store caso o backend tinha dados que ainda não estavam em disco
  if (idUsuario !== "") {
    salvarPerfilPersistido(idUsuario, {
      nome,
      nomeSocial,
      pronome,
      nomeUsuario,
      email,
      cpfCnpj: cpfCnpjRaw.replace(/\D/g, ""),
      telefone: extrairDigitosTelefone(telRaw),
      cep: cepRaw.replace(/\D/g, ""),
      rua,
      numero,
      bairro,
      complemento,
      cidade,
      estado,
      anosExperiencia,
      fotoPerfilUrl,
      portfolios,
    })
  }

  const resultado: Record<string, unknown> = {
    ...dadosBackend,
    nome,
    nomeSocial,
    nomeFantasia: nomeSocial,
    pronome,
    nomeUsuario,
    email,
    cpfCnpj,
    telefone,
    cep,
    rua,
    numero,
    bairro,
    complemento,
    cidade,
    estado,
    anosExperiencia,
    fotoPerfilUrl,
    foto: fotoPerfilUrl,
    portfolios,
    endereco: {
      ...endBackend,
      cep,
      rua,
      numero,
      bairro,
      complemento,
      cidade,
      estado,
    },
  }

  delete resultado.telefoneVisivel
  delete resultado.TelefoneVisivel

  return resultado
}
