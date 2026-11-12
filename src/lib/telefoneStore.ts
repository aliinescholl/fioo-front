import fs from "fs"
import os from "os"
import path from "path"
import { extrairDigitosTelefone, formatTelefone } from "@/lib/validation"

const STORE_PATH = path.join(os.tmpdir(), "fioo-telefones-cache.json")
const memoryCache = new Map<string, string>()

function loadDiskCache(): Record<string, string> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8")
      return JSON.parse(raw) as Record<string, string>
    }
  } catch {
    // ignora falha de leitura em disco
  }
  return {}
}

function saveDiskCache(data: Record<string, string>) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data), "utf-8")
  } catch {
    // ignora falha de escrita em disco
  }
}

export function salvarTelefoneUsuario(userId: string | number | undefined | null, telefone: string | undefined | null) {
  if (userId === undefined || userId === null || !telefone) return
  const digitos = extrairDigitosTelefone(String(telefone))
  if (!digitos) return
  const key = String(userId)
  memoryCache.set(key, digitos)
  const disk = loadDiskCache()
  disk[key] = digitos
  saveDiskCache(disk)
}

export function obterTelefoneUsuario(userId: string | number | undefined | null): string | null {
  if (userId === undefined || userId === null) return null
  const key = String(userId)
  if (memoryCache.has(key)) return memoryCache.get(key) ?? null
  const disk = loadDiskCache()
  if (disk[key]) {
    memoryCache.set(key, disk[key])
    return disk[key]
  }
  return null
}

function lerCampo<T = unknown>(obj: Record<string, unknown> | null | undefined, camel: string): T | undefined {
  if (!obj || typeof obj !== "object") return undefined
  if (camel in obj) return obj[camel] as T
  const pascal = camel.charAt(0).toUpperCase() + camel.slice(1)
  return obj[pascal] as T
}

function limparCamposTelefone(obj: Record<string, unknown> | null | undefined) {
  if (!obj || typeof obj !== "object") return
  delete obj.telefone
  delete obj.Telefone
  delete obj.telefoneFornecedor
  delete obj.TelefoneFornecedor
  delete obj.telefoneVisivel
  delete obj.TelefoneVisivel
}

/**
 * Remove telefone e flags de visibilidade de objetos públicos de usuários
 * (listagens de fornecedores/costureiros e perfil público), preservando no cache
 * interno do servidor para liberar apenas ao costureiro aprovado em um serviço.
 */
export function sanitizarUsuarioPublico<T>(dados: T): T {
  if (!dados || typeof dados !== "object") return dados
  if (Array.isArray(dados)) {
    return dados.map(item => sanitizarUsuarioPublico(item)) as unknown as T
  }
  const copia = { ...(dados as Record<string, unknown>) }
  const id = lerCampo<number | string>(copia, "id")
  const tel = lerCampo<string>(copia, "telefone")
  if (id != null && tel) {
    salvarTelefoneUsuario(id, tel)
  }
  limparCamposTelefone(copia)
  if (Array.isArray(copia.itens)) {
    copia.itens = copia.itens.map((item: unknown) => sanitizarUsuarioPublico(item))
  }
  return copia as T
}

/**
 * Tenta buscar o telefone do fornecedor no backend caso ainda não esteja no cache
 * (chamado exclusivamente quando o usuário autenticado é o costureiro aceito ou dono).
 */
export async function buscarTelefoneFornecedorBackend(
  fornecedorId: number | string | undefined,
  servicoId: number | string | undefined,
  token: string,
  apiBaseUrl: string | undefined
): Promise<string | null> {
  if (!apiBaseUrl) return null

  const cacheado = obterTelefoneUsuario(fornecedorId)
  if (cacheado) return cacheado

  const headers = { Authorization: `Bearer ${token}` }

  // 1. Tenta pelo detalhe do serviço no backend
  if (servicoId != null) {
    try {
      const res = await fetch(`${apiBaseUrl}/api/servicos/${servicoId}`, { headers, cache: "no-store" })
      if (res.ok) {
        const s = (await res.json()) as Record<string, unknown>
        const u = lerCampo<Record<string, unknown>>(s, "usuario")
        const tel =
          (u ? lerCampo<string>(u, "telefone") : undefined) ??
          lerCampo<string>(s, "telefoneFornecedor") ??
          lerCampo<string>(s, "telefone")
        if (tel) {
          if (fornecedorId != null) salvarTelefoneUsuario(fornecedorId, tel)
          return extrairDigitosTelefone(tel)
        }
      }
    } catch {
      // ignora erro de rede
    }
  }

  // 2. Tenta pelo endpoint de usuário no backend
  if (fornecedorId != null) {
    for (const rota of [`/api/usuarios/${fornecedorId}`, `/api/usuarios/${fornecedorId}/publico`]) {
      try {
        const res = await fetch(`${apiBaseUrl}${rota}`, { headers, cache: "no-store" })
        if (res.ok) {
          const u = (await res.json()) as Record<string, unknown>
          const tel = lerCampo<string>(u, "telefone")
          if (tel) {
            salvarTelefoneUsuario(fornecedorId, tel)
            return extrairDigitosTelefone(tel)
          }
        }
      } catch {
        // ignora erro
      }
    }
  }

  return null
}

