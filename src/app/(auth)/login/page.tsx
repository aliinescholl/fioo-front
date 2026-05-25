"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { InputLabel } from "@/components/molecules/InputLabel"
import { Button } from "@/components/atoms/Button"
import { Logo } from "@/components/atoms/Logo"
import { useAuth } from "@/context/AuthContext"

type Step = "email" | "senha"

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const { checkEmail, login } = useAuth()
  const router = useRouter()

  function clearError() {
    if (error) setError("")
  }

  function handleContinuar() {
    setError("")

    if (step === "email") {
      if (!email.trim()) {
        setError("Informe seu email")
        return
      }

      startTransition(async () => {
        // const result = await checkEmail(email.trim())
        // if (result.error) {
        //   setError(result.error)
        //   return
        // }

        setStep("senha")

        // router.push(`/cadastro?email=${encodeURIComponent(email.trim())}`)

      })
      return
    }

    // Step: senha
    if (!password) {
      setError("Informe sua senha")
      return
    }

    startTransition(async () => {
      const result = await login(email, password)
      if (result.error) setError(result.error)
    })
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <Logo />

      <div className="w-full max-w-[271px] flex flex-col gap-4">

        {/* Email — desabilitado após avançar para a senha */}
        <div className="flex flex-col gap-1">
          <InputLabel
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError() }}
            disabled={step === "senha" || isPending}
            onKeyDown={(e) => e.key === "Enter" && !isPending && handleContinuar()}
            autoComplete="email"
          />
          {/* Botão de trocar email quando no step de senha */}
          {step === "senha" && (
            <button
              onClick={() => { setStep("email"); setPassword(""); setError("") }}
              className="text-xs text-left text-[var(--color-primary-dark)] hover:underline"
            >
              ← Trocar email
            </button>
          )}
        </div>

        {step === "senha" && (
          <>
            <InputLabel
              label="Senha"
              name="senha"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError() }}
              onKeyDown={(e) => e.key === "Enter" && !isPending && handleContinuar()}
              autoComplete="current-password"
              autoFocus
            />
            <a className="text-xs text-right text-[var(--color-primary-dark)] cursor-pointer hover:underline">
              Esqueceu a senha?
            </a>
          </>
        )}

        {error && (
          <p
            role="alert"
            className="text-xs text-red-500 text-center bg-red-50 border border-red-200 rounded-[8px] px-3 py-2"
          >
            {error}
          </p>
        )}

        <Button onClick={handleContinuar} disabled={isPending}>
          {isPending
            ? "Aguarde..."
            : step === "email"
              ? "Continuar"
              : "Entrar"}
        </Button>

      </div>
    </main>
  )
}