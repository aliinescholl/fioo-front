"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react"
import { useRouter } from "next/navigation"

export type UserRole = "Costureiro" | "Fornecedor" | (string & {})

export type User = {
  id: string
  nome: string
  email: string
  nomeUsuario: string
  inicial: string
  role: UserRole | null   // UsuarioTipo: "Costureiro" | "Fornecedor"
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  checkEmail: (email: string) => Promise<{ exists: boolean; error?: string }>
  login: (email: string, senha: string) => Promise<{ error?: string }>
  register: (
    nome: string,
    email: string,
    senha: string,
    ehCostureiro?: boolean,
    cnpj?: string
  ) => Promise<{ error?: string }>
  logout: () => Promise<void>
  hasRole: (role: UserRole) => boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  /** Busca dados do usuário a partir do cookie (server-side decode) */
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" })
      if (res.ok) {
        const { user } = await res.json()
        setUser(user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  /** Verifica se o email existe no sistema */
  async function checkEmail(
    email: string
  ): Promise<{ exists: boolean; error?: string }> {
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) return { exists: false, error: "Erro ao verificar email" }
      return res.json()
    } catch {
      return { exists: false, error: "Erro de conexão" }
    }
  }

  /** Realiza login e armazena token via cookie HttpOnly (server-side) */
  async function login(
    email: string,
    senha: string
  ): Promise<{ error?: string }> {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      })
      if (!res.ok) {
        const data = await res.json()
        return { error: data.error ?? "Credenciais inválidas" }
      }
      await fetchUser()
      router.push("/consulta")
      return {}
    } catch {
      return { error: "Erro de conexão" }
    }
  }

  /** Realiza cadastro com login automático pós-registro */
  async function register(
    nome: string,
    email: string,
    senha: string,
    ehCostureiro: boolean = true,
    cnpj?: string
  ): Promise<{ error?: string }> {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha: senha, ehCostureiro, cnpj }),
      })
      if (!res.ok) {
        const data = await res.json()
        return { error: data.error ?? "Erro ao realizar cadastro" }
      }
      await fetchUser()
      router.push("/consulta")
      return {}
    } catch {
      return { error: "Erro de conexão" }
    }
  }

  /** Remove o cookie HttpOnly via servidor e redireciona para / */
  async function logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    router.push("/")
  }

  /** Verifica se o usuário possui uma determinada role */
  function hasRole(role: UserRole): boolean {
    return user?.role === role
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        checkEmail,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
