"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import Image from "next/image"
import Link from "next/link"
import { FilterTag } from "@/components/molecules/FilterTag"
import { AvaliacaoModal } from "@/components/organisms/AvaliacaoModal"
import { useAvaliacoesFeitas } from "@/lib/useAvaliacoesFeitas"
import { PAPEL } from "@/types/avaliacao"
import { OpcoesFiltro, PainelFiltros } from "@/components/organisms/PainelFiltros"
import { ESTADOS_BR } from "@/data/estados"
import {
  COBRANCA_OPCOES, FILTROS_SERVICOS_VAZIOS, ORDENACAO_SERVICOS, PRAZO_OPCOES, SERVICO_STATUS, STATUS_SERVICO_CONFIG,
  contarFiltrosServicos, filtrosServicosParaQuery, getCobrancaLabel, getPrazoLabel, lerFiltrosServicos, normalizarValor,
  type FiltrosServicos, type PaginaServicos, type Servico, type ServicoStatus,
} from "@/types/servico"

const STATUS_OPCOES = Object.entries(STATUS_SERVICO_CONFIG).map(([value, cfg]) => ({
  value: Number(value) as ServicoStatus,
  label: cfg.label,
}))

const inp = "w-full h-[44px] px-3 rounded-[10px] border border-gray-200 outline-none focus:border-[#7EBEB2] text-sm bg-white"

interface Candidatura {
  id: number
  status: number // 0: Pendente, 1: Aceita, 2: Recusada, 3: Cancelada
  dataCandidatura: string
  servico: {
    id: number
  }
}

