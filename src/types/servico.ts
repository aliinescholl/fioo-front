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