/**
 * Aplica a regra de negócio de privacidade do telefone do fornecedor em um serviço:
 * - Somente o próprio fornecedor dono do serviço OU o costureiro cuja candidatura foi ACEITA
 *   para aquele serviço recebem o número de telefone do fornecedor.
 * - Para qualquer outro usuário (incluindo candidatos pendentes ou recusados), o telefone é
 *   removido da resposta da API.
 */
export async function aplicarRegraTelefoneServico<T extends Record<string, unknown>>(
  servico: T,
  userIdLogado: string | number | null | undefined,
  servicosAprovadosIds?: Set<number>,
  opcoesBackend?: { token: string; apiBaseUrl?: string }
): Promise<T> {
  if (!servico || typeof servico !== "object") return servico

  const copia: Record<string, unknown> = { ...servico }
  const servicoId = Number(lerCampo(copia, "id"))
  const usuarioRaw = lerCampo<Record<string, unknown>>(copia, "usuario")
  const usuario = usuarioRaw ? { ...usuarioRaw } : null
  const costureiroVinculado = lerCampo<Record<string, unknown>>(copia, "costureiroVinculado")

  const fornecedorId = usuario ? lerCampo<number | string>(usuario, "id") : undefined
  const costureiroAceitoId = costureiroVinculado ? lerCampo<number | string>(costureiroVinculado, "id") : undefined

  // Extrai telefone caso tenha vindo do backend e atualiza cache do fornecedor
  let telefoneBruto: string | null | undefined =
    (usuario ? lerCampo<string>(usuario, "telefone") : undefined) ??
    lerCampo<string>(copia, "telefoneFornecedor") ??
    lerCampo<string>(copia, "telefone") ??
    obterTelefoneUsuario(fornecedorId)

  if (fornecedorId && telefoneBruto) {
    salvarTelefoneUsuario(fornecedorId, telefoneBruto)
  }

  // Limpa sempre qualquer telefone antes de decidir se libera
  limparCamposTelefone(copia)
  if (usuario) limparCamposTelefone(usuario)
  if (costureiroVinculado && typeof costureiroVinculado === "object") {
    const cvCopia = { ...costureiroVinculado }
    limparCamposTelefone(cvCopia)
    if ("costureiroVinculado" in copia) copia.costureiroVinculado = cvCopia
    else if ("CostureiroVinculado" in copia) copia.CostureiroVinculado = cvCopia
  }

  const uid = userIdLogado != null && userIdLogado !== "" ? Number(userIdLogado) : NaN
  const ehDonoServico = !isNaN(uid) && fornecedorId != null && Number(fornecedorId) === uid
  const ehCostureiroVinculado = !isNaN(uid) && costureiroAceitoId != null && Number(costureiroAceitoId) === uid
  const ehCandidatoAceito = !isNaN(uid) && !isNaN(servicoId) && Boolean(servicosAprovadosIds?.has(servicoId))

  const podeVerTelefone = ehDonoServico || ehCostureiroVinculado || ehCandidatoAceito

  if (podeVerTelefone && !telefoneBruto && opcoesBackend?.token) {
    telefoneBruto = await buscarTelefoneFornecedorBackend(
      fornecedorId,
      servicoId,
      opcoesBackend.token,
      opcoesBackend.apiBaseUrl
    )
  }

  if (podeVerTelefone && telefoneBruto) {
    const formatado = formatTelefone(telefoneBruto)
    if (usuario && formatado) {
      usuario.telefone = formatado
    }
    if (formatado) {
      copia.telefoneFornecedor = formatado
    }
  }

  if (usuario) {
    if ("usuario" in copia) copia.usuario = usuario
    else if ("Usuario" in copia) copia.Usuario = usuario
    else copia.usuario = usuario
  }

  return copia as T
}
