"use client"

import Image from "next/image"
import { useId } from "react"

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
  aberto, onAbrirFechar, quantidadeAtivos, ordenacao, opcoesOrdenacao, onOrdenacao,
  onAplicar, onLimpar, podeAplicar = true, children,
}: Props<O>) {
  const painelId = useId()
  const ordenarId = useId()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAbrirFechar}
          aria-expanded={aberto}
          aria-controls={painelId}
          className={`flex items-center gap-2 h-[44px] px-4 rounded-[20px] border-2 border-[#84c4b4] text-sm font-semibold ${
            aberto || quantidadeAtivos > 0 ? "bg-[#84c4b4] text-white" : "bg-white text-gray-700"
          }`}
        >
          <Image src="/filter.svg" alt="" width={20} height={20} />
          Filtros{quantidadeAtivos > 0 ? ` (${quantidadeAtivos})` : ""}
        </button>

        <div className="flex-1 flex items-center gap-1 h-[44px] px-3 rounded-[20px] border-2 border-[#84c4b4] bg-white">
          <Image src="/sort.svg" alt="" width={20} height={20} />
          <label htmlFor={ordenarId} className="sr-only">Ordenar por</label>
          <select
            id={ordenarId}
            value={ordenacao}
            onChange={e => onOrdenacao(e.target.value as O)}
            className="flex-1 min-w-0 h-full bg-transparent outline-none text-sm text-gray-700"
          >
            {opcoesOrdenacao.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {aberto && (
        <div id={painelId} className="flex flex-col gap-4 p-4 border border-gray-200 rounded-[15px] bg-white shadow-sm">
          {children}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onAplicar}
              disabled={!podeAplicar}
              className="flex-1 h-[44px] rounded-[15px] border-2 border-[#2a594d] bg-[#7EBEB2] text-[#2a594d] font-bold text-sm disabled:opacity-50"
            >
              Aplicar filtros
            </button>
            <button
              type="button"
              onClick={onLimpar}
              className="flex-1 h-[44px] rounded-[15px] border border-gray-200 bg-white text-gray-600 font-semibold text-sm"
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
export function OpcoesFiltro<T extends string | number>({ rotulo, opcoes, valor, onChange, rotuloTodos = "Todos" }: OpcoesProps<T>) {
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
              className={`h-[40px] px-3 rounded-[10px] border-2 text-sm font-medium ${
                ativo ? "border-[#7EBEB2] bg-[#e8f5f2] text-[#2a594d]" : "border-gray-200 bg-white text-gray-600"
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
