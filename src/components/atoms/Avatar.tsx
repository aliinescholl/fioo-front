"use client"

import { useState } from "react"
import Image from "next/image"

type AvatarSize = "sm" | "md" | "lg" | "xl"
type AvatarShape = "circle" | "rounded"

type Props = {
  src?: string | null
  nome: string
  tamanho?: AvatarSize
  shape?: AvatarShape
  className?: string
  alt?: string
}

const sizeConfig: Record<AvatarSize, { px: number; containerClass: string; textClass: string }> = {
  sm: { px: 32, containerClass: "w-8 h-8", textClass: "text-xs" },
  md: { px: 60, containerClass: "w-[60px] h-[60px]", textClass: "text-base font-bold" },
  lg: { px: 80, containerClass: "w-20 h-20", textClass: "text-xl font-bold" },
  xl: { px: 100, containerClass: "w-[100px] h-[100px]", textClass: "text-2xl font-bold" },
}

function getInitials(nome: string): string {
  if (!nome || !nome.trim()) return "U"
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({
  src,
  nome,
  tamanho = "md",
  shape = "rounded",
  className = "",
  alt,
}: Props) {
  // Rastreia qual URL de imagem falhou, evitando efeitos colaterais com useEffect
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const { px, containerClass, textClass } = sizeConfig[tamanho]
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-[15px]"
  const initials = getInitials(nome)

  const hasError = Boolean(src && failedSrc === src)
  const showImage = Boolean(src) && !hasError

  return (
    <div
      className={`
        relative flex items-center justify-center overflow-hidden shrink-0 select-none
        border border-[#b8dcd3] bg-[#e8f5f2] text-[#2a594d]
        ${containerClass}
        ${shapeClass}
        ${className}
      `}
      style={{ width: `${px}px`, height: `${px}px` }}
    >
      {showImage ? (
        <Image
          key={src}
          src={src!}
          alt={alt || nome || "Avatar"}
          width={px}
          height={px}
          unoptimized
          className={`w-full h-full object-cover ${shapeClass}`}
          onError={() => setFailedSrc(src!)}
        />
      ) : (
        <span className={`tracking-wider ${textClass}`}>
          {initials}
        </span>
      )}
    </div>
  )
}
