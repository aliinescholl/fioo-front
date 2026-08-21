"use client"

import { useState, useTransition, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { InputLabel } from "@/components/molecules/InputLabel"
import { Button } from "@/components/atoms/Button"
import { Logo } from "@/components/atoms/Logo"
import { useAuth } from "@/context/AuthContext"
import { validateCNPJ, formatCpfCnpj } from "@/lib/validation"

// ─── Validação de senha forte (alinhada com o backend) ───────────────────────
function validatePassword(senha: string): string | null {
  if (senha.length < 8) return "Mínimo 8 caracteres"
  if (!/[A-Z]/.test(senha)) return "Deve conter ao menos uma letra maiúscula"
  if (!/[a-z]/.test(senha)) return "Deve conter ao menos uma letra minúscula"
  if (!/[^a-zA-Z0-9]/.test(senha)) return "Deve conter ao menos um caractere especial"
  return null
}

function PasswordStrength({ senha }: { senha: string }) {
  if (!senha) return null
  const checks = [
    { ok: senha.length >= 8, label: "8+ caracteres" },
    { ok: /[A-Z]/.test(senha), label: "Maiúscula" },
    { ok: /[a-z]/.test(senha), label: "Minúscula" },
    { ok: /[^a-zA-Z0-9]/.test(senha), label: "Caractere especial" },
  ]
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {checks.map(({ ok, label }) => (
        <span
          key={label}
          className={`text-[11px] px-2 py-0.5 rounded-full border ${ok ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-400"}`}
        >
          {ok ? "✓" : "·"} {label}
        </span>
      ))}
    </div>
  )
}

// ─── Toggle Costureiro / Fornecedor ──────────────────────────────────────────
type TipoConta = "costureiro" | "fornecedor"

function TipoContaToggle({
  value,
  onChange,
  disabled,
}: {
  value: TipoConta
  onChange: (v: TipoConta) => void
  disabled: boolean
}) {
  return (
    <div
      role="group"
      aria-label="Tipo de conta"
      className="flex w-full rounded-[20px] border-2 border-[var(--color-primary-dark)] overflow-hidden"
    >
      {(["costureiro", "fornecedor"] as TipoConta[]).map((tipo) => {
        const active = value === tipo
        return (
          <button
            key={tipo}
            type="button"
            id={`tipo-${tipo}`}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(tipo)}
            className={`
              flex-1 h-[44px] text-[15px] font-bold transition-colors capitalize
              disabled:opacity-50 disabled:cursor-not-allowed
              ${active
                ? "bg-[var(--color-primary)] text-[var(--color-primary-dark)]"
                : "bg-white text-gray-400 hover:text-gray-600"}
            `}
          >
            {tipo === "costureiro" ? "✂️ Costureiro" : "🏭 Fornecedor"}
          </button>
        )
      })}
    </div>
  )
}

