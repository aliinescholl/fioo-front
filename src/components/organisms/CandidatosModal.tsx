"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

interface Candidato {
  candidaturaId: number
  status: number // 0: Pendente, 1: Aceita, 2: Recusada, 3: Cancelada
  dataCandidatura: string
  usuario: {
    id: number
    nome: string
    nomeUsuario: string
    cidade?: string | null
    estado?: string | null
  }
}

const STATUS_CANDIDATURA: Record<number, { label: string; className: string }> = {
  0: { label: "Pendente", className: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  1: { label: "Aceito", className: "text-green-700 bg-green-50 border-green-200" },
  2: { label: "Recusado", className: "text-red-600 bg-red-50 border-red-200" },
  3: { label: "Cancelou", className: "text-gray-500 bg-gray-50 border-gray-200" },
}

type Props = {
  servicoId: number
  servicoTitulo: string
  podeAceitar: boolean // serviço em andamento
  onClose: () => void
  onAceito: () => void
}

export function CandidatosModal({ servicoId, servicoTitulo, podeAceitar, onClose, onAceito }: Props) {
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<Candidato | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`/api/servicos/${servicoId}/candidaturas`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Não foi possível carregar os candidatos")
      setCandidatos(data)
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível carregar os candidatos")
    } finally {
      setLoading(false)
    }
  }, [servicoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const temCostureiro = candidatos.some(c => c.status === 1)

  async function aceitar(candidato: Candidato) {
    setEnviando(true)
    setErro(null)
    try {
      const res = await fetch(`/api/servicos/${servicoId}/candidaturas/${candidato.candidaturaId}/aceitar`, { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Não foi possível aceitar o candidato")
      }
      setSucesso(`${candidato.usuario.nome} foi aceito para este serviço.`)
      setConfirmando(null)
      onAceito()
      await carregar()
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível aceitar o candidato")
      setConfirmando(null)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidatos-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]"
    >
      <div className="bg-white rounded-[20px] max-w-[440px] w-full max-h-[85vh] p-5 flex flex-col gap-4 border border-[#e2ece9] shadow-2xl">

        <div className="flex justify-between items-start gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 id="candidatos-titulo" className="text-lg font-bold text-gray-800">Candidatos</h3>
            <span className="text-xs text-gray-500">{servicoTitulo}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 border border-[#e2ece9] flex items-center justify-center text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {sucesso && (
          <p className="text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-[12px] px-3 py-2">{sucesso}</p>
        )}
        {erro && (
          <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-[12px] px-3 py-2">{erro}</p>
        )}

        <div className="flex flex-col gap-2 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#7EBEB2] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : candidatos.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Ninguém se candidatou ainda.</p>
          ) : (
            candidatos.map(c => {
              const status = STATUS_CANDIDATURA[c.status]
              const mostrarAceitar = podeAceitar && !temCostureiro && c.status === 0
              return (
                <div key={c.candidaturaId} className="flex flex-col gap-2 p-3 border border-[#e2ece9] rounded-[12px]">
                  <div className="flex items-center gap-3">
                    <div className="w-[36px] h-[36px] shrink-0 rounded-full bg-[#7EBEB2] flex items-center justify-center text-white font-bold">
                      {c.usuario.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <Link href={`/usuarios/${c.usuario.id}`} className="text-sm font-semibold text-[#2a594d] hover:underline truncate">
                        {c.usuario.nome}
                      </Link>
                      <span className="text-xs text-gray-400">@{c.usuario.nomeUsuario}</span>
                      {c.usuario.cidade && (
                        <span className="text-xs text-gray-500">{c.usuario.cidade}{c.usuario.estado ? ` - ${c.usuario.estado}` : ""}</span>
                      )}
                    </div>
                    {status && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${status.className}`}>{status.label}</span>
                    )}
                  </div>

                  {mostrarAceitar && (confirmando?.candidaturaId === c.candidaturaId ? (
                    <div className="flex flex-col gap-2 bg-[#f4f9f8] border border-[#cfe5e0] rounded-[12px] p-3">
                      <span className="text-sm text-[#2a594d]">
                        Aceitar <strong>{c.usuario.nome}</strong> para este serviço? Os outros candidatos serão recusados.
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={enviando}
                          onClick={() => aceitar(c)}
                          className="flex-1 h-[42px] rounded-[12px] border border-[#68b0a0] bg-[#7EBEB2] hover:bg-[#6eb0a3] text-[#2a594d] font-bold text-sm transition-colors disabled:opacity-60"
                        >
                          {enviando ? "Aceitando..." : "Sim, aceitar"}
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
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setSucesso(null); setConfirmando(c) }}
                      className="h-[42px] rounded-[12px] border border-[#68b0a0] bg-[#7EBEB2] hover:bg-[#6eb0a3] text-[#2a594d] font-bold text-sm transition-colors"
                    >
                      Aceitar
                    </button>
                  ))}
                </div>
              )
            })
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-[44px] rounded-[12px] border border-[#d5e6e2] bg-white hover:bg-[#f4f9f8] text-gray-600 text-sm font-semibold transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
