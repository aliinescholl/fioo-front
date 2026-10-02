import { NextRequest } from "next/server"
import { encaminhar } from "@/lib/backend"

export async function POST(request: NextRequest) {
  return encaminhar(request, "/api/avaliacoes", { method: "POST", erroPadrao: "Erro ao enviar avaliação" })
}
