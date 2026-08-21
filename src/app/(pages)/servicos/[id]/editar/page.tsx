"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

// ─── Enums (espelhando o backend C#) ─────────────────────────────────────────

const COBRANCA_TIPO = [
  { value: 0, label: "Por Peça" },
  { value: 1, label: "Por Operação" },
]

const PRAZO_TIPO = [
  { value: 0, label: "Semanal" },
  { value: 1, label: "Quinzenal" },
  { value: 2, label: "Mensal" },
  { value: 3, label: "Data Específica" },
]

const STATUS_TIPO = [
  { value: 0, label: "Ativo" },
  { value: 1, label: "Em Andamento" },
  { value: 2, label: "Finalizado" },
  { value: 3, label: "Cancelado" },
]

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normaliza um campo que pode vir como camelCase ou PascalCase do backend.
 * Ex: get(s, "tipoCobranca") tenta s.tipoCobranca e s.TipoCobranca.
 */
function get<T = any>(obj: any, camel: string): T | undefined {
  if (obj == null) return undefined
  if (camel in obj) return obj[camel]
  const pascal = camel.charAt(0).toUpperCase() + camel.slice(1)
  return obj[pascal]
}

/** Converte um enum nullable para string, tratando 0 como válido. */
function enumStr(val: any): string {
  if (val === null || val === undefined) return ""
  return String(val)
}

