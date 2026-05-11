import { redirect } from "next/navigation"

/**
 * Rota raiz: o Middleware redireciona para /consulta se autenticado.
 * Caso contrário, redireciona para /login.
 */
export default function Home() {
  redirect("/login")
}
