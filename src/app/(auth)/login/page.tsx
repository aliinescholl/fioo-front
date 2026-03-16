"use client"

import { useState } from "react"
import { InputLabel } from "@/components/molecules/InputLabel"
import { Button } from "@/components/atoms/Button"
import { Logo } from "@/components/atoms/Logo"

export default function LoginPage() {

  const [step, setStep] = useState<"email" | "password">("email")

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">

    <Logo />

      <div className="w-full max-w-[271px] flex flex-col gap-4">

        <InputLabel
          label="Email"
          name="email"
          type="email"
        />

        {step === "password" && (
          <>
            <InputLabel
              label="Senha"
              name="senha"
              type="password"
            />

            <a className="text-xs text-right text-[var(--color-primary-dark)]">
              Esqueceu a senha?
            </a>
          </>
        )}

        <Button
          onClick={() => setStep("password")}
        >
          Continuar
        </Button>

      </div>

    </main>
  )
}