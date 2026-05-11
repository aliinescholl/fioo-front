"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"

type Props = {
  showBackButton?: boolean
}

export function TopBar({ showBackButton = false }: Props) {

  const router = useRouter()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div
      className="
      flex
      items-center
      justify-between
      h-[56px]
      px-4
      bg-white
      shadow-md
      relative
      z-50
      "
    >

      <div className="w-[40px]">
        {showBackButton && (
          <button onClick={() => router.back()}>
            <Image src="/left-arrow.svg" alt="Back" width={16} height={16} />
          </button>
        )}
      </div>

      <span className="font-semibold">Fioo</span>

      {/* Avatar com dropdown */}
      <div className="w-[40px] flex justify-end" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="
            w-[32px] h-[32px]
            rounded-full
            bg-[#7EBEB2]
            flex items-center justify-center
            text-white
            font-bold
            text-sm
            focus:outline-none
            hover:bg-[#6aada0]
            transition-colors
          "
          aria-label="Menu do usuário"
          aria-expanded={menuOpen}
        >
          {user?.inicial ?? "U"}
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div
            className="
              absolute
              top-[52px]
              right-4
              bg-white
              rounded-[12px]
              shadow-lg
              border border-gray-100
              min-w-[180px]
              py-2
              overflow-hidden
              animate-[fadeIn_0.15s_ease]
            "
          >
            {user && (
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-400 leading-tight">Logado como</p>
                <p className="text-sm font-semibold text-gray-700 truncate">{user.nome}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            )}

            <button
              onClick={() => {
                setMenuOpen(false)
                router.push("/perfil")
              }}
              className="
                w-full text-left
                px-4 py-2
                text-sm text-gray-700
                hover:bg-gray-50
                flex items-center gap-2
                transition-colors
              "
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Meu perfil
            </button>

            <button
              onClick={() => {
                setMenuOpen(false)
                logout()
              }}
              className="
                w-full text-left
                px-4 py-2
                text-sm text-red-500
                hover:bg-red-50
                flex items-center gap-2
                transition-colors
                font-semibold
              "
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </button>
          </div>
        )}
      </div>

    </div>
  )
}