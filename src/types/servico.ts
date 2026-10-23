// Tipos e rótulos de Serviço, espelhando os enums do backend (JSON numérico).

export const COBRANCA_TIPO = { PorPeca: 0, PorOperacao: 1 } as const
export type CobrancaTipo = (typeof COBRANCA_TIPO)[keyof typeof COBRANCA_TIPO]

export const COBRANCA_OPCOES: { value: CobrancaTipo; label: string }[] = [
  { value: COBRANCA_TIPO.PorPeca, label: "Por Peça" },
  { value: COBRANCA_TIPO.PorOperacao, label: "Por Operação" },
]

export const PRAZO_TIPO = { Semanal: 0, Quinzenal: 1, Mensal: 2, DataEspecifica: 3 } as const
export type PrazoTipo = (typeof PRAZO_TIPO)[keyof typeof PRAZO_TIPO]

export const PRAZO_OPCOES: { value: PrazoTipo; label: string }[] = [
  { value: PRAZO_TIPO.Semanal, label: "Semanal" },
  { value: PRAZO_TIPO.Quinzenal, label: "Quinzenal" },
  { value: PRAZO_TIPO.Mensal, label: "Mensal" },
  { value: PRAZO_TIPO.DataEspecifica, label: "Data Específica" },
]

export const SERVICO_STATUS = { EmAndamento: 1, Concluido: 2, Cancelado: 3 } as const
export type ServicoStatus = (typeof SERVICO_STATUS)[keyof typeof SERVICO_STATUS]

export const STATUS_SERVICO_CONFIG: Record<ServicoStatus, { label: string; className: string }> = {
  [SERVICO_STATUS.EmAndamento]: { label: "Em andamento", className: "bg-blue-50 text-blue-700 border-blue-200" },
  [SERVICO_STATUS.Concluido]: { label: "Concluído", className: "bg-green-50 text-green-700 border-green-200" },
  [SERVICO_STATUS.Cancelado]: { label: "Cancelado", className: "bg-red-50 text-red-600 border-red-200" },
}

export interface UsuarioResumo {
  id: number
  nome: string
  nomeUsuario: string
  fotoPerfilUrl?: string | null
  cidade?: string | null
  estado?: string | null
}

export interface Maquinario {
  id: number
  nome: string
}

export interface Servico {
  id: number
  titulo: string
  descricao: string | null
  cidade: string | null
  estado: string | null
  categoriaServico: string | null
  valor: number | null
  tipoCobranca: CobrancaTipo
  tipoPrazo: PrazoTipo | null
  dataPrazo: string | null // "yyyy-MM-dd"; só existe quando tipoPrazo = Data Específica
  status: ServicoStatus
  dataCriacao: string
  usuario: UsuarioResumo
  maquinarios: Maquinario[]
  costureiroVinculado: UsuarioResumo | null
}

/** Corpo enviado ao cadastrar/editar um serviço. */
export interface ServicoPayload {
  titulo: string
  descricao: string | null
  cidade: string | null
  estado: string | null
  tipoCobranca: CobrancaTipo
  categoriaServico: string | null
  valor: number | null
  tipoPrazo: PrazoTipo
  dataPrazo: string | null
}

export function getCobrancaLabel(tipo: CobrancaTipo) {
  return COBRANCA_OPCOES.find(o => o.value === tipo)?.label ?? ""
}

/** "Quinzenal", "20/05/2030" etc. Nunca quebra com valores nulos. */
export function getPrazoLabel(tipo: PrazoTipo | null | undefined, data: string | null | undefined) {
  if (tipo === PRAZO_TIPO.DataEspecifica) {
    if (!data) return "Data específica"
    const [ano, mes, dia] = data.split("-")
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data
  }
  return PRAZO_OPCOES.find(o => o.value === tipo)?.label ?? "A combinar"
}

// ─── Filtros e ordenação da listagem (espelham ServicoFiltroDto do backend) ──

