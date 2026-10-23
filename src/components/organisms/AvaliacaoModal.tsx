"use client"

import { useState } from "react"
import { EstrelasInput } from "@/components/molecules/Estrelas"
import { COMENTARIO_MAX, PAPEL, type Papel } from "@/types/avaliacao"

type Props = {
  servicoId: number
  servicoTitulo: string
  papelAvaliado: Papel // quem está sendo avaliado
  nomeAvaliado: string
  onClose: () => void
  onEnviada: () => void
}

/** "Avaliar Fornecedor" (usado pelo costureiro) e "Avaliar Costureiro" (usado pelo fornecedor). */
export function AvaliacaoModal({ servicoId, servicoTitulo, papelAvaliado, nomeAvaliado, onClose, onEnviada }: Props) {
  const [nota, setNota] = useState<number | null>(null)
  const [comunicacao, setComunicacao] = useState<number | null>(null)
  const [qualidade, setQualidade] = useState<number | null>(null)
  const [comentario, setComentario] = useState("")
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const titulo = papelAvaliado === PAPEL.Fornecedor ? "Avaliar Fornecedor" : "Avaliar Costureiro"

  function validar() {
    const e: Record<string, string> = {}
    if (!nota) e.nota = "Escolha de 1 a 5 estrelas para a nota geral."
    if (!comunicacao) e.comunicacao = "Escolha de 1 a 5 estrelas para a comunicação."
    if (!qualidade) e.qualidade = "Escolha de 1 a 5 estrelas para a qualidade do serviço."
    if (comentario.trim().length > COMENTARIO_MAX) e.comentario = `O comentário pode ter no máximo ${COMENTARIO_MAX} caracteres.`
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function enviar() {
    if (!validar()) return
    setEnviando(true)
    setErroEnvio(null)
    try {
      const res = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicoId,
          nota,
          notaComunicacao: comunicacao,
          notaQualidade: qualidade,
          comentario: comentario.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // 409: já avaliou ou serviço não concluído; 400: dado inválido. O backend já devolve a mensagem em pt-BR.
        throw new Error(data.error ?? "Não foi possível enviar a avaliação. Tente de novo.")
      }
      onEnviada()
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : "Não foi possível enviar a avaliação. Tente de novo.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="avaliacao-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
    >
      <div className="bg-white rounded-[20px] max-w-[440px] w-full max-h-[90vh] overflow-y-auto p-5 flex flex-col gap-5 shadow-2xl">
        <div className="flex flex-col gap-1">
          <h3 id="avaliacao-titulo" className="text-lg font-bold text-gray-800">{titulo}</h3>
          <span className="text-sm text-gray-600">{nomeAvaliado}</span>
          <span className="text-xs text-gray-400">Serviço: {servicoTitulo}</span>
        </div>

        <EstrelasInput rotulo="Nota geral" nome="nota-geral" valor={nota} onChange={setNota} erro={erros.nota} grande />

        <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
          <span className="text-base font-bold text-gray-800">Aspectos</span>
          <EstrelasInput rotulo="Comunicação" nome="nota-comunicacao" valor={comunicacao} onChange={setComunicacao} erro={erros.comunicacao} />
          <EstrelasInput rotulo="Qualidade do serviço" nome="nota-qualidade" valor={qualidade} onChange={setQualidade} erro={erros.qualidade} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="avaliacao-comentario" className="text-sm font-semibold text-gray-700">
            Comentário <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            id="avaliacao-comentario"
            rows={3}
            maxLength={COMENTARIO_MAX}
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            placeholder="Conte como foi trabalhar com essa pessoa"
            aria-describedby="avaliacao-contador"
            className="w-full px-3 py-2 rounded-[10px] border border-gray-200 outline-none focus:border-[#7EBEB2] text-sm resize-none"
          />
          <span id="avaliacao-contador" className="self-end text-xs text-gray-500">
            {comentario.length}/{COMENTARIO_MAX}
          </span>
          {erros.comentario && <p className="text-xs text-red-500">{erros.comentario}</p>}
        </div>

        {erroEnvio && (
          <p role="alert" className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">{erroEnvio}</p>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={enviar}
            disabled={enviando}
            className="w-full h-[48px] rounded-[15px] border-2 border-[#2a594d] bg-[#7EBEB2] text-[#2a594d] font-bold text-base disabled:opacity-60"
          >
            {enviando ? "Enviando..." : "Enviar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="w-full h-[44px] rounded-[15px] border border-gray-200 bg-white text-gray-600 font-semibold text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
