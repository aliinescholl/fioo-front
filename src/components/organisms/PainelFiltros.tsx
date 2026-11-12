"use client"

import { useId } from "react"
import { Select } from "@/components/atoms/Select"

type Props<O extends string> = {
  aberto: boolean
  onAbrirFechar: () => void
  quantidadeAtivos: number
  ordenacao: O
  opcoesOrdenacao: readonly { value: O; label: string }[]
  onOrdenacao: (valor: O) => void
  onAplicar: () => void
  onLimpar: () => void
  podeAplicar?: boolean
  children: React.ReactNode
}

/**
 * Botão "Filtros" (abre/fecha o painel), seletor "Ordenar por" e o painel
 * recolhível com os campos de filtro, "Aplicar filtros" e "Limpar filtros".
 */
export function PainelFiltros<O extends string>({
  aberto,
  onAbrirFechar,
  quantidadeAtivos,
  ordenacao,
  opcoesOrdenacao,
  onOrdenacao,
  onAplicar,
  onLimpar,
  podeAplicar = true,
  children,
}: Props<O>) {
  const painelId = useId()
  const ordenarId = useId()
  const filtroAtivo = aberto || quantidadeAtivos > 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onAbrirFechar}
          aria-expanded={aberto}
          aria-controls={painelId}
          className={`flex items-center gap-2 h-[44px] px-4 rounded-[20px] border text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#7EBEB2]/30 ${
            filtroAtivo
              ? "bg-[#7EBEB2] border-[#68b0a0] text-[#2a594d] shadow-xs"
              : "bg-white border-[#84c4b4] text-[#2a594d] hover:bg-[#f4f9f8] hover:border-[#68b0a0]"
          }`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0"
          >
            <path d="M3 5h18l-7 8.2V19l-4 2v-7.8L3 5z" />
          </svg>
          <span>Filtros{quantidadeAtivos > 0 ? ` (${quantidadeAtivos})` : ""}</span>
        </button>

        <div className="flex-1 min-w-0">
          <label htmlFor={ordenarId} className="sr-only">Ordenar por</label>
          <Select<O>
            id={ordenarId}
            ariaLabel="Ordenar por"
            value={ordenacao}
            onChange={onOrdenacao}
            options={opcoesOrdenacao}
            variant="pill"
            buttonClassName="border-[#84c4b4] hover:border-[#68b0a0] hover:bg-[#f4f9f8]"
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h10M4 18h6" />
                <path d="M16 15l3 3 3-3M19 10v8" />
              </svg>
            }
          />
        </div>
      </div>

      {aberto && (
        <div
          id={painelId}
          className="flex flex-col gap-4 p-4 border border-[#d5e6e2] rounded-[16px] bg-white shadow-xs animate-[fadeIn_0.15s_ease-out]"
        >
          {children}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onAplicar}
              disabled={!podeAplicar}
              className="flex-1 h-[44px] rounded-[12px] border border-[#68b0a0] bg-[#7EBEB2] hover:bg-[#6eb0a3] text-[#2a594d] font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aplicar filtros
            </button>
            <button
              type="button"
              onClick={onLimpar}
              className="flex-1 h-[44px] rounded-[12px] border border-[#d5e6e2] bg-white hover:bg-[#f4f9f8] hover:border-[#b8d4ce] text-gray-600 font-semibold text-sm transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type OpcoesProps<T> = {
  rotulo: string
  opcoes: readonly { value: T; label: string }[]
  valor: T | null
  onChange: (valor: T | null) => void
  rotuloTodos?: string
}

/** Grupo de botões de escolha única com a opção "Todos" (valor null). */
export function OpcoesFiltro<T extends string | number>({
  rotulo,
  opcoes,
  valor,
  onChange,
  rotuloTodos = "Todos",
}: OpcoesProps<T>) {
  const todas: { value: T | null; label: string }[] = [{ value: null, label: rotuloTodos }, ...opcoes]
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-semibold text-gray-700 mb-1.5">{rotulo}</legend>
      <div className="flex flex-wrap gap-2">
        {todas.map(o => {
          const ativo = o.value === valor
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={ativo}
              onClick={() => onChange(o.value)}
              className={`h-[40px] px-3.5 rounded-[12px] border text-sm font-medium transition-all ${
                ativo
                  ? "border-[#7EBEB2] bg-[#e8f5f2] text-[#2a594d] font-semibold"
                  : "border-[#d5e6e2] bg-white text-gray-600 hover:border-[#84c4b4] hover:bg-[#f7fffe]"
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
