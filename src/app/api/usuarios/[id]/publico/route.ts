import { NextRequest } from "next/server"
import { encaminhar } from "@/lib/backend"
import { sanitizarUsuarioPublico } from "@/lib/telefoneStore"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return encaminhar(request, `/api/usuarios/${encodeURIComponent(id)}/publico`, {
    erroPadrao: "Erro ao obter perfil",
    transformar: sanitizarUsuarioPublico,
  })
}
