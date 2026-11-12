"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"
import { CategoryCombobox, Select } from "@/components/atoms/Select"
import { ESTADOS_BR } from "@/data/estados"
import {
  COBRANCA_OPCOES,
  PRAZO_OPCOES,
  PRAZO_TIPO,
  SERVICO_STATUS,
  type CobrancaTipo,
  type PrazoTipo,
  type ServicoPayload,
  type ServicoStatus,
} from "@/types/servico"
import { useCategorias } from "@/lib/useCategorias"
import { StatusServicoAcoes } from "@/components/organisms/StatusServicoAcoes"

const DATA_ESPECIFICA = String(PRAZO_TIPO.DataEspecifica)

const UF_OPCOES = [
  { value: "", label: "UF" },
  ...ESTADOS_BR.map(uf => ({ value: uf, label: uf })),
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function get<T = string>(obj: Record<string, unknown> | null | undefined, camel: string): T | undefined {
  if (obj == null) return undefined
  if (camel in obj) return obj[camel] as T
  const pascal = camel.charAt(0).toUpperCase() + camel.slice(1)
  return obj[pascal] as T
}

function enumStr(val: unknown): string {
  if (val === null || val === undefined) return ""
  return String(val)
}

function valorStr(val: unknown): string {
  if (val === null || val === undefined || val === "") return ""
  const n = Number(val)
  return isNaN(n) ? "" : String(n)
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Toast({ visible, error, message }: { visible: boolean; error?: string; message?: string }) {
  const isError = !!error
  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        flex items-center gap-2
        px-4 py-3 rounded-[12px] shadow-lg
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inp =
  "w-full h-[44px] px-4 rounded-[12px] border border-[#d5e6e2] hover:border-[#84c4b4] outline-none focus:border-[#7EBEB2] focus:ring-2 focus:ring-[#7EBEB2]/20 text-sm text-gray-700 placeholder:text-gray-400 transition-all bg-white disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed"

// ─── Página ───────────────────────────────────────────────────────────────────

export default function EditarServicoPage() {
  const router = useRouter()
  const params = useParams()
  const servicoId = params.id as string

  const [isPending, startTransition] = useTransition()
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ visible: boolean; error?: string; message?: string }>({ visible: false })

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    cidade: "",
    estado: "",
    tipoCobranca: "" as string,
    categoriaServico: "",
    valor: "",
    tipoPrazo: "" as string,
    dataPrazo: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const categorias = useCategorias()
  const [status, setStatus] = useState<ServicoStatus | null>(null)
  const [temCostureiro, setTemCostureiro] = useState(false)

  // Serviços concluídos ou cancelados ficam bloqueados para edição (somente leitura)
  const somenteLeitura = status !== null && status !== SERVICO_STATUS.EmAndamento

  // ─── Carrega dados do serviço pelo ID diretamente ─────────────────────────────
  useEffect(() => {
    if (!servicoId) return

    const fetchServico = async () => {
      setLoadingInitial(true)
      setFetchError(null)
      try {
        const res = await fetch(`/api/servicos/${servicoId}`)

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? "Falha ao carregar serviço")
        }

        const s = await res.json()

        setForm({
          titulo:           get(s, "titulo")           ?? "",
          descricao:        get(s, "descricao")        ?? "",
          cidade:           get(s, "cidade")           ?? "",
          estado:           get(s, "estado")           ?? "",
          categoriaServico: get(s, "categoriaServico") ?? "",
          tipoCobranca:     enumStr(get(s, "tipoCobranca")),
          valor:            valorStr(get(s, "valor")),
          tipoPrazo:        enumStr(get(s, "tipoPrazo")),
          dataPrazo:        get(s, "dataPrazo")        ?? "",
        })
        setStatus(get<ServicoStatus>(s, "status") ?? null)
        setTemCostureiro(get(s, "costureiroVinculado") != null)
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Erro ao carregar serviço")
      } finally {
        setLoadingInitial(false)
      }
    }

    fetchServico()
  }, [servicoId])

  // ─── Funções de formulário ────────────────────────────────────────────────────

  function set(name: string, value: string) {
    if (somenteLeitura) return
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }))
  }

  function escolherPrazo(tipo: PrazoTipo) {
    if (somenteLeitura) return
    set("tipoPrazo", String(tipo))
    if (String(tipo) !== DATA_ESPECIFICA) set("dataPrazo", "")
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.titulo.trim()) e.titulo = "Título é obrigatório"
    if (form.tipoCobranca === "") e.tipoCobranca = "Selecione o tipo de cobrança"
    if (form.valor && isNaN(parseFloat(form.valor.replace(",", ".")))) e.valor = "Valor inválido"
    if (form.tipoPrazo === "") e.tipoPrazo = "Escolha o prazo de entrega"
    if (form.tipoPrazo === DATA_ESPECIFICA && !form.dataPrazo) e.dataPrazo = "Informe a data do prazo"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function showToast(message?: string, error?: string) {
    setToast({ visible: true, message, error })
    setTimeout(() => setToast({ visible: false }), 3500)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (somenteLeitura) {
      showToast(undefined, "Serviços concluídos não podem ser editados.")
      return
    }
    if (!validate()) return

    startTransition(async () => {
      const valorNum = form.valor
        ? parseFloat(form.valor.replace(",", "."))
        : null

      const payload: ServicoPayload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        cidade: form.cidade.trim() || null,
        estado: form.estado || null,
        tipoCobranca: Number(form.tipoCobranca) as CobrancaTipo,
        categoriaServico: form.categoriaServico.trim() || null,
        valor: valorNum,
        tipoPrazo: Number(form.tipoPrazo) as PrazoTipo,
        dataPrazo: form.tipoPrazo === DATA_ESPECIFICA ? form.dataPrazo : null,
      }

      const res = await fetch(`/api/servicos/${servicoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showToast(undefined, data.error ?? "Erro ao atualizar serviço")
        return
      }

      showToast("Serviço atualizado com sucesso!")
      setTimeout(() => router.push("/servicos/meus"), 1500)
    })
  }

  // ─── Render: loading ──────────────────────────────────────────────────────────

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#7EBEB2] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-400">Carregando serviço...</span>
        </div>
      </div>
    )
  }

  // ─── Render: erro de carregamento ─────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="flex flex-col items-center text-center gap-3 border border-red-200 bg-red-50 rounded-[16px] p-6 max-w-[360px] w-full">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span className="text-sm font-semibold text-red-600">{fetchError}</span>
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-1.5 bg-white border border-[#d5e6e2] text-gray-600 font-semibold rounded-[10px] text-xs transition-colors hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-[10px] text-xs transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: formulário / visualização ────────────────────────────────────────

  return (
    <>
      <Toast visible={toast.visible} error={toast.error} message={toast.message} />

      <main className="flex flex-col items-center pb-28">
        <div className="w-full max-w-[480px] px-4 flex flex-col gap-5 pt-4">

          {/* Cabeçalho */}
          <div className="flex items-center gap-3 mb-1">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-bold text-gray-800">
                {somenteLeitura ? "Detalhes do Serviço" : "Editar Serviço"}
              </h2>
              <p className="text-xs text-gray-400">
                {somenteLeitura
                  ? "Serviço encerrado — modo somente leitura"
                  : "Atualize as informações do seu serviço"}
              </p>
            </div>
          </div>

          {somenteLeitura && (
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-[12px] border border-[#cfe5e0] bg-[#f4f9f8] text-[#2a594d] text-xs font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>
                {status === SERVICO_STATUS.Concluido
                  ? "Este serviço foi concluído e suas informações não podem mais ser editadas."
                  : "Este serviço foi cancelado e suas informações não podem mais ser editadas."}
              </span>
            </div>
          )}

          {/* ── Título ── */}
          <Field label="Título" required={!somenteLeitura}>
            <input
              id="editar-titulo"
              className={`${inp} ${errors.titulo ? "border-red-300 bg-red-50" : ""}`}
              value={form.titulo}
              maxLength={200}
              readOnly={somenteLeitura}
              disabled={somenteLeitura}
              onChange={e => set("titulo", e.target.value)}
              placeholder="Ex: Costura de jeans, Fornecimento de tecido..."
            />
            {errors.titulo && <p className="text-xs text-red-500">{errors.titulo}</p>}
          </Field>

          {/* ── Descrição ── */}
          <Field label="Descrição">
            <textarea
              id="editar-descricao"
              rows={3}
              readOnly={somenteLeitura}
              disabled={somenteLeitura}
              className="w-full px-4 py-3 rounded-[12px] border border-[#d5e6e2] hover:border-[#84c4b4] outline-none focus:border-[#7EBEB2] focus:ring-2 focus:ring-[#7EBEB2]/20 text-sm text-gray-700 placeholder:text-gray-400 resize-none transition-all bg-white disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed"
              value={form.descricao}
              onChange={e => set("descricao", e.target.value)}
              placeholder="Descreva seu serviço em detalhes..."
            />
          </Field>

          {/* ── Categoria ── */}
          <Field label="Categoria do Serviço">
            <CategoryCombobox
              id="editar-categoria"
              value={form.categoriaServico}
              onChange={v => set("categoriaServico", v)}
              categories={categorias}
              disabled={somenteLeitura}
              maxLength={100}
              placeholder="Ex: Costura, Bordado, Malharia..."
            />
            {!somenteLeitura && (
              <p className="text-xs text-gray-400">Escolha uma categoria da lista ou digite uma nova.</p>
            )}
          </Field>

          {/* ── Tipo de Cobrança ── */}
          <Field label="Tipo de Cobrança" required={!somenteLeitura}>
            <div className="flex gap-3">
              {COBRANCA_OPCOES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={somenteLeitura}
                  onClick={() => set("tipoCobranca", String(value))}
                  className={`flex-1 h-[44px] rounded-[20px] border text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    form.tipoCobranca === String(value)
                      ? "border-[#7EBEB2] bg-[#e8f5f2] text-[#2a594d]"
                      : "border-[#d5e6e2] bg-white text-gray-500 hover:border-[#84c4b4] hover:bg-[#f7fffe]"
                  } ${errors.tipoCobranca ? "border-red-300" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {errors.tipoCobranca && <p className="text-xs text-red-500">{errors.tipoCobranca}</p>}
          </Field>

          {/* ── Valor ── */}
          <Field label="Valor (R$)">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">R$</span>
              <input
                id="editar-valor"
                className={`${inp} pl-10 ${errors.valor ? "border-red-300 bg-red-50" : ""}`}
                value={form.valor}
                readOnly={somenteLeitura}
                disabled={somenteLeitura}
                onChange={e => set("valor", e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            {errors.valor && <p className="text-xs text-red-500">{errors.valor}</p>}
          </Field>

          {/* ── Localização ── */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Localização</label>
            <div className="flex items-center gap-2">
              <input
                id="editar-cidade"
                className="flex-1 min-w-0 h-[44px] px-4 rounded-[12px] border border-[#d5e6e2] hover:border-[#84c4b4] outline-none focus:border-[#7EBEB2] focus:ring-2 focus:ring-[#7EBEB2]/20 text-sm text-gray-700 placeholder:text-gray-400 transition-all bg-white disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed"
                value={form.cidade}
                maxLength={100}
                readOnly={somenteLeitura}
                disabled={somenteLeitura}
                onChange={e => set("cidade", e.target.value)}
                placeholder="Cidade"
              />
              <Select
                id="editar-estado"
                ariaLabel="Estado (UF)"
                className="w-[96px] shrink-0"
                value={form.estado}
                onChange={v => set("estado", v)}
                options={UF_OPCOES}
                placeholder="UF"
                disabled={somenteLeitura}
              />
            </div>
          </div>

          {/* ── Tipo de Prazo ── */}
          <Field label="Prazo de Entrega" required={!somenteLeitura}>
            <div className="grid grid-cols-2 gap-2">
              {PRAZO_OPCOES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={somenteLeitura}
                  onClick={() => escolherPrazo(value)}
                  className={`h-[40px] rounded-[12px] border text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    form.tipoPrazo === String(value)
                      ? "border-[#7EBEB2] bg-[#e8f5f2] text-[#2a594d] font-semibold"
                      : "border-[#d5e6e2] bg-white text-gray-600 hover:border-[#84c4b4] hover:bg-[#f7fffe]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {errors.tipoPrazo && <p className="text-xs text-red-500">{errors.tipoPrazo}</p>}
          </Field>

          {/* ── Data Prazo (condicional) ── */}
          {form.tipoPrazo === DATA_ESPECIFICA && (
            <Field label="Data do Prazo" required={!somenteLeitura}>
              <input
                id="editar-dataPrazo"
                type="date"
                readOnly={somenteLeitura}
                disabled={somenteLeitura}
                className={`${inp} ${errors.dataPrazo ? "border-red-300 bg-red-50" : ""}`}
                value={form.dataPrazo}
                onChange={e => set("dataPrazo", e.target.value)}
              />
              {errors.dataPrazo && <p className="text-xs text-red-500">{errors.dataPrazo}</p>}
            </Field>
          )}

          {/* ── Status ── */}
          {status !== null && (
            <StatusServicoAcoes
              servicoId={Number(servicoId)}
              status={status}
              temCostureiro={temCostureiro}
              onAlterado={setStatus}
            />
          )}

          {/* ── Salvar (somente se ainda estiver em andamento) ── */}
          {!somenteLeitura && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full h-[50px] rounded-[20px] border border-[#68b0a0] bg-[#7EBEB2] text-[#2a594d] text-[20px] font-bold hover:bg-[#6aada0] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isPending ? "Salvando..." : "Salvar Alterações"}
            </button>
          )}

          {/* ── Cancelar / Voltar ── */}
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full h-[44px] rounded-[20px] border border-[#d5e6e2] bg-white text-gray-600 text-sm font-semibold hover:bg-[#f4f9f8] transition-colors"
          >
            {somenteLeitura ? "Voltar" : "Cancelar"}
          </button>

        </div>
      </main>
    </>
  )
}
