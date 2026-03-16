"use client"

import { useState } from "react"
import { InputLabel } from "@/components/molecules/InputLabel"
import { Button } from "@/components/atoms/Button"
import { Logo } from "@/components/atoms/Logo"

export default function CadastroPage() {

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    repetirSenha: ""
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (form.senha !== form.repetirSenha) {
      alert("As senhas não coincidem")
      return
    }

    console.log("dados cadastro", form)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">

      <Logo />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[271px] flex flex-col gap-4"
      >

        <InputLabel
          label="Nome"
          name="nome"
          type="text"
          onChange={handleChange}
        />

        <InputLabel
          label="Email"
          name="email"
          type="email"
          onChange={handleChange}
        />

        <InputLabel
          label="Senha"
          name="senha"
          type="password"
          onChange={handleChange}
        />

        <InputLabel
          label="Repetir senha"
          name="repetirSenha"
          type="password"
          onChange={handleChange}
        />

        <Button>
          Continuar
        </Button>

      </form>

    </main>
  )
}