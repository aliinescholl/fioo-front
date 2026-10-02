"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { TabsConsulta } from "@/components/organisms/TabsConsulta"
import { OpcoesFiltro, PainelFiltros } from "@/components/organisms/PainelFiltros"
import { SearchInput } from "@/components/atoms/SearchInput"
import { UserCard } from "@/components/organisms/UserCard"
import { FilterTag } from "@/components/molecules/FilterTag"
import { ESTADOS_BR } from "@/data/estados"
import {
  AVALIACAO_MIN_OPCOES, ORDENACAO_USUARIOS, contarFiltrosUsuarios, filtrosUsuariosParaQuery, filtrosUsuariosParaUrl,
  lerFiltrosUsuarios, type AbaEncontrar, type FiltrosUsuarios, type PaginaUsuarios, type UsuarioCard,
} from "@/types/usuario"

const inp = "w-full h-[44px] px-3 rounded-[10px] border border-gray-200 outline-none focus:border-[#7EBEB2] text-sm bg-white"

// useSearchParams exige um limite de Suspense no App Router
export default function ConsultaPage() {
  return (
    <Suspense fallback={<span className="block text-center text-sm text-gray-400 mt-8">Carregando...</span>}>
      <Encontrar />
    </Suspense>
  )
}

function Encontrar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Aba, filtros e ordenação ficam na URL (compartilhável e preservada ao voltar)
  const filtros = useMemo(() => lerFiltrosUsuarios(new URLSearchParams(searchParams.toString())), [searchParams])
  const queryApi = filtrosUsuariosParaQuery(filtros).toString()
  const quantidadeFiltros = contarFiltrosUsuarios(filtros)

  const [lista, setLista] = useState<UsuarioCard[]>([])
  const [pagina, setPagina] = useState(1)
  const [temMais, setTemMais] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [painelAberto, setPainelAberto] = useState(false)
  const [rascunho, setRascunho] = useState<FiltrosUsuarios>(filtros)

  // Busca com debounce; acompanha a URL quando ela muda (ex.: botão voltar, troca de aba)
  const [busca, setBusca] = useState(filtros.busca)
  const [buscaDaUrl, setBuscaDaUrl] = useState(filtros.busca)
  if (filtros.busca !== buscaDaUrl) {
    setBuscaDaUrl(filtros.busca)
    setBusca(filtros.busca)
  }

  const irPara = useCallback((novos: FiltrosUsuarios) => {
    const qs = filtrosUsuariosParaUrl(novos).toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname])

  useEffect(() => {
    if (busca.trim() === filtros.busca.trim()) return
    const t = setTimeout(() => irPara({ ...filtros, busca }), 400)
    return () => clearTimeout(t)
  }, [busca, filtros, irPara])

  // Ignora respostas antigas quando a aba ou os filtros mudam rápido
  const ultimaRequisicao = useRef(0)

  const carregar = useCallback(async (paginaDesejada: number) => {
    const requisicao = ++ultimaRequisicao.current
    if (paginaDesejada === 1) setCarregando(true)
    else setCarregandoMais(true)
    setErro(null)
    try {
      const qs = new URLSearchParams(queryApi)
      qs.set("pagina", String(paginaDesejada))
      const res = await fetch(`/api/usuarios/${filtros.aba}?${qs}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Não foi possível carregar a lista")
      if (requisicao !== ultimaRequisicao.current) return
      const resultado = data as PaginaUsuarios
      setLista(atual => paginaDesejada === 1 ? resultado.itens : [...atual, ...resultado.itens])
      setPagina(resultado.pagina)
      setTemMais(resultado.temMais)
    } catch (err) {
      if (requisicao === ultimaRequisicao.current)
        setErro(err instanceof Error ? err.message : "Não foi possível carregar a lista")
    } finally {
      if (requisicao === ultimaRequisicao.current) {
        setCarregando(false)
        setCarregandoMais(false)
      }
    }
  }, [queryApi, filtros.aba])

  useEffect(() => {
    carregar(1)
  }, [carregar])

  function trocarAba(aba: AbaEncontrar) {
    irPara({ ...filtros, aba })
  }

  function abrirFecharPainel() {
    if (!painelAberto) setRascunho(filtros)
    setPainelAberto(!painelAberto)
  }

  function aplicarFiltros() {
    irPara({ ...rascunho, aba: filtros.aba, busca: filtros.busca, ordenacao: filtros.ordenacao })
    setPainelAberto(false)
  }

  function limparFiltros() {
    setBusca("")
    irPara({ aba: filtros.aba, busca: "", uf: "", cidade: "", avaliacaoMin: null, ordenacao: filtros.ordenacao })
    setPainelAberto(false)
  }

  const etiquetas: { label: string; sem: FiltrosUsuarios }[] = []
  if (filtros.uf || filtros.cidade)
    etiquetas.push({ label: [filtros.cidade, filtros.uf].filter(Boolean).join(" - "), sem: { ...filtros, uf: "", cidade: "" } })
  if (filtros.avaliacaoMin !== null)
    etiquetas.push({
      label: AVALIACAO_MIN_OPCOES.find(o => o.value === filtros.avaliacaoMin)!.label,
      sem: { ...filtros, avaliacaoMin: null },
    })

  const comFiltros = quantidadeFiltros > 0 || filtros.busca.trim() !== ""

  return (
    <main className="flex flex-col items-center pt-4">

      <div className="w-full max-w-[700px] flex flex-col gap-4 px-4">

        <TabsConsulta ativo={filtros.aba} onChange={trocarAba} />

        <div className="flex justify-center mt-2">
          <SearchInput value={busca} onChange={setBusca} />
        </div>

        <PainelFiltros
          aberto={painelAberto}
          onAbrirFechar={abrirFecharPainel}
          quantidadeAtivos={quantidadeFiltros}
          ordenacao={filtros.ordenacao}
          opcoesOrdenacao={ORDENACAO_USUARIOS}
          onOrdenacao={ordenacao => irPara({ ...filtros, ordenacao })}
          onAplicar={aplicarFiltros}
          onLimpar={limparFiltros}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-700">Localização</span>
            <div className="flex gap-2">
              <input
                aria-label="Cidade"
                placeholder="Cidade"
                className={`${inp} flex-1`}
                value={rascunho.cidade}
                onChange={e => setRascunho(r => ({ ...r, cidade: e.target.value }))}
              />
              <select
                aria-label="Estado (UF)"
                className={`${inp} w-[90px]`}
                value={rascunho.uf}
                onChange={e => setRascunho(r => ({ ...r, uf: e.target.value }))}
              >
                <option value="">UF</option>
                {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          <OpcoesFiltro
            rotulo="Avaliação mínima"
            opcoes={AVALIACAO_MIN_OPCOES}
            valor={rascunho.avaliacaoMin}
            onChange={avaliacaoMin => setRascunho(r => ({ ...r, avaliacaoMin }))}
            rotuloTodos="Qualquer"
          />
        </PainelFiltros>

        {etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {etiquetas.map(e => (
              <FilterTag key={e.label} label={e.label} onRemove={() => irPara(e.sem)} />
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-4 pb-24">

          {carregando && (
            <span className="text-sm text-gray-400 mt-4">Carregando...</span>
          )}

          {!carregando && erro && (
            <div className="flex flex-col items-center gap-2 mt-4">
              <span className="text-sm font-semibold text-red-600">{erro}</span>
              <button type="button" onClick={() => carregar(1)} className="h-[44px] px-4 rounded-[12px] border border-red-200 text-sm font-semibold text-red-700">
                Tentar novamente
              </button>
            </div>
          )}

          {!carregando && !erro && lista.length === 0 && (
            comFiltros ? (
              <div className="flex flex-col items-center gap-3 mt-4 text-center">
                <span className="text-sm font-semibold text-gray-600">Ninguém encontrado com esses filtros</span>
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="h-[44px] px-4 rounded-[12px] border-2 border-[#2a594d] bg-[#7EBEB2] text-[#2a594d] text-sm font-bold"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-400 mt-4">Nenhum resultado encontrado.</span>
            )
          )}

          {!carregando && !erro && lista.map(u => (
            <UserCard
              key={u.id}
              id={u.id}
              nome={u.nome}
              localizacao={u.localizacao}
              imagem={u.foto ?? "/user.png"}
              media={u.media}
              totalAvaliacoes={u.totalAvaliacoes}
            />
          ))}

          {!carregando && temMais && (
            <button
              type="button"
              onClick={() => carregar(pagina + 1)}
              disabled={carregandoMais}
              className="w-full h-[44px] rounded-[15px] border-2 border-[#84c4b4] bg-white text-[#2a594d] text-sm font-bold disabled:opacity-60"
            >
              {carregandoMais ? "Carregando..." : "Carregar mais"}
            </button>
          )}

        </div>

      </div>

    </main>
  )
}
