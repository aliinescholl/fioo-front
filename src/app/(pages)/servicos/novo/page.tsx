"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Toast({ visible, error }: { visible: boolean; error?: string }) {
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

const inp = "w-full h-[44px] px-4 rounded-[10px] border border-gray-200 outline-none focus:border-[#7EBEB2] text-sm transition-colors bg-white"

// ─── Página ───────────────────────────────────────────────────────────────────

export default function NovoServicoPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ visible: boolean; error?: string }>({ visible: false })

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
    status: "0", // default: Ativo
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(name: string, value: string) {
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.titulo.trim()) e.titulo = "Título é obrigatório"
    if (form.tipoCobranca === "") e.tipoCobranca = "Selecione o tipo de cobrança"
    if (form.valor && isNaN(parseFloat(form.valor))) e.valor = "Valor inválido"
    if (form.tipoPrazo === "3" && !form.dataPrazo) e.dataPrazo = "Informe a data do prazo"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function showToast(error?: string) {
    setToast({ visible: true, error })
    setTimeout(() => setToast({ visible: false }), 3500)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      const payload: Record<string, unknown> = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        cidade: form.cidade.trim() || null,
        estado: form.estado || null,
        tipoCobranca: parseInt(form.tipoCobranca),
        categoriaServico: form.categoriaServico.trim() || null,
        valor: form.valor ? parseFloat(form.valor) : null,
        tipoPrazo: form.tipoPrazo !== "" ? parseInt(form.tipoPrazo) : null,
        dataPrazo: form.tipoPrazo === "3" && form.dataPrazo ? form.dataPrazo : null,
        status: parseInt(form.status),
      }

      const res = await fetch("/api/servicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        showToast(data.error ?? "Erro ao cadastrar serviço")
        return
      }

      showToast()
      setTimeout(() => router.push("/consulta"), 1500)
    })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#7EBEB2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Toast visible={toast.visible} error={toast.error} />

      <main className="flex flex-col items-center pb-28">
        <div className="w-full max-w-[480px] px-4 flex flex-col gap-5 pt-4">

          {/* Cabeçalho */}
          <div className="flex flex-col gap-1 mb-2">
            <h2 className="text-lg font-bold text-gray-800">Cadastrar Serviço</h2>
            <p className="text-xs text-gray-400">Preencha as informações do serviço que você oferece</p>
          </div>

          {/* ── Título ── */}
          <Field label="Título" required>
            <input className={`${inp} ${errors.titulo ? "border-red-400 bg-red-50" : ""}`}
              value={form.titulo} onChange={e => set("titulo", e.target.value)}
              placeholder="Ex: Costura de jeans, Fornecimento de tecido..." />
            {errors.titulo && <p className="text-xs text-red-500">{errors.titulo}</p>}
          </Field>

          {/* ── Descrição ── */}
          <Field label="Descrição">
            <textarea rows={3}
              className="w-full px-4 py-3 rounded-[10px] border border-gray-200 outline-none focus:border-[#7EBEB2] text-sm resize-none transition-colors bg-white"
              value={form.descricao} onChange={e => set("descricao", e.target.value)}
              placeholder="Descreva seu serviço em detalhes..." />
          </Field>

          {/* ── Categoria ── */}
          <Field label="Categoria do Serviço">
            <input className={inp} value={form.categoriaServico}
              onChange={e => set("categoriaServico", e.target.value)}
              placeholder="Ex: Costura, Bordado, Malharia..." />
          </Field>

          {/* ── Tipo de Cobrança ── */}
          <Field label="Tipo de Cobrança" required>
            <div className="flex gap-3">
              {COBRANCA_TIPO.map(({ value, label }) => (
                <button key={value} type="button"
                  onClick={() => set("tipoCobranca", String(value))}
                  className={`flex-1 h-[44px] rounded-[20px] border-2 text-sm font-semibold transition-all ${
                    form.tipoCobranca === String(value)
                      ? "border-[#7EBEB2] bg-[#e8f5f2] text-[#2a594d]"
                      : "border-gray-200 bg-white text-gray-500"
                  } ${errors.tipoCobranca ? "border-red-300" : ""}`}>
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
                className={`${inp} pl-10 ${errors.valor ? "border-red-400 bg-red-50" : ""}`}
                value={form.valor} onChange={e => set("valor", e.target.value)}
                placeholder="0,00" inputMode="decimal" />
            </div>
            {errors.valor && <p className="text-xs text-red-500">{errors.valor}</p>}
          </Field>

          {/* ── Localização ── */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Localização</label>
            <div className="flex gap-2">
              <input className={`${inp} flex-1`} value={form.cidade}
                onChange={e => set("cidade", e.target.value)} placeholder="Cidade" />
              <select className={`${inp} w-[80px]`} value={form.estado}
                onChange={e => set("estado", e.target.value)}>
                <option value="">UF</option>
                {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          {/* ── Tipo de Prazo ── */}
          <Field label="Prazo de Entrega">
            <div className="grid grid-cols-2 gap-2">
              {PRAZO_TIPO.map(({ value, label }) => (
                <button key={value} type="button"
                  onClick={() => set("tipoPrazo", String(value))}
                  className={`h-[40px] rounded-[10px] border-2 text-sm font-medium transition-all ${
                    form.tipoPrazo === String(value)
                      ? "border-[#7EBEB2] bg-[#e8f5f2] text-[#2a594d]"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {/* ── Data Prazo (condicional) ── */}
          {form.tipoPrazo === "3" && (
            <Field label="Data do Prazo" required>
              <input
                type="date"
                className={`${inp} ${errors.dataPrazo ? "border-red-400 bg-red-50" : ""}`}
                value={form.dataPrazo}
                onChange={e => set("dataPrazo", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              {errors.dataPrazo && <p className="text-xs text-red-500">{errors.dataPrazo}</p>}
            </Field>
          )}

          {/* ── Status ── */}
          <Field label="Status do Serviço">
            <div className="grid grid-cols-2 gap-2">
              {STATUS_TIPO.map(({ value, label }) => (
                <button key={value} type="button"
                  onClick={() => set("status", String(value))}
                  className={`h-[40px] rounded-[10px] border-2 text-sm font-medium transition-all ${
                    form.status === String(value)
                      ? "border-[#7EBEB2] bg-[#e8f5f2] text-[#2a594d]"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {/* ── Cadastrar ── */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full h-[50px] rounded-[20px] border-2 border-[#2a594d] bg-[#7EBEB2] text-[#2a594d] text-[20px] font-bold hover:bg-[#6aada0] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isPending ? "Cadastrando..." : "Cadastrar Serviço"}
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
