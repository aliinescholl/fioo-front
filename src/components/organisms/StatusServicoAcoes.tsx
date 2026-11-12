"use client"

import { useState } from "react"
import { SERVICO_STATUS, STATUS_SERVICO_CONFIG, type ServicoStatus } from "@/types/servico"

type Encerramento = typeof SERVICO_STATUS.Concluido | typeof SERVICO_STATUS.Cancelado

const CONFIRMACAO: Record<Encerramento, { pergunta: string; botao: string }> = {
  [SERVICO_STATUS.Concluido]: {
    pergunta: "Marcar este serviço como concluído? Depois disso não dá para voltar atrás e ele se tornará somente leitura.",
    botao: "Sim, concluir",
  },
  [SERVICO_STATUS.Cancelado]: {
    pergunta: "Cancelar este serviço? Depois disso não dá para voltar atrás.",
    botao: "Sim, cancelar",
  },
}

type Props = {
  servicoId: number
  status: ServicoStatus
  temCostureiro: boolean
  onAlterado: (status: ServicoStatus) => void
}

/** Mostra o status do serviço e, se estiver em andamento, as ações para encerrá-lo. */
export function StatusServicoAcoes({ servicoId, status, temCostureiro, onAlterado }: Props) {
  const [confirmando, setConfirmando] = useState<Encerramento | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const cfg = STATUS_SERVICO_CONFIG[status]
  const emAndamento = status === SERVICO_STATUS.EmAndamento

  async function alterar(novo: Encerramento) {
    setEnviando(true)
    setErro(null)
    try {
      const res = await fetch(`/api/servicos/${servicoId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novo }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Não foi possível alterar o status")
      }
      onAlterado(novo)
      setConfirmando(null)
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível alterar o status")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2.5 p-3.5 border border-[#d5e6e2] rounded-[16px] bg-white">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Status do Serviço</span>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.className}`}>{cfg.label}</span>
      </div>

      {!emAndamento && (
        <p className="text-xs text-gray-500">Este serviço foi encerrado e suas informações não podem mais ser alteradas.</p>
      )}

      {erro && <p className="text-xs font-semibold text-red-600">{erro}</p>}

      {emAndamento && confirmando !== null && (
        <div className="flex flex-col gap-2.5 bg-[#f4f9f8] border border-[#cfe5e0] rounded-[12px] p-3">
          <span className="text-sm text-gray-700">{CONFIRMACAO[confirmando].pergunta}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={enviando}
              onClick={() => alterar(confirmando)}
              className="flex-1 h-[42px] rounded-[12px] border border-[#68b0a0] bg-[#7EBEB2] hover:bg-[#6eb0a3] text-[#2a594d] font-bold text-sm transition-colors disabled:opacity-60"
            >
              {enviando ? "Salvando..." : CONFIRMACAO[confirmando].botao}
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => setConfirmando(null)}
              className="flex-1 h-[42px] rounded-[12px] border border-[#d5e6e2] bg-white hover:bg-[#f4f9f8] text-gray-600 font-semibold text-sm transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {emAndamento && confirmando === null && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={!temCostureiro}
            onClick={() => { setErro(null); setConfirmando(SERVICO_STATUS.Concluido) }}
            className="h-[44px] rounded-[12px] border border-green-300 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Marcar como concluído
          </button>
          {!temCostureiro && (
            <p className="text-xs text-gray-500">Para concluir, aceite primeiro um costureiro em &quot;Ver candidatos&quot;.</p>
          )}
          <button
            type="button"
            onClick={() => { setErro(null); setConfirmando(SERVICO_STATUS.Cancelado) }}
            className="h-[44px] rounded-[12px] border border-red-200 bg-white hover:bg-red-50 text-red-600 font-bold text-sm transition-colors"
          >
            Cancelar serviço
          </button>
        </div>
      )}
    </div>
  )
}