export const ORDENACAO_SERVICOS = [
  { value: "relevantes", label: "Mais relevantes" },
  { value: "prazo-proximo", label: "Prazo mais próximo" },
  { value: "prazo-distante", label: "Prazo mais distante" },
  { value: "maior-valor", label: "Maior valor" },
  { value: "menor-valor", label: "Menor valor" },
] as const
export type OrdenacaoServicos = (typeof ORDENACAO_SERVICOS)[number]["value"]

export interface FiltrosServicos {
  busca: string
  uf: string
  cidade: string
  valorMin: string
  valorMax: string
  cobranca: CobrancaTipo | null
  prazo: PrazoTipo | null
  categoria: string
  status: ServicoStatus | null
  ordenacao: OrdenacaoServicos
}

export const FILTROS_SERVICOS_VAZIOS: FiltrosServicos = {
  busca: "",
  uf: "",
  cidade: "",
  valorMin: "",
  valorMax: "",
  cobranca: null,
  prazo: null,
  categoria: "",
  status: null,
  ordenacao: "relevantes",
}

export interface PaginaServicos {
  itens: Servico[]
  pagina: number
  temMais: boolean
}

function lerOpcao<T extends number>(valor: string | null, validos: readonly T[]): T | null {
  if (valor === null || valor === "") return null
  const n = Number(valor)
  return validos.includes(n as T) ? (n as T) : null
}

/** Converte "1.234,50" ou "12.5" em número; "" se inválido. */
export function normalizarValor(valor: string): string {
  const limpo = valor.trim().replace(/\./g, valor.includes(",") ? "" : ".").replace(",", ".")
  return limpo !== "" && !isNaN(Number(limpo)) ? String(Number(limpo)) : ""
}

/** Lê os filtros da URL, descartando valores inválidos. */
export function lerFiltrosServicos(params: URLSearchParams): FiltrosServicos {
  const ordenacao = params.get("ordenacao")
  return {
    busca: params.get("busca") ?? "",
    uf: params.get("uf") ?? "",
    cidade: params.get("cidade") ?? "",
    valorMin: normalizarValor(params.get("valorMin") ?? ""),
    valorMax: normalizarValor(params.get("valorMax") ?? ""),
    cobranca: lerOpcao(params.get("cobranca"), Object.values(COBRANCA_TIPO)),
    prazo: lerOpcao(params.get("prazo"), Object.values(PRAZO_TIPO)),
    categoria: params.get("categoria") ?? "",
    status: lerOpcao(params.get("status"), Object.values(SERVICO_STATUS)),
    ordenacao: ORDENACAO_SERVICOS.some(o => o.value === ordenacao) ? (ordenacao as OrdenacaoServicos) : "relevantes",
  }
}

/** Gera a query string (para a URL e para a API), omitindo o que está vazio ou no padrão. */
export function filtrosServicosParaQuery(f: FiltrosServicos): URLSearchParams {
  const q = new URLSearchParams()
  if (f.busca.trim()) q.set("busca", f.busca.trim())
  if (f.uf) q.set("uf", f.uf)
  if (f.cidade.trim()) q.set("cidade", f.cidade.trim())
  if (normalizarValor(f.valorMin)) q.set("valorMin", normalizarValor(f.valorMin))
  if (normalizarValor(f.valorMax)) q.set("valorMax", normalizarValor(f.valorMax))
  if (f.cobranca !== null) q.set("cobranca", String(f.cobranca))
  if (f.prazo !== null) q.set("prazo", String(f.prazo))
  if (f.categoria) q.set("categoria", f.categoria)
  if (f.status !== null) q.set("status", String(f.status))
  if (f.ordenacao !== "relevantes") q.set("ordenacao", f.ordenacao)
  return q
}

/** Quantos filtros do painel estão ativos (busca e ordenação não contam). */
export function contarFiltrosServicos(f: FiltrosServicos): number {
  return [
    f.uf, f.cidade.trim(), normalizarValor(f.valorMin) || normalizarValor(f.valorMax),
    f.cobranca !== null, f.prazo !== null, f.categoria, f.status !== null,
  ].filter(Boolean).length
}
