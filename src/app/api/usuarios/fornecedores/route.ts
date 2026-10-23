import { NextRequest } from "next/server"
import { encaminhar } from "@/lib/backend"

export async function GET(request: NextRequest) {
  return encaminhar(request, `/api/usuarios/fornecedores${request.nextUrl.search}`, { erroPadrao: "Erro ao buscar fornecedores" })
}
