"use client"

import { useState, useTransition, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/atoms/Logo"
import { InputLabel } from "@/components/molecules/InputLabel"
import { Button } from "@/components/atoms/Button"
import { useAuth } from "@/context/AuthContext"

function EsqueceuSenhaForm() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get("email") ?? ""

  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [sentEmail, setSentEmail] = useState("")

  const { checkEmail } = useAuth()

  function validateEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setError("Informe seu email")
      return
    }

    if (!validateEmail(cleanEmail)) {
      setError("Informe um formato de email válido")
      return
    }

    startTransition(async () => {
      try {
        const result = await checkEmail(cleanEmail)
        if (result.error) {
          setError(result.error)
          return
        }

        if (!result.exists) {
          setError("Nenhum cadastro encontrado com este e-mail.")
          return
        }

        setSentEmail(cleanEmail)
        setIsSubmitted(true)
      } catch {
        setError("Erro ao verificar email. Tente novamente.")
      }
    })
  }

  if (isSubmitted) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
        <Logo />

        <div className="w-full max-w-[290px] flex flex-col items-center text-center gap-4 bg-white p-6 rounded-[20px] border border-gray-200 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center text-xl font-bold">
            ✓
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-bold text-gray-900">
              E-mail enviado!
            </h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              Enviamos as instruções de recuperação para:
            </p>
            <p className="text-xs font-semibold text-[var(--color-primary-dark)] break-all mt-0.5">
              {sentEmail}
            </p>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Verifique sua caixa de entrada e a pasta de spam para redefinir sua senha.
          </p>

          <Link href="/login" className="w-full">
            <Button type="button">
              Entrar
            </Button>
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false)
              setError("")
            }}
            className="text-xs text-[var(--color-primary-dark)] hover:underline mt-1"
          >
            Não recebeu? Tentar outro e-mail
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <Logo />

      <div className="w-full max-w-[271px] flex flex-col gap-4">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-bold text-gray-800">
            Recuperar senha
          </h1>
          <p className="text-xs text-gray-500">
            Informe seu e-mail e enviaremos as instruções para você redefinir sua senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <InputLabel
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError("")
              }}
              disabled={isPending}
              autoComplete="email"
              autoFocus
              placeholder="seu@email.com"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs text-red-500 text-center bg-red-50 border border-red-200 rounded-[8px] px-3 py-2"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Aguarde..." : "Continuar"}
          </Button>
        </form>

        <div className="flex flex-col items-center gap-2 pt-1">
          <Link
            href="/login"
            className="text-xs text-[var(--color-primary-dark)] hover:underline font-semibold"
          >
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function EsqueceuSenhaPage() {
  return (
    <Suspense>
      <EsqueceuSenhaForm />
    </Suspense>
  )
}
