"use client"

import { useState, useTransition, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { InputLabel } from "@/components/molecules/InputLabel"
import { Button } from "@/components/atoms/Button"
import { Logo } from "@/components/atoms/Logo"

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

function RedefinirSenhaForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [error, setError] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!token) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
        <Logo />
        <div className="w-full max-w-[290px] flex flex-col items-center text-center gap-4 bg-red-50 border border-red-200 rounded-[12px] p-5">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-lg">
            !
          </div>
          <h1 className="text-base font-bold text-red-800">Link inválido ou incompleto</h1>
          <p className="text-xs text-red-600 leading-relaxed">
            Não encontramos o token de recuperação necessário. Por favor, solicite um novo link.
          </p>
          <Link
            href="/esqueci-senha"
            className="text-xs font-semibold text-[var(--color-primary-dark)] hover:underline"
          >
            Solicitar novo link
          </Link>
        </div>
      </main>
    )
  }

  const senhaError = validatePassword(novaSenha)
  const senhaValida = novaSenha.length > 0 && !senhaError
  const confirmacaoPreenchida = confirmarSenha.length > 0
  const senhasIguais = senhaValida && novaSenha === confirmarSenha
  const senhasDiferentes = confirmacaoPreenchida && novaSenha !== confirmarSenha
  const podeSubmeter = senhaValida && senhasIguais && !isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!podeSubmeter) return

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/redefinir-senha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, novaSenha }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Token inválido ou expirado.")
          return
        }

        setSucesso(true)
      } catch {
        setError("Erro ao conectar com o servidor. Tente novamente.")
      }
    })
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <Logo />

      <div className="w-full max-w-[290px] flex flex-col gap-4">
        <div className="flex flex-col items-center text-center gap-1">
          <h1 className="text-xl font-bold text-gray-800">Redefinir senha</h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            Crie uma nova senha segura para a sua conta.
          </p>
        </div>

        {sucesso ? (
          <div className="flex flex-col gap-4 bg-green-50 border border-green-200 rounded-[12px] p-5 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-green-100 text-green-700 flex items-center justify-center text-lg">
              ✓
            </div>
            <h2 className="text-sm font-bold text-green-800">Senha redefinida com sucesso!</h2>
            <p className="text-xs text-green-700 leading-relaxed">
              Você já pode acessar sua conta utilizando a sua nova senha.
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 w-full py-2.5 rounded-[20px] bg-[var(--color-primary)] border-2 border-[var(--color-primary-dark)] text-[var(--color-primary-dark)] font-bold text-center text-sm hover:opacity-90 transition-opacity"
            >
              Ir para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <InputLabel
                label="Nova senha"
                name="novaSenha"
                type="password"
                value={novaSenha}
                onChange={(e) => {
                  setNovaSenha(e.target.value)
                  if (error) setError("")
                }}
                disabled={isPending}
                autoComplete="new-password"
                autoFocus
              />
              <PasswordStrength senha={novaSenha} />
            </div>

            <div className="flex flex-col gap-1">
              <InputLabel
                label="Confirmar nova senha"
                name="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => {
                  setConfirmarSenha(e.target.value)
                  if (error) setError("")
                }}
                disabled={isPending}
                autoComplete="new-password"
              />
              {senhasDiferentes && (
                <p role="alert" className="text-xs text-red-500">
                  ✗ As senhas não coincidem
                </p>
              )}
              {senhasIguais && (
                <p className="text-xs text-green-600">
                  ✓ Senhas conferem
                </p>
              )}
            </div>

            {error && (
              <div className="flex flex-col gap-1">
                <p
                  role="alert"
                  className="text-xs text-red-500 text-center bg-red-50 border border-red-200 rounded-[8px] px-3 py-2"
                >
                  {error}
                </p>
                <div className="text-center mt-1">
                  <Link
                    href="/esqueci-senha"
                    className="text-xs text-[var(--color-primary-dark)] font-semibold hover:underline"
                  >
                    Solicitar novo link
                  </Link>
                </div>
              </div>
            )}

            <Button type="submit" disabled={!podeSubmeter}>
              {isPending ? "Redefinindo..." : "Redefinir senha"}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-1">
              Lembrou sua senha antiga?{" "}
              <Link
                href="/login"
                className="text-[var(--color-primary-dark)] font-semibold hover:underline"
              >
                Entrar
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<main className="flex justify-center items-center min-h-screen text-xs text-gray-400">Carregando...</main>}>
      <RedefinirSenhaForm />
    </Suspense>
  )
}
