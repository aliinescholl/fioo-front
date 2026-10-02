"use client"

import { useCallback, useEffect, useState } from "react"

async function buscarFeitas(): Promise<Set<number> | null> {
  try {
    const res = await fetch("/api/avaliacoes/feitas")
    return res.ok ? new Set<number>(await res.json()) : null
  } catch {
    // sem a lista, o backend ainda impede avaliação duplicada (409)
    return null
  }
}

/** Ids dos serviços que o usuário logado já avaliou (para trocar "Avaliar" por "Avaliação enviada"). */
export function useAvaliacoesFeitas() {
  const [feitas, setFeitas] = useState<Set<number>>(new Set())

  useEffect(() => {
    let ativo = true
    buscarFeitas().then(ids => { if (ativo && ids) setFeitas(ids) })
    return () => { ativo = false }
  }, [])

  const recarregar = useCallback(async () => {
    const ids = await buscarFeitas()
    if (ids) setFeitas(ids)
  }, [])

  return { feitas, recarregar }
}
