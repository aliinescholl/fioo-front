"use client"

import { useState, useEffect } from "react"
import { TabsConsulta } from "@/components/organisms/TabsConsulta"
import { FilterBar } from "@/components/organisms/FilterBar"
import { SearchInput } from "@/components/atoms/SearchInput"
import { UserCard } from "@/components/organisms/UserCard"
import { FilterTag } from "@/components/molecules/FilterTag"

type Usuario = {
  foto: string | null
  nome: string
  localizacao: string
  mediaEstrela: string
}

export default function ConsultaPage() {
  const [tab, setTab] = useState("fornecedores")
  const [lista, setLista] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    setLista([])

    const rota = tab === "fornecedores" ? "/api/usuarios/fornecedores" : "/api/usuarios/costureiros"

    fetch(rota)
      .then((res) => res.json())
      .then((data: Usuario[]) => {
        setLista(data)
      })
      .catch(() => {
        setLista([])
      })
      .finally(() => {
        setCarregando(false)
      })
  }, [tab])

  return (
    <main className="flex flex-col items-center pt-4">

      <div className="w-full max-w-[700px] flex flex-col gap-4 px-4">

        <FilterBar />

        <TabsConsulta onChange={setTab} />

        <div className="flex justify-center mt-2">
          <SearchInput />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-2">
          <FilterTag label="Blumenau" />
        </div>

        <div className="flex flex-col items-center gap-4 pb-20">

          {carregando && (
            <span className="text-sm text-gray-400 mt-4">Carregando...</span>
          )}

          {!carregando && lista.length === 0 && (
            <span className="text-sm text-gray-400 mt-4">Nenhum resultado encontrado.</span>
          )}

          {!carregando && lista.map((user, index) => (
            <UserCard
              key={index}
              nome={user.nome}
              localizacao={user.localizacao}
              imagem={user.foto ?? "/user.png"}
              avaliacao={parseFloat(user.mediaEstrela) || 0}
            />
          ))}

        </div>

      </div>

    </main>
  )
}