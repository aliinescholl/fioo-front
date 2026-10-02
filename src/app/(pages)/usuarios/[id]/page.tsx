"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { NotaResumo } from "@/components/molecules/Estrelas"
import { PAPEL, type AvaliacoesUsuario, type PerfilPublico, type ResumoAvaliacoes } from "@/types/avaliacao"

function LinhaResumo({ rotulo, resumo }: { rotulo: string; resumo: ResumoAvaliacoes }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{rotulo}</span>
      <NotaResumo media={resumo.media} total={resumo.total} />
    </div>
  )
}

export default function PerfilPublicoPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [perfil, setPerfil] = useState<PerfilPublico | null>(null)
  const [avaliacoes, setAvaliacoes] = useState<AvaliacoesUsuario | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    Promise.all([fetch(`/api/usuarios/${id}/publico`), fetch(`/api/avaliacoes/usuario/${id}`)])
      .then(async ([resPerfil, resAvaliacoes]) => {
        const dadosPerfil = await resPerfil.json()
        if (!resPerfil.ok) throw new Error(dadosPerfil.error ?? "Não foi possível carregar o perfil")
        const dadosAvaliacoes = resAvaliacoes.ok ? await resAvaliacoes.json() : null
        if (!ativo) return
        setPerfil(dadosPerfil)
        setAvaliacoes(dadosAvaliacoes)
      })
      .catch(err => {
        if (ativo) setErro(err instanceof Error ? err.message : "Não foi possível carregar o perfil")
      })
    return () => { ativo = false }
  }, [id])

  if (erro) {
    return (
      <main className="flex flex-col items-center pt-10 px-4 gap-3">
        <p className="text-sm font-semibold text-red-600">{erro}</p>
        <button type="button" onClick={() => router.back()} className="h-[44px] px-4 rounded-[12px] border border-gray-200 text-sm font-semibold">
          Voltar
        </button>
      </main>
    )
  }

  if (!perfil) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#7EBEB2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const ehCostureiro = perfil.tipo === PAPEL.Costureiro
  // Mostra primeiro o papel do usuário; o outro papel só aparece se ele já foi avaliado nele
  const resumos = avaliacoes
    ? [
        { rotulo: "Como costureiro", resumo: avaliacoes.comoCostureiro, principal: ehCostureiro },
        { rotulo: "Como fornecedor", resumo: avaliacoes.comoFornecedor, principal: !ehCostureiro },
      ].filter(r => r.principal || r.resumo.total > 0).sort((a, b) => Number(b.principal) - Number(a.principal))
    : []

  return (
    <main className="flex flex-col items-center pb-28">
      <div className="w-full max-w-[480px] px-4 flex flex-col gap-4 pt-4">
        <button type="button" onClick={() => router.back()} className="self-start h-[40px] text-sm font-semibold text-[#2a594d]">
          ← Voltar
        </button>

        <section className="flex items-center gap-4 p-4 border border-gray-100 rounded-[15px] bg-white shadow-sm">
          {perfil.fotoPerfilUrl ? (
            <Image
              src={perfil.fotoPerfilUrl}
              alt=""
              width={64}
              height={64}
              unoptimized
              className="w-[64px] h-[64px] shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="w-[64px] h-[64px] shrink-0 rounded-full bg-[#7EBEB2] flex items-center justify-center text-white text-2xl font-bold">
              {perfil.nome.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <h2 className="text-lg font-bold text-gray-800 truncate">{perfil.nome}</h2>
            <span className="text-xs text-gray-400">@{perfil.nomeUsuario}</span>
            <span className="text-sm text-gray-600">{ehCostureiro ? "Costureiro(a)" : "Fornecedor"}</span>
            {(perfil.cidade || perfil.estado) && (
              <span className="text-xs text-gray-500">{[perfil.cidade, perfil.estado].filter(Boolean).join(" - ")}</span>
            )}
            {perfil.anosExperiencia != null && perfil.anosExperiencia > 0 && (
              <span className="text-xs text-gray-500">{perfil.anosExperiencia} anos de experiência</span>
            )}
          </div>
        </section>

        <section className="flex flex-col p-4 border border-gray-100 rounded-[15px] bg-white">
          <h3 className="text-base font-bold text-gray-800 mb-1">Avaliações</h3>
          {resumos.map(r => <LinhaResumo key={r.rotulo} rotulo={r.rotulo} resumo={r.resumo} />)}
        </section>

        <section className="flex flex-col gap-3">
          {avaliacoes && avaliacoes.itens.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">Ainda não há avaliações.</p>
          )}
          {avaliacoes?.itens.map(a => (
            <article key={a.id} className="flex flex-col gap-1.5 p-4 border border-gray-100 rounded-[15px] bg-white">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-800 truncate">{a.avaliador.nome}</span>
                <NotaResumo media={a.nota} total={1} compacto />
              </div>
              <span className="text-xs text-gray-400">
                {a.servicoTitulo} · {new Date(a.dataAvaliacao).toLocaleDateString("pt-BR")}
              </span>
              <span className="text-xs text-gray-600">
                Comunicação: {a.notaComunicacao}/5 · Qualidade do serviço: {a.notaQualidade}/5
              </span>
              {a.comentario && <p className="text-sm text-gray-700 whitespace-pre-line">{a.comentario}</p>}
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
