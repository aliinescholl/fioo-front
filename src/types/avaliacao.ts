import type { UsuarioResumo } from "@/types/servico"

// Espelha UsuarioTipo do backend (JSON numérico)
export const PAPEL = { Costureiro: 0, Fornecedor: 1 } as const
export type Papel = (typeof PAPEL)[keyof typeof PAPEL]

export const COMENTARIO_MAX = 300

export interface Avaliacao {
  id: number
  servicoId: number
  servicoTitulo: string
  avaliador: UsuarioResumo
  avaliadoId: number
  papelAvaliado: Papel
  nota: number
  notaComunicacao: number
  notaQualidade: number
  comentario: string | null
  dataAvaliacao: string
}

export interface ResumoAvaliacoes {
  media: number | null
  total: number
}

export interface AvaliacoesUsuario {
  comoCostureiro: ResumoAvaliacoes
  comoFornecedor: ResumoAvaliacoes
  itens: Avaliacao[]
}

export interface PerfilPublico {
  id: number
  nome: string
  nomeUsuario: string
  fotoPerfilUrl: string | null
  cidade: string | null
  estado: string | null
  tipo: Papel
  anosExperiencia: number | null
}

export const ROTULO_ESTRELAS = ["Ruim", "Regular", "Bom", "Muito bom", "Excelente"]

/** "4,5" */
export function formatarMedia(media: number) {
  return media.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
