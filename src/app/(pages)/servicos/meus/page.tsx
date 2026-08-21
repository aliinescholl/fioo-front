"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import Image from "next/image"

interface Maquinario {
  id: number
  nome: string
}

interface Servico {
  id: number
  titulo: string
  descricao?: string
  cidade?: string
  estado?: string
  categoriaServico?: string
  valor?: number
  tipoCobranca: number
  tipoPrazo?: number
  dataPrazo?: string
  status: number
  dataCriacao: string
  maquinarios?: Maquinario[]
}

const STATUS_CONFIG: Record<number, { label: string; bg: string; text: string; border: string }> = {
  0: { label: "Ativo", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  1: { label: "Em Andamento", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  2: { label: "Finalizado", bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200" },
  3: { label: "Cancelado", bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
}

function getCobrancaLabel(tipo: number) {
  return tipo === 0 ? "Por Peça" : "Por Operação"
}

function getPrazoLabel(tipo?: number, data?: string) {
  if (tipo === undefined) return "A combinar"
  switch (tipo) {
    case 0: return "Semanal"
    case 1: return "Quinzenal"
    case 2: return "Mensal"
    case 3: {
      if (!data) return "Data específica"
      const parts = data.split("-")
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : data
    }
    default: return "A combinar"
  }
}

export default function MeusServicosPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const loadServicos = async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/servicos/meus/${user.id}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Falha ao carregar serviços")
      }
      const data = await res.json()
      setServicos(data)
    } catch (err: any) {
      setError(err.message ?? "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) loadServicos()
  }, [user?.id])

  const filtered = servicos.filter(s => {
    const term = search.toLowerCase()
    return (
      s.titulo.toLowerCase().includes(term) ||
      (s.categoriaServico && s.categoriaServico.toLowerCase().includes(term))
    )
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#7EBEB2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="flex flex-col items-center pb-28">
      <div className="w-full max-w-[480px] px-4 flex flex-col gap-4 pt-4">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl font-bold text-gray-800">Meus Serviços</h2>
            <p className="text-xs text-gray-400">Gerencie os serviços que você oferece</p>
          </div>
          <button
            onClick={() => router.push("/servicos/novo")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#7EBEB2] border-2 border-[#2a594d] text-[#2a594d] text-xs font-bold hover:bg-[#6aada0] active:scale-[0.98] transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Novo
          </button>
        </div>

        {/* Barra de pesquisa */}
        <div className="flex items-center border-[1.5px] border-[#7EBEB2] rounded-[10px] h-[40px] w-full overflow-hidden bg-white">
          <input
            placeholder="Pesquisar por título ou categoria..."
            className="flex-1 h-full px-3 outline-none text-sm text-gray-700"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="w-[40px] h-full flex items-center justify-center bg-[#84c4b4]">
            <Image src="/search.svg" alt="Search" width={16} height={16} />
          </div>
        </div>

        {/* Listagem */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-4 border-[#7EBEB2] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">Carregando seus serviços...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center text-center py-10 gap-3 border border-red-100 bg-red-50 rounded-[15px] p-4">
            <span className="text-sm font-semibold text-red-600">Erro: {error}</span>
            <button
              onClick={loadServicos}
              className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg text-xs transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12 gap-3 border border-dashed border-gray-200 rounded-[15px] bg-white p-4">
            <Image src="/machine.svg" alt="Nenhum serviço" width={40} height={40} className="opacity-40" />
            <span className="text-sm font-semibold text-gray-500">
              {search ? "Nenhum serviço encontrado" : "Você ainda não cadastrou serviços"}
            </span>
            {!search && (
              <button
                onClick={() => router.push("/servicos/novo")}
                className="px-4 py-2 rounded-[10px] bg-[#7EBEB2] border-2 border-[#2a594d] text-[#2a594d] text-xs font-bold hover:bg-[#6aada0] transition-all"
              >
                Cadastrar primeiro serviço
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(s => {
              const statusCfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG[0]
              return (
                <div
                  key={s.id}
                  onClick={() => router.push(`/servicos/${s.id}/editar`)}
                  className="flex flex-col p-4 border border-gray-100 bg-white rounded-[15px] shadow-sm hover:shadow-md hover:border-[#7EBEB2] transition-all cursor-pointer gap-2.5 relative group"
                >
                  {/* Linha superior */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wide uppercase text-[#2a594d] bg-[#e8f5f2] px-2 py-0.5 rounded-full">
                      {s.categoriaServico || "Geral"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 group-hover:text-[#7EBEB2] transition-colors flex items-center gap-1">
                        Editar
                        <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Título */}
                  <h3 className="font-bold text-base text-gray-800 leading-tight">{s.titulo}</h3>

                  {/* Informações */}
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs text-gray-500 pt-1 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 font-bold">R$</span>
                      <span>
                        {s.valor ? `${s.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "A combinar"} ({getCobrancaLabel(s.tipoCobranca)})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{getPrazoLabel(s.tipoPrazo, s.dataPrazo)}</span>
                    </div>
                    {(s.cidade || s.estado) && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{s.cidade && s.estado ? `${s.cidade} - ${s.estado}` : "Não informada"}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}