function Toast({ visible, error, message }: { visible: boolean; error?: string; message?: string }) {
  const isError = !!error
  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        flex items-center gap-2
        px-4 py-3 rounded-xl shadow-lg
        border transition-all duration-300
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}
        ${isError
          ? "bg-white border-red-200 text-red-600"
          : "bg-white border-green-200 text-green-700"}
      `}
    >
      {isError
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      }
      <span className="text-sm font-semibold">{error ?? message ?? "Ação realizada!"}</span>
    </div>
  )
}

// useSearchParams exige um limite de Suspense no App Router
export default function ServicosFeedPage() {
  return (
    <Suspense fallback={<Carregando />}>
      <ServicosFeed />
    </Suspense>
  )
}

function Carregando() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#7EBEB2] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ServicosFeed() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Filtros e ordenação ficam na URL (compartilhável e preservada ao voltar)
  const filtros = useMemo(() => lerFiltrosServicos(new URLSearchParams(searchParams.toString())), [searchParams])
  const queryFiltros = filtrosServicosParaQuery(filtros).toString()
  const quantidadeFiltros = contarFiltrosServicos(filtros)

  const [servicos, setServicos] = useState<Servico[]>([])
  const [pagina, setPagina] = useState(1)
  const [temMais, setTemMais] = useState(false)
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [painelAberto, setPainelAberto] = useState(false)
  const [rascunho, setRascunho] = useState<FiltrosServicos>(filtros)

  // Busca textual com debounce; acompanha a URL quando ela muda (ex.: botão voltar)
  const [busca, setBusca] = useState(filtros.busca)
  const [buscaDaUrl, setBuscaDaUrl] = useState(filtros.busca)
  if (filtros.busca !== buscaDaUrl) {
    setBuscaDaUrl(filtros.busca)
    setBusca(filtros.busca)
  }

  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)
  const [avaliando, setAvaliando] = useState<Servico | null>(null)
  const { feitas, recarregar: recarregarFeitas } = useAvaliacoesFeitas()
  const [toast, setToast] = useState<{ visible: boolean; error?: string; message?: string }>({ visible: false })
  const [isPending, startTransition] = useTransition()

  // Mapeamento de servicoId para status de candidatura
  const appliedStatusMap = new Map<number, number>()
  candidaturas.forEach(c => {
    if (c.servico) {
      appliedStatusMap.set(c.servico.id, c.status)
    }
  })

  const irParaFiltros = useCallback((novos: FiltrosServicos) => {
    const qs = filtrosServicosParaQuery(novos).toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname])

  useEffect(() => {
    if (busca.trim() === filtros.busca.trim()) return
    const t = setTimeout(() => irParaFiltros({ ...filtros, busca }), 400)
    return () => clearTimeout(t)
  }, [busca, filtros, irParaFiltros])

  // Ignora respostas antigas quando os filtros mudam rápido
  const ultimaRequisicao = useRef(0)

  const carregarServicos = useCallback(async (paginaDesejada: number) => {
    const requisicao = ++ultimaRequisicao.current
    if (paginaDesejada === 1) setLoading(true)
    else setCarregandoMais(true)
    setError(null)
    try {
      const qs = new URLSearchParams(queryFiltros)
      qs.set("pagina", String(paginaDesejada))
      const res = await fetch(`/api/servicos?${qs}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Falha ao carregar serviços")
      if (requisicao !== ultimaRequisicao.current) return
      const resultado = data as PaginaServicos
      setServicos(atual => paginaDesejada === 1 ? resultado.itens : [...atual, ...resultado.itens])
      setPagina(resultado.pagina)
      setTemMais(resultado.temMais)
    } catch (err) {
      if (requisicao === ultimaRequisicao.current)
        setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      if (requisicao === ultimaRequisicao.current) {
        setLoading(false)
        setCarregandoMais(false)
      }
    }
  }, [queryFiltros])

  const carregarCandidaturas = useCallback(async () => {
    if (!user?.id) return
    const res = await fetch(`/api/candidaturas/em-andamento/${user.id}`)
    if (res.ok) setCandidaturas(await res.json())
  }, [user?.id])

  useEffect(() => {
    if (user?.id) carregarServicos(1)
  }, [user?.id, carregarServicos])

  useEffect(() => {
    carregarCandidaturas()
  }, [carregarCandidaturas])

  useEffect(() => {
    fetch("/api/servicos/categorias")
      .then(res => (res.ok ? res.json() : []))
      .then((data: string[]) => setCategorias(data))
      .catch(() => setCategorias([]))
  }, [])

  function abrirFecharPainel() {
    if (!painelAberto) setRascunho(filtros)
    setPainelAberto(!painelAberto)
  }

  const valorInvalido =
    normalizarValor(rascunho.valorMin) !== "" && normalizarValor(rascunho.valorMax) !== ""
    && Number(normalizarValor(rascunho.valorMin)) > Number(normalizarValor(rascunho.valorMax))

  function aplicarFiltros() {
    if (valorInvalido) return
    irParaFiltros({ ...rascunho, busca: filtros.busca, ordenacao: filtros.ordenacao })
    setPainelAberto(false)
  }

  function limparFiltros() {
    setBusca("")
    setRascunho(FILTROS_SERVICOS_VAZIOS)
    irParaFiltros({ ...FILTROS_SERVICOS_VAZIOS, ordenacao: filtros.ordenacao })
    setPainelAberto(false)
  }

  // Etiquetas dos filtros ativos, cada uma com o filtro "sem ela"
  const etiquetas: { label: string; sem: FiltrosServicos }[] = []
  if (filtros.uf || filtros.cidade)
    etiquetas.push({ label: [filtros.cidade, filtros.uf].filter(Boolean).join(" - "), sem: { ...filtros, uf: "", cidade: "" } })
  if (filtros.valorMin || filtros.valorMax)
    etiquetas.push({
      label: filtros.valorMin && filtros.valorMax ? `R$ ${filtros.valorMin} a ${filtros.valorMax}`
        : filtros.valorMin ? `A partir de R$ ${filtros.valorMin}` : `Até R$ ${filtros.valorMax}`,
      sem: { ...filtros, valorMin: "", valorMax: "" },
    })
  if (filtros.cobranca !== null)
    etiquetas.push({ label: getCobrancaLabel(filtros.cobranca), sem: { ...filtros, cobranca: null } })
  if (filtros.prazo !== null)
    etiquetas.push({ label: getPrazoLabel(filtros.prazo, null), sem: { ...filtros, prazo: null } })
  if (filtros.categoria)
    etiquetas.push({ label: filtros.categoria, sem: { ...filtros, categoria: "" } })
  if (filtros.status !== null)
    etiquetas.push({ label: STATUS_SERVICO_CONFIG[filtros.status].label, sem: { ...filtros, status: null } })

  const showToast = (message?: string, error?: string) => {
    setToast({ visible: true, message, error })
    setTimeout(() => setToast({ visible: false }), 3500)
  }

  const handleApply = (servicoId: number) => {
    if (!user?.id) return
    startTransition(async () => {
      try {
        const res = await fetch("/api/candidaturas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ servicoId })
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          showToast(undefined, errData.error ?? "Erro ao enviar candidatura")
          return
        }

        showToast("Candidatura enviada com sucesso!")
        
        // Atualiza a lista de candidaturas do estado para desabilitar o botão imediatamente
        await carregarCandidaturas()
        
        // Fecha o modal de detalhes
        setSelectedServico(null)
      } catch {
        showToast(undefined, "Erro ao enviar candidatura")
      }
    })
  }

  const getCandidaturaStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="text-[12px] font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
            Pendente
          </span>
        )
      case 1:
        return (
          <span className="text-[12px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            Aceita
          </span>
        )
      case 2:
        return (
          <span className="text-[12px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            Recusada
          </span>
        )
      case 3:
        return (
          <span className="text-[12px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
            Cancelada
          </span>
        )
      default:
        return null
    }
  }

  if (!user) {
    return <Carregando />
  }

  return (
    <>
      <Toast visible={toast.visible} error={toast.error} message={toast.message} />

      <main className="flex flex-col items-center pb-28">
        <div className="w-full max-w-[480px] px-4 flex flex-col gap-4 pt-4">
          
          {/* Cabeçalho */}
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-gray-800">Serviços Disponíveis</h2>
            <p className="text-xs text-gray-400">Encontre oportunidades de fornecedores e candidate-se</p>
          </div>

          {/* Barra de Pesquisa */}
          <div className="flex items-center border-[1.5px] border-[#7EBEB2] rounded-[10px] h-[44px] w-full overflow-hidden bg-white">
            <input
              type="search"
              aria-label="Pesquisar por nome do serviço"
              placeholder="Pesquisar por nome do serviço..."
              className="flex-1 h-full px-3 outline-none text-sm text-gray-700"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <div className="w-[44px] h-full flex items-center justify-center bg-[#84c4b4]">
              <Image src="/search.svg" alt="" width={16} height={16} />
            </div>
          </div>

          {/* Filtros e ordenação */}
          <PainelFiltros
            aberto={painelAberto}
            onAbrirFechar={abrirFecharPainel}
            quantidadeAtivos={quantidadeFiltros}
            ordenacao={filtros.ordenacao}
            opcoesOrdenacao={ORDENACAO_SERVICOS}
            onOrdenacao={ordenacao => irParaFiltros({ ...filtros, ordenacao })}
            onAplicar={aplicarFiltros}
            onLimpar={limparFiltros}
            podeAplicar={!valorInvalido}
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

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-gray-700">Valor (R$)</span>
              <div className="flex items-center gap-2">
                <input
                  aria-label="Valor mínimo"
                  placeholder="Mínimo"
                  inputMode="decimal"
                  className={`${inp} flex-1 ${valorInvalido ? "border-red-400 bg-red-50" : ""}`}
                  value={rascunho.valorMin}
                  onChange={e => setRascunho(r => ({ ...r, valorMin: e.target.value }))}
                />
                <span className="text-sm text-gray-400">até</span>
                <input
                  aria-label="Valor máximo"
                  placeholder="Máximo"
                  inputMode="decimal"
                  className={`${inp} flex-1 ${valorInvalido ? "border-red-400 bg-red-50" : ""}`}
                  value={rascunho.valorMax}
                  onChange={e => setRascunho(r => ({ ...r, valorMax: e.target.value }))}
                />
              </div>
              {valorInvalido && <p className="text-xs text-red-500">O valor mínimo não pode ser maior que o máximo.</p>}
            </div>

            <OpcoesFiltro
              rotulo="Cobrança por"
              opcoes={COBRANCA_OPCOES}
              valor={rascunho.cobranca}
              onChange={cobranca => setRascunho(r => ({ ...r, cobranca }))}
            />

            <OpcoesFiltro
              rotulo="Entrega"
              opcoes={PRAZO_OPCOES}
              valor={rascunho.prazo}
              onChange={prazo => setRascunho(r => ({ ...r, prazo }))}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="filtro-categoria" className="text-sm font-semibold text-gray-700">Serviço aplicado</label>
              <select
                id="filtro-categoria"
                className={inp}
                value={rascunho.categoria}
                onChange={e => setRascunho(r => ({ ...r, categoria: e.target.value }))}
              >
                <option value="">Todos</option>
                {rascunho.categoria && !categorias.includes(rascunho.categoria) && (
                  <option value={rascunho.categoria}>{rascunho.categoria}</option>
                )}
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <OpcoesFiltro
              rotulo="Status"
              opcoes={STATUS_OPCOES}
              valor={rascunho.status}
              onChange={status => setRascunho(r => ({ ...r, status }))}
            />
          </PainelFiltros>

          {etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {etiquetas.map(e => (
                <FilterTag key={e.label} label={e.label} onRemove={() => irParaFiltros(e.sem)} />
              ))}
            </div>
          )}

          {/* Listagem de Serviços */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-8 h-8 border-4 border-[#7EBEB2] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Carregando serviços...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center text-center py-10 gap-3 border border-red-100 bg-red-50 rounded-[15px] p-4">
              <span className="text-sm font-semibold text-red-600">Erro: {error}</span>
              <button
                onClick={() => carregarServicos(1)}
                className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg text-xs transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : servicos.length === 0 && (quantidadeFiltros > 0 || filtros.busca) ? (
            <div className="flex flex-col items-center text-center py-12 gap-3 border border-dashed border-gray-200 rounded-[15px] bg-white p-4">
              <Image src="/machine.svg" alt="" width={40} height={40} className="opacity-40" />
              <span className="text-sm font-semibold text-gray-600">Nenhum serviço encontrado com esses filtros</span>
              <button
                type="button"
                onClick={limparFiltros}
                className="h-[44px] px-4 rounded-[12px] border-2 border-[#2a594d] bg-[#7EBEB2] text-[#2a594d] text-sm font-bold"
              >
                Limpar filtros
              </button>
            </div>
          ) : servicos.length === 0 ? (
            <div className="flex flex-col items-center text-center py-12 gap-2 border border-dashed border-gray-200 rounded-[15px] bg-white p-4">
              <Image src="/machine.svg" alt="Nenhum serviço" width={40} height={40} className="opacity-40" />
              <span className="text-sm font-semibold text-gray-500">Nenhum serviço disponível</span>
              <p className="text-xs text-gray-400">No momento não há serviços publicados por outros fornecedores.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {servicos.map(s => {
                const isApplied = appliedStatusMap.has(s.id)
                const candidaturaStatus = appliedStatusMap.get(s.id)

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedServico(s)}
                    className="flex flex-col p-4 border border-gray-100 bg-white rounded-[15px] shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer gap-2.5 relative group"
                  >
                    {/* Linha superior: Categoria e Status/Ver detalhes */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold tracking-wide uppercase text-[#2a594d] bg-[#e8f5f2] px-2 py-0.5 rounded-full">
                          {s.categoriaServico || "Geral"}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_SERVICO_CONFIG[s.status].className}`}>
                          {STATUS_SERVICO_CONFIG[s.status].label}
                        </span>
                      </div>
                      {isApplied && candidaturaStatus !== undefined ? (
                        getCandidaturaStatusBadge(candidaturaStatus)
                      ) : (
                        <span className="text-[11px] font-medium text-gray-400 group-hover:text-[#7EBEB2] transition-colors flex items-center gap-1">
                          Ver Detalhes
                          <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </span>
                      )}
                    </div>

                    {/* Título do Serviço */}
                    <h3 className="font-bold text-base text-gray-800 leading-tight">
                      {s.titulo}
                    </h3>

                    {/* Informações chaves */}
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs text-gray-500 pt-1 border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 font-bold">R$</span>
                        <span>{s.valor ? `${s.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "A combinar"} ({getCobrancaLabel(s.tipoCobranca)})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span className="truncate">{getPrazoLabel(s.tipoPrazo, s.dataPrazo)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span>{s.cidade && s.estado ? `${s.cidade} - ${s.estado}` : "Não informada"}</span>
                      </div>
                    </div>

                    {/* Fornecedor */}
                    <div className="flex items-center gap-2 pt-2 mt-1 border-t border-gray-50">
                      <div className="w-[24px] h-[24px] rounded-full bg-[#7EBEB2] flex items-center justify-center text-white text-xs font-bold">
                        {s.usuario.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-gray-700 leading-none">{s.usuario.nome}</span>
                        <span className="text-[9px] text-gray-400">@{s.usuario.nomeUsuario}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {temMais && (
                <button
                  type="button"
                  onClick={() => carregarServicos(pagina + 1)}
                  disabled={carregandoMais}
                  className="h-[44px] rounded-[15px] border-2 border-[#7EBEB2] bg-white text-[#2a594d] text-sm font-bold disabled:opacity-60"
                >
                  {carregandoMais ? "Carregando..." : "Carregar mais serviços"}
                </button>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Modal de Detalhes */}
      {selectedServico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-[20px] max-w-[440px] w-full p-5 flex flex-col gap-4 border border-gray-100 shadow-2xl relative">
            
            {/* Header Modal */}
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#2a594d] bg-[#e8f5f2] px-2 py-0.5 rounded-full w-max">
                  {selectedServico.categoriaServico || "Geral"}
                </span>
                <h3 className="text-lg font-bold text-gray-800 mt-1 leading-snug">
                  {selectedServico.titulo}
                </h3>
              </div>
              <button
                onClick={() => setSelectedServico(null)}
                className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Seção Fornecedor (abre o perfil público) */}
            <Link
              href={`/usuarios/${selectedServico.usuario.id}`}
              className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-[12px] border border-gray-100"
            >
              <div className="w-[36px] h-[36px] rounded-full bg-[#7EBEB2] flex items-center justify-center text-white text-base font-bold">
                {selectedServico.usuario.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-800">{selectedServico.usuario.nome}</span>
                <span className="text-[10px] text-gray-400">@{selectedServico.usuario.nomeUsuario}</span>
                {selectedServico.usuario.cidade && (
                  <span className="text-[9px] text-gray-500 mt-0.5">{selectedServico.usuario.cidade} - {selectedServico.usuario.estado}</span>
                )}
              </div>
              <span className="ml-auto text-[11px] font-semibold text-[#2a594d]">Ver perfil</span>
            </Link>

            {/* Detalhes do Serviço */}
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-0.5 border border-gray-100 p-2.5 rounded-[10px]">
                  <span className="text-gray-400 font-semibold text-[10px]">VALOR</span>
                  <span className="font-bold text-gray-700">
                    {selectedServico.valor ? `R$ ${selectedServico.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "A combinar"}
                  </span>
                  <span className="text-[9px] text-gray-400">{getCobrancaLabel(selectedServico.tipoCobranca)}</span>
                </div>
                <div className="flex flex-col gap-0.5 border border-gray-100 p-2.5 rounded-[10px]">
                  <span className="text-gray-400 font-semibold text-[10px]">PRAZO</span>
                  <span className="font-bold text-gray-700">
                    {getPrazoLabel(selectedServico.tipoPrazo, selectedServico.dataPrazo)}
                  </span>
                </div>
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-gray-400">DESCRIÇÃO DO SERVIÇO</span>
                <div className="text-xs text-gray-600 bg-gray-50/50 p-3 rounded-[12px] border border-gray-100 max-h-[120px] overflow-y-auto whitespace-pre-line leading-relaxed">
                  {selectedServico.descricao || "Nenhuma descrição fornecida para este serviço."}
                </div>
              </div>

              {/* Maquinários Necessários */}
              {selectedServico.maquinarios && selectedServico.maquinarios.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-400">MAQUINÁRIOS REQUISITADOS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedServico.maquinarios.map(m => (
                      <span key={m.id} className="text-[10px] font-medium text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                        {m.nome}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 mt-1">
              {appliedStatusMap.get(selectedServico.id) === 1 && selectedServico.status === SERVICO_STATUS.Concluido ? (
                feitas.has(selectedServico.id) ? (
                  <div className="w-full h-[46px] rounded-[15px] border border-green-200 bg-green-50 flex items-center justify-center text-green-700 font-semibold text-sm">
                    Avaliação enviada
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAvaliando(selectedServico); setSelectedServico(null) }}
                    className="w-full h-[46px] rounded-[15px] border-2 border-[#2a594d] bg-[#7EBEB2] text-[#2a594d] font-bold text-sm"
                  >
                    Avaliar fornecedor
                  </button>
                )
              ) : appliedStatusMap.has(selectedServico.id) ? (
                <div className="flex flex-col items-center gap-1.5 w-full">
                  <div className="w-full h-[46px] rounded-[15px] border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 font-semibold text-sm gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Candidatura já enviada
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    Status: {getCandidaturaStatusBadge(appliedStatusMap.get(selectedServico.id)!)}
                  </div>
                </div>
              ) : selectedServico.status !== SERVICO_STATUS.EmAndamento ? (
                <div className="w-full h-[46px] rounded-[15px] border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 font-semibold text-sm">
                  Este serviço foi encerrado
                </div>
              ) : selectedServico.costureiroVinculado ? (
                <div className="w-full h-[46px] rounded-[15px] border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 font-semibold text-sm">
                  Este serviço já tem costureiro
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleApply(selectedServico.id)}
                  className="w-full h-[46px] rounded-[15px] border-2 border-[#2a594d] bg-[#7EBEB2] text-[#2a594d] font-bold text-sm hover:bg-[#6aada0] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#2a594d] border-t-transparent rounded-full animate-spin" />
                      Candidatando...
                    </>
                  ) : (
                    "Candidatar-se ao Serviço"
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedServico(null)}
                className="w-full h-[40px] rounded-[15px] border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-xs font-semibold transition-colors"
              >
                Voltar
              </button>
            </div>

          </div>
        </div>
      )}

      {avaliando && (
        <AvaliacaoModal
          servicoId={avaliando.id}
          servicoTitulo={avaliando.titulo}
          papelAvaliado={PAPEL.Fornecedor}
          nomeAvaliado={avaliando.usuario.nome}
          onClose={() => setAvaliando(null)}
          onEnviada={() => { setAvaliando(null); recarregarFeitas(); showToast("Avaliação enviada. Obrigado!") }}
        />
      )}
    </>
  )
}
