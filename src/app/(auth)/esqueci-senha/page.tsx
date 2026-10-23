"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { InputLabel } from "@/components/molecules/InputLabel"
import { Button } from "@/components/atoms/Button"
import { Logo } from "@/components/atoms/Logo"

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Informe seu e-mail")
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/esqueci-senha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Ocorreu um erro ao solicitar a recuperação.")
          return
        }

        setEnviado(true)
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
          <h1 className="text-xl font-bold text-gray-800">Recuperar senha</h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            Digite seu e-mail cadastrado e enviaremos um link para criar uma nova senha.
          </p>
        </div>

        {enviado ? (
          <div className="flex flex-col gap-4 bg-green-50 border border-green-200 rounded-[12px] p-4 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-green-100 text-green-700 flex items-center justify-center text-lg">
              ✓
            </div>
            <p className="text-xs text-green-800 leading-relaxed font-medium">
              Se o e-mail estiver cadastrado, você receberá um link de recuperação em alguns instantes. Verifique também sua caixa de spam.
            </p>
            <Link
              href="/login"
              className="text-xs text-[var(--color-primary-dark)] font-semibold hover:underline mt-2"
            >
              Voltar para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputLabel
              label="E-mail"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError("")
              }}
              placeholder="seu@email.com"
              disabled={isPending}
              autoComplete="email"
              autoFocus
            />

            {error && (
              <p
                role="alert"
                className="text-xs text-red-500 text-center bg-red-50 border border-red-200 rounded-[8px] px-3 py-2"
              >
                {error}
              </p>
            )}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Enviando..." : "Enviar link"}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-1">
              Lembrou sua senha?{" "}
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
