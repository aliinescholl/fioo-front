"use client"

import { useEffect, useState } from "react"

/** Categorias ("Serviço aplicado") já cadastradas, sem repetir variações de grafia. */
export function useCategorias() {
  const [categorias, setCategorias] = useState<string[]>([])

  useEffect(() => {
    let ativo = true
    fetch("/api/servicos/categorias")
      .then(res => (res.ok ? res.json() : []))
      .then((data: string[]) => { if (ativo) setCategorias(data) })
      .catch(() => { if (ativo) setCategorias([]) })
    return () => { ativo = false }
  }, [])

  return categorias
}
