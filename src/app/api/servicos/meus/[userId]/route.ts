import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/cookie"

const API_BASE_URL = process.env.API_BASE_URL

async function extractError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data === "string") return data
    return data.message ?? data.title ?? data.detail ?? fallback
  } catch {
    return fallback
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { userId } = await params

    const response = await fetch(`${API_BASE_URL}/api/servicos/meus/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await extractError(response, "Erro ao obter seus serviços")
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
