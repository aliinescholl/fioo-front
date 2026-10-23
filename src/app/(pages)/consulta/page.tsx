"use client"

import { useState, useEffect } from "react"
import { TabsConsulta } from "@/components/organisms/TabsConsulta"
import { FilterBar } from "@/components/organisms/FilterBar"
import { SearchInput } from "@/components/atoms/SearchInput"
import { UserCard } from "@/components/organisms/UserCard"
import { FilterTag } from "@/components/molecules/FilterTag"

type Usuario = {
  foto?: string | null
  fotoPerfilUrl?: string | null
  nome: string
  localizacao: string
  mediaEstrela?: string | number
  media?: string | number
}

export default function ConsultaPage() {
  const [tab, setTab] = useState("fornecedores")
  const [lista, setLista] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [search, setSearch] = useState("")

  function handleTabChange(novaTab: string) {
    setTab(novaTab)
    setCarregando(true)
    setLista([])
    setSearch("")
  }

  useEffect(() => {
    let active = true
    const rota = tab === "fornecedores" ? "/api/usuarios/fornecedores" : "/api/usuarios/costureiros"

    fetch(rota)
      .then((res) => res.json())
      .then((data: Usuario[]) => {
        if (!active) return
        setLista(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!active) return
        setLista([])
      })
      .finally(() => {
        if (!active) return
        setCarregando(false)
      })

    return () => {
      active = false
    }
  }, [tab])

  const listaFiltrada = lista.filter(u =>
    u.nome?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="flex flex-col items-center pt-4">

      <div className="w-full max-w-[700px] flex flex-col gap-4 px-4">

        <FilterBar />

        <TabsConsulta onChange={handleTabChange} />

        <div className="flex justify-center mt-2">
          <SearchInput value={search} onChange={setSearch} />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-2">
          <FilterTag label="Blumenau" />
        </div>

        <div className="flex flex-col items-center gap-4 pb-20">

          {carregando && (
            <span className="text-sm text-gray-400 mt-4">Carregando...</span>
          )}

          {!carregando && listaFiltrada.length === 0 && (
            <span className="text-sm text-gray-400 mt-4">Nenhum resultado encontrado.</span>
          )}

          {!carregando && listaFiltrada.map((user, index) => (
            <UserCard
              key={index}
              nome={user.nome}
              localizacao={user.localizacao}
              imagem={user.foto || user.fotoPerfilUrl || null}
              avaliacao={parseFloat(String(user.mediaEstrela || user.media || 0)) || 0}
            />
          ))}

        </div>

      </div>

    </main>
  )
}