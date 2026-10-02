import { NextRequest } from "next/server"
import { encaminhar } from "@/lib/backend"

export async function GET(request: NextRequest) {
  return encaminhar(request, "/api/avaliacoes/feitas", { erroPadrao: "Erro ao obter avaliações" })
}
