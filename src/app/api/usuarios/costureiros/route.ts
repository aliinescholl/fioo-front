import { NextResponse } from "next/server"

const API_BASE_URL = process.env.API_BASE_URL

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/usuarios/costureiros`, {
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao buscar costureiros" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
