"use client"

import { useState, useTransition, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { InputLabel } from "@/components/molecules/InputLabel"
import { Button } from "@/components/atoms/Button"
import { Logo } from "@/components/atoms/Logo"
import { useAuth } from "@/context/AuthContext"

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

// ─── Formulário ───────────────────────────────────────────────────────────────
function CadastroForm() {
  const searchParams = useSearchParams()
  const emailFromQuery = searchParams.get("email") ?? ""
  const { register } = useAuth()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    nome: "",
    email: emailFromQuery,
    senha: "",
    confirmarSenha: "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError("")
  }

  const senhaError = validatePassword(form.senha)
  const senhaOk = form.senha.length > 0 && !senhaError
  const confirmacaoPreenchida = form.confirmarSenha.length > 0
  const senhasIguais = senhaOk && form.senha === form.confirmarSenha
  const senhasDiferentes = confirmacaoPreenchida && form.senha !== form.confirmarSenha
  const podeSubmeter = !isPending && senhasIguais && !senhaError

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!form.nome.trim() || !form.email.trim() || !form.senha || !form.confirmarSenha) {
      setError("Preencha todos os campos")
      return
    }

    const pwdError = validatePassword(form.senha)
    if (pwdError) { setError(pwdError); return }

    if (!senhasIguais) { setError("As senhas não coincidem"); return }

    startTransition(async () => {
      const result = await register(form.nome.trim(), form.email.trim(), form.senha)
      if (result.error) setError(result.error)
    })
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
      <Logo />

      <form onSubmit={handleSubmit} className="w-full max-w-[271px] flex flex-col gap-4" noValidate>

        <InputLabel label="Nome" name="nome" type="text" value={form.nome}
          onChange={handleChange} autoComplete="name" disabled={isPending} />

        {/* Email — bloqueado se veio do redirect do login */}
        <div className="flex flex-col gap-1">
          <InputLabel label="Email" name="email" type="email" value={form.email}
            onChange={handleChange} readOnly={!!emailFromQuery} disabled={isPending}
            autoComplete="email"
            style={emailFromQuery ? { backgroundColor: "#f9fafb", color: "#6b7280" } : undefined} />
          {emailFromQuery && (
            <p className="text-xs text-gray-400">Email informado anteriormente</p>
          )}
        </div>

        {/* Senha com indicador de força */}
        <div className="flex flex-col gap-1">
          <InputLabel label="Senha" name="senha" type="password" value={form.senha}
            onChange={handleChange} autoComplete="new-password" disabled={isPending} />
          <PasswordStrength senha={form.senha} />
        </div>

        {/* Confirmar senha */}
        <div className="flex flex-col gap-1">
          <InputLabel label="Confirmar senha" name="confirmarSenha" type="password"
            value={form.confirmarSenha} onChange={handleChange}
            autoComplete="new-password" disabled={isPending} />
          {senhasDiferentes && <p role="alert" className="text-xs text-red-500">✗ As senhas não coincidem</p>}
          {senhasIguais && <p className="text-xs text-green-600">✓ Senhas conferem</p>}
        </div>

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