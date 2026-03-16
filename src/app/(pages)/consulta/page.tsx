"use client"

import { useState } from "react"
import { TabsConsulta } from "@/components/organisms/TabsConsulta"
import { FilterBar } from "@/components/organisms/FilterBar"
import { SearchInput } from "@/components/atoms/SearchInput"
import { UserCard } from "@/components/organisms/UserCard"
import { FilterTag } from "@/components/molecules/FilterTag"
import { fornecedores, costureiros } from "@/data/fakeUsers"

export default function ConsultaPage() {

  const [tab, setTab] = useState("fornecedores")

  const lista =
    tab === "fornecedores"
      ? fornecedores
      : costureiros

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

          {lista.map((user) => (
            <UserCard
              key={user.id}
              nome={user.nome}
              localizacao={user.localizacao}
              imagem={user.imagem}
              avaliacao={user.avaliacao}
            />
          ))}

        </div>

      </div>

    </main>
  )
}