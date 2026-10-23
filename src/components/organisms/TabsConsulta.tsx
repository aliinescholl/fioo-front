"use client"

import type { AbaEncontrar } from "@/types/usuario"

type Props = {
  ativo: AbaEncontrar
  onChange: (tab: AbaEncontrar) => void
}

export function TabsConsulta({ ativo, onChange }: Props) {
  return (
    <div className="flex px-2 mt-4" role="tablist">

      <button
        role="tab"
        aria-selected={ativo === "fornecedores"}
        onClick={() => onChange("fornecedores")}
        className={`
        w-[181px]
        h-[45px]
        rounded-t-[5px]
        ${ativo === "fornecedores"
          ? "shadow border-b-4 border-[#84c4b4]"
          : "opacity-50"}
        `}
      >
        Fornecedores
      </button>

      <button
        role="tab"
        aria-selected={ativo === "costureiros"}
        onClick={() => onChange("costureiros")}
        className={`
        w-[181px]
        h-[45px]
        rounded-t-[5px]
        ${ativo === "costureiros"
          ? "shadow border-b-4 border-[#84c4b4]"
          : "opacity-50"}
        `}
      >
        Costureiros
      </button>

    </div>
  )
}