// ─── Formulário ───────────────────────────────────────────────────────────────
function CadastroForm() {
  const searchParams = useSearchParams()
  const emailFromQuery = searchParams.get("email") ?? ""
  const { register } = useAuth()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [tipoConta, setTipoConta] = useState<TipoConta>("costureiro")

  const ehCostureiro = tipoConta === "costureiro"

  const [form, setForm] = useState({
    nome: "",
    email: emailFromQuery,
    cnpj: "",
    senha: "",
    confirmarSenha: "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    // Aplica máscara de CNPJ em tempo real
    if (name === "cnpj") {
      setForm(prev => ({ ...prev, cnpj: formatCpfCnpj(value) }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
    if (error) setError("")
  }

  function handleTipoChange(novo: TipoConta) {
    setTipoConta(novo)
    setError("")
  }

  // ── Derivações de estado ────────────────────────────────────────────────────
  const senhaError = validatePassword(form.senha)
  const senhaOk = form.senha.length > 0 && !senhaError
  const confirmacaoPreenchida = form.confirmarSenha.length > 0
  const senhasIguais = senhaOk && form.senha === form.confirmarSenha
  const senhasDiferentes = confirmacaoPreenchida && form.senha !== form.confirmarSenha

  const cnpjDigitos = form.cnpj.replace(/\D/g, "")
  const cnpjValido = ehCostureiro ? true : (cnpjDigitos.length === 14 && validateCNPJ(form.cnpj))
  const cnpjErroLocal = !ehCostureiro && cnpjDigitos.length === 14 && !cnpjValido
    ? "CNPJ inválido"
    : null

  const campoObrigatorioOk = ehCostureiro
    ? form.nome.trim().length > 0
    : cnpjDigitos.length === 14 && cnpjValido

  const podeSubmeter = !isPending && senhasIguais && !senhaError && campoObrigatorioOk

  // ── Submit ──────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!form.email.trim() || !form.senha || !form.confirmarSenha) {
      setError("Preencha todos os campos")
      return
    }

    if (ehCostureiro && !form.nome.trim()) {
      setError("Nome é obrigatório")
      return
    }

    if (!ehCostureiro) {
      if (!form.cnpj) { setError("CNPJ é obrigatório"); return }
      if (!cnpjValido) { setError("CNPJ inválido. Informe os 14 dígitos corretamente."); return }
    }

    const pwdError = validatePassword(form.senha)
    if (pwdError) { setError(pwdError); return }

    if (!senhasIguais) { setError("As senhas não coincidem"); return }

    startTransition(async () => {
      const result = await register(
        form.nome.trim(),
        form.email.trim(),
        form.senha,
        ehCostureiro,
        ehCostureiro ? undefined : form.cnpj,
      )
      if (result.error) setError(result.error)
    })
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
      <Logo />

      <form onSubmit={handleSubmit} className="w-full max-w-[271px] flex flex-col gap-4" noValidate>

        {/* ── Toggle tipo de conta ── */}
        <TipoContaToggle value={tipoConta} onChange={handleTipoChange} disabled={isPending} />

        {/* ── Campo Nome (somente Costureiro) ── */}
        {ehCostureiro && (
          <InputLabel
            label="Nome completo"
            name="nome"
            type="text"
            value={form.nome}
            onChange={handleChange}
            autoComplete="name"
            disabled={isPending}
          />
        )}

        {/* ── Campo CNPJ (somente Fornecedor) ── */}
        {!ehCostureiro && (
          <div className="flex flex-col gap-1">
            <InputLabel
              label="CNPJ"
              name="cnpj"
              type="text"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
              onChange={handleChange}
              disabled={isPending}
              maxLength={18}
            />
            {cnpjErroLocal && (
              <p role="alert" className="text-xs text-red-500">✗ {cnpjErroLocal}</p>
            )}
            {!cnpjErroLocal && cnpjDigitos.length === 14 && (
              <p className="text-xs text-green-600">✓ CNPJ válido</p>
            )}
          </div>
        )}

        {/* ── Email — bloqueado se veio do redirect do login ── */}
        <div className="flex flex-col gap-1">
          <InputLabel
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            readOnly={!!emailFromQuery}
            disabled={isPending}
            autoComplete="email"
            style={emailFromQuery ? { backgroundColor: "#f9fafb", color: "#6b7280" } : undefined}
          />
          {emailFromQuery && (
            <p className="text-xs text-gray-400">Email informado anteriormente</p>
          )}
        </div>

        {/* ── Senha com indicador de força ── */}
        <div className="flex flex-col gap-1">
          <InputLabel
            label="Senha"
            name="senha"
            type="password"
            value={form.senha}
            onChange={handleChange}
            autoComplete="new-password"
            disabled={isPending}
          />
          <PasswordStrength senha={form.senha} />
        </div>

        {/* ── Confirmar senha ── */}
        <div className="flex flex-col gap-1">
          <InputLabel
            label="Confirmar senha"
            name="confirmarSenha"
            type="password"
            value={form.confirmarSenha}
            onChange={handleChange}
            autoComplete="new-password"
            disabled={isPending}
          />
          {senhasDiferentes && <p role="alert" className="text-xs text-red-500">✗ As senhas não coincidem</p>}
          {senhasIguais && <p className="text-xs text-green-600">✓ Senhas conferem</p>}
        </div>

        {/* ── Erro global da API ── */}
        {error && (
          <p role="alert" className="text-xs text-red-500 text-center bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" disabled={!podeSubmeter}>
          {isPending ? "Cadastrando..." : "Cadastrar"}
        </Button>

        <p className="text-xs text-center text-gray-500">
          Já possui uma conta?{" "}
          <Link href="/login" className="text-[var(--color-primary-dark)] font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </main>
  )
}

export default function CadastroPage() {
  return (
    <Suspense>
      <CadastroForm />
    </Suspense>
  )
}