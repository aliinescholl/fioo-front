import { NextRequest } from "next/server"
import { encaminhar } from "@/lib/backend"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return encaminhar(request, `/api/avaliacoes/usuario/${encodeURIComponent(id)}${request.nextUrl.search}`, {
    erroPadrao: "Erro ao obter avaliações",
  })
}
