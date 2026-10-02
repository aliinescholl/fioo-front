// Tela Encontrar: filtros e ordenação (espelham UsuarioFiltroDto do backend)

export const ABAS_ENCONTRAR = ["fornecedores", "costureiros"] as const
export type AbaEncontrar = (typeof ABAS_ENCONTRAR)[number]

export const ORDENACAO_USUARIOS = [
  { value: "relevantes", label: "Mais relevantes" },
  { value: "avaliacao-alta", label: "Avaliação mais alta" },
  { value: "avaliacao-baixa", label: "Avaliação mais baixa" },
  { value: "az", label: "Nome: A–Z" },
  { value: "za", label: "Nome: Z–A" },
] as const
export type OrdenacaoUsuarios = (typeof ORDENACAO_USUARIOS)[number]["value"]

export const AVALIACAO_MIN_OPCOES = [1, 2, 3, 4, 5].map(n => ({
  value: n,
  label: n === 5 ? "5 estrelas" : `${n}+ estrelas`,
}))

export interface FiltrosUsuarios {
  aba: AbaEncontrar
  busca: string
  uf: string
  cidade: string
  avaliacaoMin: number | null
  ordenacao: OrdenacaoUsuarios
}

export interface UsuarioCard {
  id: number
  nome: string
  nomeUsuario: string
  localizacao: string | null
  foto: string | null
  media: number | null
  totalAvaliacoes: number
}

export interface PaginaUsuarios {
  itens: UsuarioCard[]
  pagina: number
  temMais: boolean
}

export function lerFiltrosUsuarios(params: URLSearchParams): FiltrosUsuarios {
  const aba = params.get("aba")
  const ordenacao = params.get("ordenacao")
  const avaliacaoMin = Number(params.get("avaliacaoMin"))
  return {
    aba: ABAS_ENCONTRAR.includes(aba as AbaEncontrar) ? (aba as AbaEncontrar) : "fornecedores",
    busca: params.get("busca") ?? "",
    uf: params.get("uf") ?? "",
    cidade: params.get("cidade") ?? "",
    avaliacaoMin: Number.isInteger(avaliacaoMin) && avaliacaoMin >= 1 && avaliacaoMin <= 5 ? avaliacaoMin : null,
    ordenacao: ORDENACAO_USUARIOS.some(o => o.value === ordenacao) ? (ordenacao as OrdenacaoUsuarios) : "relevantes",
  }
}

/** Query dos filtros (sem a aba, que vira o endpoint), omitindo vazios e padrões. */
export function filtrosUsuariosParaQuery(f: FiltrosUsuarios): URLSearchParams {
  const q = new URLSearchParams()
  if (f.busca.trim()) q.set("busca", f.busca.trim())
  if (f.uf) q.set("uf", f.uf)
  if (f.cidade.trim()) q.set("cidade", f.cidade.trim())
  if (f.avaliacaoMin !== null) q.set("avaliacaoMin", String(f.avaliacaoMin))
  if (f.ordenacao !== "relevantes") q.set("ordenacao", f.ordenacao)
  return q
}

/** Query da URL da página (inclui a aba quando não é a padrão). */
export function filtrosUsuariosParaUrl(f: FiltrosUsuarios): URLSearchParams {
  const q = filtrosUsuariosParaQuery(f)
  if (f.aba !== "fornecedores") q.set("aba", f.aba)
  return q
}

export function contarFiltrosUsuarios(f: FiltrosUsuarios): number {
  return [f.uf, f.cidade.trim(), f.avaliacaoMin !== null].filter(Boolean).length
}