/** Converte decimal/number para string de input, sem trailing zeros desnecessários. */
function valorStr(val: any): string {
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

const inp = "w-full h-[44px] px-4 rounded-[10px] border border-gray-200 outline-none focus:border-[#7EBEB2] text-sm transition-colors bg-white"

// ─── Página ───────────────────────────────────────────────────────────────────

export default function EditarServicoPage() {
  const { user } = useAuth()
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
    status: "0",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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

        // Normaliza todos os campos (suporta camelCase e PascalCase do backend)
        setForm({
          titulo:          get(s, "titulo")          ?? "",
          descricao:       get(s, "descricao")       ?? "",
          cidade:          get(s, "cidade")          ?? "",
          estado:          get(s, "estado")          ?? "",
          categoriaServico: get(s, "categoriaServico") ?? "",
          tipoCobranca:    enumStr(get(s, "tipoCobranca")),
          valor:           valorStr(get(s, "valor")),
          tipoPrazo:       enumStr(get(s, "tipoPrazo")),
          dataPrazo:       get(s, "dataPrazo")       ?? "",
          status:          enumStr(get(s, "status")) || "0",
        })
      } catch (err: any) {
        setFetchError(err.message ?? "Erro ao carregar serviço")
      } finally {
        setLoadingInitial(false)
      }
    }

    fetchServico()
  }, [servicoId])

  // ─── Funções de formulário ────────────────────────────────────────────────────

  function set(name: string, value: string) {
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.titulo.trim()) e.titulo = "Título é obrigatório"
    if (form.tipoCobranca === "") e.tipoCobranca = "Selecione o tipo de cobrança"
    if (form.valor && isNaN(parseFloat(form.valor.replace(",", ".")))) e.valor = "Valor inválido"
    if (form.tipoPrazo === "3" && !form.dataPrazo) e.dataPrazo = "Informe a data do prazo"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function showToast(message?: string, error?: string) {
    setToast({ visible: true, message, error })
    setTimeout(() => setToast({ visible: false }), 3500)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      const valorNum = form.valor
        ? parseFloat(form.valor.replace(",", "."))
        : null

      const payload: Record<string, unknown> = {
        id: parseInt(servicoId),
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        cidade: form.cidade.trim() || null,
        estado: form.estado || null,
        tipoCobranca: parseInt(form.tipoCobranca),
        categoriaServico: form.categoriaServico.trim() || null,
        valor: valorNum,
        tipoPrazo: form.tipoPrazo !== "" ? parseInt(form.tipoPrazo) : null,
        dataPrazo: form.tipoPrazo === "3" && form.dataPrazo ? form.dataPrazo : null,
        status: parseInt(form.status),
        usuarioId: parseInt(user!.id),
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
        <div className="flex flex-col items-center text-center gap-3 border border-red-100 bg-red-50 rounded-[15px] p-6 max-w-[360px] w-full">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span className="text-sm font-semibold text-red-600">{fetchError}</span>
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-lg text-xs transition-colors hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg text-xs transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: formulário ───────────────────────────────────────────────────────

  return (
    <>
      <Toast visible={toast.visible} error={toast.error} message={toast.message} />

      <main className="flex flex-col items-center pb-28">
        <div className="w-full max-w-[480px] px-4 flex flex-col gap-5 pt-4">

          {/* Cabeçalho */}
          <div className="flex items-center gap-3 mb-2">
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
              <h2 className="text-lg font-bold text-gray-800">Editar Serviço</h2>
              <p className="text-xs text-gray-400">Atualize as informações do seu serviço</p>
            </div>
          </div>

          {/* ── Título ── */}
          <Field label="Título" required>
            <input
              id="editar-titulo"
              className={`${inp} ${errors.titulo ? "border-red-400 bg-red-50" : ""}`}
              value={form.titulo}
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
              className="w-full px-4 py-3 rounded-[10px] border border-gray-200 outline-none focus:border-[#7EBEB2] text-sm resize-none transition-colors bg-white"
              value={form.descricao}
              onChange={e => set("descricao", e.target.value)}
              placeholder="Descreva seu serviço em detalhes..."
            />
          </Field>

          {/* ── Categoria ── */}
          <Field label="Categoria do Serviço">
            <input
              id="editar-categoria"
              className={inp}
              value={form.categoriaServico}
              onChange={e => set("categoriaServico", e.target.value)}
              placeholder="Ex: Costura, Bordado, Malharia..."
            />
          </Field>

          {/* ── Tipo de Cobrança ── */}
          <Field label="Tipo de Cobrança" required>
            <div className="flex gap-3">
              {COBRANCA_TIPO.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("tipoCobranca", String(value))}
                  className={`flex-1 h-[44px] rounded-[20px] border-2 text-sm font-semibold transition-all ${
                    form.tipoCobranca === String(value)
                      ? "border-[#7EBEB2] bg-[#e8f5f2] text-[#2a594d]"
                      : "border-gray-200 bg-white text-gray-500"
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
                className={`${inp} pl-10 ${errors.valor ? "border-red-400 bg-red-50" : ""}`}
                value={form.valor}
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
            <div className="flex gap-2">
              <input
                id="editar-cidade"
                className={`${inp} flex-1`}
                value={form.cidade}
                onChange={e => set("cidade", e.target.value)}
                placeholder="Cidade"
              />
              <select
                id="editar-estado"
                className={`${inp} w-[80px]`}
                value={form.estado}
                onChange={e => set("estado", e.target.value)}
              >
                <option value="">UF</option>
                {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          {/* ── Tipo de Prazo ── */}
          <Field label="Prazo de Entrega">
            <div className="grid grid-cols-2 gap-2">
              {PRAZO_TIPO.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("tipoPrazo", String(value))}
                  className={`h-[40px] rounded-[10px] border-2 text-sm font-medium transition-all ${
                    form.tipoPrazo === String(value)
                      ? "border-[#7EBEB2] bg-[#e8f5f2] text-[#2a594d]"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {/* ── Data Prazo (condicional) ── */}
          {form.tipoPrazo === "3" && (
            <Field label="Data do Prazo" required>
              <input
                id="editar-dataPrazo"
                type="date"
                className={`${inp} ${errors.dataPrazo ? "border-red-400 bg-red-50" : ""}`}
                value={form.dataPrazo}
                onChange={e => set("dataPrazo", e.target.value)}
              />
              {errors.dataPrazo && <p className="text-xs text-red-500">{errors.dataPrazo}</p>}
            </Field>
          )}

          {/* ── Status ── */}
          <Field label="Status do Serviço">
            <div className="grid grid-cols-2 gap-2">
              {STATUS_TIPO.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("status", String(value))}
                  className={`h-[40px] rounded-[10px] border-2 text-sm font-medium transition-all ${
                    form.status === String(value)
                      ? "border-[#7EBEB2] bg-[#e8f5f2] text-[#2a594d]"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {/* ── Salvar ── */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full h-[50px] rounded-[20px] border-2 border-[#2a594d] bg-[#7EBEB2] text-[#2a594d] text-[20px] font-bold hover:bg-[#6aada0] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isPending ? "Salvando..." : "Salvar Alterações"}
          </button>

          {/* ── Cancelar ── */}
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full h-[44px] rounded-[20px] border-2 border-gray-200 bg-white text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>

        </div>
      </main>
    </>
  )
}
