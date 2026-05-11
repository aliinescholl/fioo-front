"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { validateCPF, validateCNPJ, formatCpfCnpj } from "@/lib/validation"

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Toast({ visible }: { visible: boolean }) {
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 bg-white border border-green-200 text-green-700 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className="text-sm font-semibold">Alterações salvas</span>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} role="switch" aria-checked={checked}
      className={`relative w-[52px] h-[28px] rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-[#7EBEB2]" : "bg-gray-200"}`}>
      <span className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-[24px]" : "translate-x-0"}`} />
    </button>
  )
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>}
      </label>
      {children}
    </div>
  )
}

const inp = "w-full h-[44px] px-4 rounded-[10px] border border-gray-200 outline-none focus:border-[#7EBEB2] text-sm transition-colors bg-white"

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const { user, logout } = useAuth()
  const [showToast, setShowToast] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saving, setSaving] = useState(false)

  // Foto de perfil
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const fotoRef = useRef<HTMLInputElement>(null)

  // Portfólio
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([])
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([])
  const portfolioRef = useRef<HTMLInputElement>(null)

  // CPF/CNPJ
  const [cpfCnpjError, setCpfCnpjError] = useState("")

  const [form, setForm] = useState({
    servico: "" as "costureiro" | "fornecedor" | "",
    nomeCompleto: "",
    nomeSocial: "",
    pronome: "",
    nomeUsuario: "",
    email: "",
    cpfCnpj: "",
    telefone: "",
    mostrarTelefone: false,
    cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
    tempoServico: "",
    maquinario: "",
  })

  useEffect(() => {
    if (user) setForm(p => ({ ...p, nomeCompleto: user.nome, email: user.email }))
  }, [user])

  function set(name: string, value: string | boolean) {
    setForm(p => ({ ...p, [name]: value }))
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handlePortfolio(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setPortfolioFiles(p => [...p, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setPortfolioPreviews(p => [...p, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  function removePortfolio(i: number) {
    setPortfolioPreviews(p => p.filter((_, j) => j !== i))
    setPortfolioFiles(p => p.filter((_, j) => j !== i))
  }

  function handleCpfCnpj(e: React.ChangeEvent<HTMLInputElement>) {
    set("cpfCnpj", formatCpfCnpj(e.target.value))
    setCpfCnpjError("")
  }

  function validateDoc(): boolean {
    const d = form.cpfCnpj.replace(/\D/g, "")
    if (!d) return true
    if (d.length === 11 && !validateCPF(d)) { setCpfCnpjError("CPF inválido"); return false }
    if (d.length === 14 && !validateCNPJ(d)) { setCpfCnpjError("CNPJ inválido"); return false }
    if (d.length !== 11 && d.length !== 14) { setCpfCnpjError("CPF (11 dígitos) ou CNPJ (14 dígitos)"); return false }
    setCpfCnpjError("")
    return true
  }

  async function handleSave() {
    if (!validateDoc()) return
    setSaveError("")
    setSaving(true)

    try {
      const fd = new FormData()

      // Mapeamento dos campos para os nomes esperados pelo backend
      fd.append("Nome", form.nomeCompleto)
      fd.append("NomeSocial", form.nomeSocial)
      fd.append("Pronome", form.pronome)
      fd.append("NomeUsuario", form.nomeUsuario)
      fd.append("Email", form.email)
      fd.append("CpfCnpj", form.cpfCnpj.replace(/\D/g, ""))
      fd.append("Telefone", form.telefone)
      fd.append("TelefoneVisivel", String(form.mostrarTelefone))

      // ServicoPrestado: costureiro=0, fornecedor=1
      fd.append("ServicoPrestado", form.servico === "costureiro" ? "0" : "1")

      // AnosExperiencia: extrai apenas dígitos
      const anos = form.tempoServico.replace(/\D/g, "")
      fd.append("AnosExperiencia", anos || "0")

      // Maquinário: IDs separados por vírgula → múltiplos campos
      if (form.maquinario.trim()) {
        form.maquinario.split(",").map(s => s.trim()).filter(Boolean).forEach(id => {
          fd.append("MaquinarioIds", id)
        })
      }

      // Endereço com dot notation
      fd.append("Endereco.Cep", form.cep)
      fd.append("Endereco.Rua", form.rua)
      fd.append("Endereco.Numero", form.numero)
      fd.append("Endereco.Complemento", form.complemento)
      fd.append("Endereco.Bairro", form.bairro)
      fd.append("Endereco.Cidade", form.cidade)
      fd.append("Endereco.Estado", form.estado)

      // Foto de perfil (arquivo)
      if (fotoFile) fd.append("FotoPerfil", fotoFile)

      // Portfólio (múltiplos arquivos)
      portfolioFiles.forEach(file => fd.append("Portfolios", file))

      const res = await fetch("/api/perfil", { method: "PUT", body: fd })

      if (!res.ok) {
        const data = await res.json()
        setSaveError(data.error ?? "Erro ao salvar")
        return
      }

      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } finally {
      setSaving(false)
    }
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
      <Toast visible={showToast} />

      <main className="flex flex-col items-center pb-28">
        <div className="w-full max-w-[480px] px-4 flex flex-col gap-5 pt-4">

          {/* ── Foto de perfil ── */}
          <div className="flex flex-col items-center gap-2 py-2">
            <button type="button" onClick={() => fotoRef.current?.click()}
              className="relative w-[100px] h-[100px] rounded-full bg-[#e8f5f2] border-2 border-[#7EBEB2] flex items-center justify-center overflow-hidden group">
              {fotoPreview
                ? <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                : <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#7EBEB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </button>
            <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
            <p className="text-xs text-gray-400">Toque para alterar a foto</p>
          </div>

          {/* ── Serviço prestado ── */}
          <Field label="Serviço prestado">
            <div className="flex gap-3">
              {(["costureiro", "fornecedor"] as const).map(tipo => (
                <button key={tipo} type="button" onClick={() => set("servico", tipo)}
                  className={`flex-1 h-[44px] rounded-[20px] border-2 text-sm font-semibold transition-all ${form.servico === tipo ? "border-[#7EBEB2] bg-[#e8f5f2] text-[#2a594d]" : "border-gray-200 bg-white text-gray-500"}`}>
                  {tipo === "costureiro" ? "Costureiro(a)" : "Fornecedor(a)"}
                </button>
              ))}
            </div>
          </Field>

          {/* ── Nome completo ── */}
          <Field label="Nome completo">
            <input className={inp} value={form.nomeCompleto} onChange={e => set("nomeCompleto", e.target.value)} placeholder="Seu nome completo" />
          </Field>

          {/* ── Nome social ── */}
          <Field label="Nome social" optional>
            <input className={inp} value={form.nomeSocial} onChange={e => set("nomeSocial", e.target.value)} placeholder="Como prefere ser chamado(a)" />
          </Field>

          {/* ── Pronome ── */}
          <Field label="Pronome" optional>
            <select className={inp} value={form.pronome} onChange={e => set("pronome", e.target.value)}>
              <option value="">Selecione</option>
              <option value="ele/dele">Ele/Dele</option>
              <option value="ela/dela">Ela/Dela</option>
              <option value="eles/deles">Eles/Deles</option>
            </select>
          </Field>

          {/* ── Nome de usuário ── */}
          <Field label="Nome de usuário">
            <input className={inp} value={form.nomeUsuario} onChange={e => set("nomeUsuario", e.target.value)} placeholder="@seunome" />
          </Field>

          {/* ── E-mail ── */}
          <Field label="E-mail">
            <input className={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="seu@email.com" />
          </Field>

          {/* ── CPF / CNPJ ── */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">CPF / CNPJ</label>
            <input className={`${inp} ${cpfCnpjError ? "border-red-400 bg-red-50 focus:border-red-400" : ""}`}
              value={form.cpfCnpj} onChange={handleCpfCnpj} onBlur={validateDoc}
              placeholder="000.000.000-00 ou 00.000.000/0000-00" maxLength={18} />
            {cpfCnpjError && <p className="text-xs text-red-500">{cpfCnpjError}</p>}
          </div>

          {/* ── Telefone ── */}
          <Field label="Número de telefone">
            <input className={inp} value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(00) 00000-0000" />
          </Field>

          {/* ── Endereço ── */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Endereço</label>
            <div className="flex gap-2">
              <input className={`${inp} w-[110px]`} value={form.cep} onChange={e => set("cep", e.target.value)} placeholder="CEP" maxLength={9} />
              <input className={`${inp} flex-1`} value={form.cidade} onChange={e => set("cidade", e.target.value)} placeholder="Cidade" />
              <input className={`${inp} w-[58px]`} value={form.estado} onChange={e => set("estado", e.target.value)} placeholder="UF" maxLength={2} />
            </div>
            <div className="flex gap-2">
              <input className={`${inp} flex-1`} value={form.rua} onChange={e => set("rua", e.target.value)} placeholder="Rua / Avenida" />
              <input className={`${inp} w-[68px]`} value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="N°" />
            </div>
            <input className={inp} value={form.bairro} onChange={e => set("bairro", e.target.value)} placeholder="Bairro" />
            <input className={inp} value={form.complemento} onChange={e => set("complemento", e.target.value)} placeholder="Complemento (opcional)" />
          </div>

          {/* ── Tempo de serviço ── */}
          <Field label="Tempo de serviço na área">
            <input className={inp} value={form.tempoServico} onChange={e => set("tempoServico", e.target.value)} placeholder="Ex: 5 anos" />
          </Field>

          {/* ── Maquinário ── */}
          <Field label="Maquinário" optional>
            <textarea rows={3}
              className="w-full px-4 py-3 rounded-[10px] border border-gray-200 outline-none focus:border-[#7EBEB2] text-sm resize-none transition-colors bg-white"
              value={form.maquinario} onChange={e => set("maquinario", e.target.value)}
              placeholder="IDs dos equipamentos separados por vírgula (ex: 1, 2, 3)" />
          </Field>

          {/* ── Portfólio ── */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Portfólio</label>
            <button type="button" onClick={() => portfolioRef.current?.click()}
              className="w-full h-[96px] border-2 border-dashed border-[#7EBEB2] rounded-[12px] flex flex-col items-center justify-center gap-2 bg-[#f7fffe] hover:bg-[#e8f5f2] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7EBEB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-sm text-[#7EBEB2] font-medium">Anexe fotos de seus trabalhos</span>
            </button>
            <input ref={portfolioRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePortfolio} />
            {portfolioPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {portfolioPreviews.map((src, i) => (
                  <div key={i} className="relative w-[72px] h-[72px] rounded-[8px] overflow-hidden border border-gray-100">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePortfolio(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[11px] leading-none flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Mostrar telefone ── */}
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-semibold text-gray-700">Mostrar número para outros usuários?</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{form.mostrarTelefone ? "Sim" : "Não"}</span>
              <Toggle checked={form.mostrarTelefone} onChange={v => set("mostrarTelefone", v)} />
            </div>
          </div>

          {/* ── Verificar perfil ── */}
          <button type="button"
            className="w-full h-[44px] rounded-[20px] border-2 border-[#7EBEB2] bg-white text-[#2a594d] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#e8f5f2] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Verificar perfil
          </button>

          {/* ── Erro de salvar ── */}
          {saveError && (
            <p role="alert" className="text-xs text-red-500 text-center bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">
              {saveError}
            </p>
          )}

          {/* ── Salvar ── */}
          <button type="button" onClick={handleSave} disabled={saving}
            className="w-full h-[50px] rounded-[20px] border-2 border-[#2a594d] bg-[#7EBEB2] text-[#2a594d] text-[20px] font-bold hover:bg-[#6aada0] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? "Salvando..." : "Salvar"}
          </button>

          {/* ── Logout ── */}
          <button onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-[12px] border-2 border-red-200 bg-red-50 text-red-500 text-sm font-semibold hover:bg-red-100 active:scale-[0.98] transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair da conta
          </button>

        </div>
      </main>
    </>
  )
}
