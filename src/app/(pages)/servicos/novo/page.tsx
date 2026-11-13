"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { CategoryCombobox, Select } from "@/components/atoms/Select"
import { ESTADOS_BR } from "@/data/estados"
import { useCategorias } from "@/lib/useCategorias"
import {
  formatDataBr,
  formatMoeda,
  normalizarDataParaIso,
  parseMoedaParaNumero,
  validateDataBr,
} from "@/lib/validation"
import {
  COBRANCA_OPCOES,
  PRAZO_OPCOES,
  PRAZO_TIPO,
  type CobrancaTipo,
  type PrazoTipo,
  type ServicoPayload,
} from "@/types/servico"

const DATA_ESPECIFICA = String(PRAZO_TIPO.DataEspecifica)

const UF_OPCOES = [
  { value: "", label: "UF" },
  ...ESTADOS_BR.map(uf => ({ value: uf, label: uf })),
]

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Toast({ visible, error }: { visible: boolean; error?: string }) {
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
      <span className="text-sm font-semibold">{error ?? "Serviço cadastrado!"}</span>
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
  "w-full h-[44px] px-4 rounded-[12px] border border-[#d5e6e2] hover:border-[#84c4b4] outline-none focus:border-[#7EBEB2] focus:ring-2 focus:ring-[#7EBEB2]/20 text-sm text-gray-700 placeholder:text-gray-400 transition-all bg-white"

// ─── Página ───────────────────────────────────────────────────────────────────

export default function NovoServicoPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [redirecionando, setRedirecionando] = useState(false)
  const [toast, setToast] = useState<{ visible: boolean; error?: string }>({ visible: false })
  const datePickerRef = useRef<HTMLInputElement>(null)

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
  const bloqueado = isPending || redirecionando

  function set(name: string, value: string) {
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }))
  }

  // A data só existe para "Data Específica"; ao trocar de tipo, descarta a data digitada
  function escolherPrazo(tipo: PrazoTipo) {
    set("tipoPrazo", String(tipo))
    if (String(tipo) !== DATA_ESPECIFICA) set("dataPrazo", "")
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.titulo.trim()) e.titulo = "Título é obrigatório"
    if (form.tipoCobranca === "") e.tipoCobranca = "Selecione o tipo de cobrança"
    if (form.valor && parseMoedaParaNumero(form.valor) === null) e.valor = "Valor inválido"
    if (form.tipoPrazo === "") e.tipoPrazo = "Escolha o prazo de entrega"
    if (form.tipoPrazo === DATA_ESPECIFICA) {
      const erroData = validateDataBr(form.dataPrazo, { permitirPassado: false })
      if (erroData) e.dataPrazo = erroData
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function showToast(error?: string) {
    setToast({ visible: true, error })
    setTimeout(() => setToast({ visible: false }), 3500)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (bloqueado) return
    if (!validate()) return

    startTransition(async () => {
      const payload: ServicoPayload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        cidade: form.cidade.trim() || null,
        estado: form.estado || null,
        tipoCobranca: Number(form.tipoCobranca) as CobrancaTipo,
        categoriaServico: form.categoriaServico.trim() || null,
        valor: parseMoedaParaNumero(form.valor),
        tipoPrazo: Number(form.tipoPrazo) as PrazoTipo,
        dataPrazo: form.tipoPrazo === DATA_ESPECIFICA ? normalizarDataParaIso(form.dataPrazo) : null,
      }

      try {
        const res = await fetch("/api/servicos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          showToast(data.error ?? "Erro ao cadastrar serviço")
          return
        }

        setRedirecionando(true)
        showToast()
        const destinoServicos = user?.role === "Costureiro" ? "/servicos" : "/servicos/meus"
        setTimeout(() => router.push(destinoServicos), 800)
      } catch {
        showToast("Erro de conexão ao cadastrar serviço")
      }
    })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#7EBEB2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hojeIso = new Date().toLocaleDateString("sv-SE")

  return (
    <>
      <Toast visible={toast.visible} error={toast.error} />

      <main className="flex flex-col items-center pb-28">
        <form onSubmit={handleSubmit} noValidate className="w-full max-w-[480px] px-4 flex flex-col gap-5 pt-4">

          {/* Cabeçalho */}
          <div className="flex flex-col gap-1 mb-1">
            <h2 className="text-lg font-bold text-gray-800">Cadastrar Serviço</h2>
            <p className="text-xs text-gray-400">Preencha as informações do serviço que você oferece</p>
          </div>

          {/* ── Título ── */}
          <Field label="Título" required>
            <input
              className={`${inp} ${errors.titulo ? "border-red-300 bg-red-50" : ""}`}
              value={form.titulo}
              maxLength={200}
              disabled={bloqueado}
              onChange={e => set("titulo", e.target.value)}
              placeholder="Ex: Costura de jeans, Fornecimento de tecido..."
            />
            {errors.titulo && <p className="text-xs text-red-500">{errors.titulo}</p>}
          </Field>

          {/* ── Descrição ── */}
          <Field label="Descrição">
            <textarea
              rows={3}
              disabled={bloqueado}
              className="w-full px-4 py-3 rounded-[12px] border border-[#d5e6e2] hover:border-[#84c4b4] outline-none focus:border-[#7EBEB2] focus:ring-2 focus:ring-[#7EBEB2]/20 text-sm text-gray-700 placeholder:text-gray-400 resize-none transition-all bg-white"
              value={form.descricao}
              onChange={e => set("descricao", e.target.value)}
              placeholder="Descreva seu serviço em detalhes..."
            />
          </Field>

          {/* ── Categoria ── */}
          <Field label="Categoria do Serviço">
            <CategoryCombobox
              value={form.categoriaServico}
              onChange={v => set("categoriaServico", v)}
              categories={categorias}
              disabled={bloqueado}
              maxLength={100}
              placeholder="Ex: Costura, Bordado, Malharia..."
            />
            <p className="text-xs text-gray-400">Escolha uma categoria da lista ou digite uma nova.</p>
          </Field>

          {/* ── Tipo de Cobrança ── */}
          <Field label="Tipo de Cobrança" required>
            <div className="flex gap-3">
              {COBRANCA_OPCOES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={bloqueado}
                  onClick={() => set("tipoCobranca", String(value))}
                  className={`flex-1 h-[44px] rounded-[20px] border text-sm font-semibold transition-all ${
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
                className={`${inp} pl-10 ${errors.valor ? "border-red-300 bg-red-50" : ""}`}
                value={form.valor}
                disabled={bloqueado}
                onChange={e => set("valor", formatMoeda(e.target.value))}
                placeholder="0,00"
                inputMode="numeric"
                maxLength={14}
              />
            </div>
            {errors.valor && <p className="text-xs text-red-500">{errors.valor}</p>}
          </Field>

          {/* ── Localização ── */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Localização</label>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 min-w-0 h-[44px] px-4 rounded-[12px] border border-[#d5e6e2] hover:border-[#84c4b4] outline-none focus:border-[#7EBEB2] focus:ring-2 focus:ring-[#7EBEB2]/20 text-sm text-gray-700 placeholder:text-gray-400 transition-all bg-white"
                value={form.cidade}
                maxLength={100}
                disabled={bloqueado}
                onChange={e => set("cidade", e.target.value)}
                placeholder="Cidade"
              />
              <Select
                ariaLabel="Estado (UF)"
                className="w-[96px] shrink-0"
                value={form.estado}
                onChange={v => set("estado", v)}
                options={UF_OPCOES}
                placeholder="UF"
                disabled={bloqueado}
              />
            </div>
          </div>

          {/* ── Tipo de Prazo ── */}
          <Field label="Prazo de Entrega" required>
            <div className="grid grid-cols-2 gap-2">
              {PRAZO_OPCOES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={bloqueado}
                  onClick={() => escolherPrazo(value)}
                  className={`h-[40px] rounded-[12px] border text-sm font-medium transition-all ${
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
            <Field label="Data do Prazo" required>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  disabled={bloqueado}
                  placeholder="DD/MM/AAAA"
                  className={`${inp} pr-11 ${errors.dataPrazo ? "border-red-300 bg-red-50" : ""}`}
                  value={form.dataPrazo}
                  onChange={e => set("dataPrazo", formatDataBr(e.target.value))}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={bloqueado}
                  onClick={() => datePickerRef.current?.showPicker?.()}
                  aria-label="Selecionar data no calendário"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#2a594d] transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </button>
                <input
                  ref={datePickerRef}
                  type="date"
                  tabIndex={-1}
                  aria-hidden="true"
                  min={hojeIso}
                  value={normalizarDataParaIso(form.dataPrazo)}
                  onChange={e => set("dataPrazo", formatDataBr(e.target.value))}
                  className="sr-only pointer-events-none"
                />
              </div>
              {errors.dataPrazo && <p className="text-xs text-red-500">{errors.dataPrazo}</p>}
            </Field>
          )}

          {/* ── Cadastrar ── */}
          <button
            type="submit"
            disabled={bloqueado}
            className="w-full h-[50px] rounded-[20px] border border-[#68b0a0] bg-[#7EBEB2] text-[#2a594d] text-[20px] font-bold hover:bg-[#6aada0] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {bloqueado ? "Cadastrando..." : "Cadastrar Serviço"}
          </button>

          {/* ── Cancelar ── */}
          <button
            type="button"
            disabled={bloqueado}
            onClick={() => router.back()}
            className="w-full h-[44px] rounded-[20px] border border-[#d5e6e2] bg-white text-gray-600 text-sm font-semibold hover:bg-[#f4f9f8] transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>

        </form>
      </main>
    </>
  )
}
