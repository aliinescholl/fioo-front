import { NextRequest } from "next/server"
import { encaminhar } from "@/lib/backend"
import { sanitizarUsuarioPublico } from "@/lib/telefoneStore"

export async function GET(request: NextRequest) {
  return encaminhar(request, `/api/usuarios/fornecedores${request.nextUrl.search}`, {
    erroPadrao: "Erro ao buscar fornecedores",
    transformar: sanitizarUsuarioPublico,
  })
}
