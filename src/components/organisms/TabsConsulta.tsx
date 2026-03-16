"use client"

import { useState } from "react"

type Props = {
  onChange: (tab: string) => void
}

export function TabsConsulta({ onChange }: Props) {

  const [active, setActive] = useState("fornecedores")

  function select(tab: string) {
    setActive(tab)
    onChange(tab)
  }

  return (
    <div className="flex px-2 mt-4">

      <button
        onClick={() => select("fornecedores")}
        className={`
        w-[181px]
        h-[45px]
        rounded-t-[5px]
        ${active === "fornecedores"
          ? "shadow border-b-4 border-[#84c4b4]"
          : "opacity-50"}
        `}
      >
        Fornecedores
      </button>

      <button
        onClick={() => select("costureiros")}
        className={`
        w-[181px]
        h-[45px]
        rounded-t-[5px]
        ${active === "costureiros"
          ? "shadow border-b-4 border-[#84c4b4]"
          : "opacity-50"}
        `}
      >
        Costureiros
      </button>

    </div>
  )
}