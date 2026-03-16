"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

type Props = {
  showBackButton?: boolean
}

export function TopBar({ showBackButton = false }: Props) {

  const router = useRouter()

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

      <div className="w-[40px] flex justify-end">
        <div className="w-[32px] h-[32px] rounded-full bg-[#7EBEB2] flex items-center justify-center text-white">
          A
        </div>
      </div>

    </div>
  )
}