"use client"

import Image from "next/image"
import Link from "next/link"

export function BottomNav() {
  return (
    <nav
      className="
      fixed
      bottom-0
      left-0
      w-full
      h-[76px]
      bg-[#7EBEB2]
      flex
      items-center
      justify-around
      "
    >

      <Link
        href="/consulta"
        className="flex flex-col items-center justify-center"
      >
        <Image
          src="/community.svg"
          alt="Encontrar"
          width={24}
          height={24}
        />

        <span
          className="
          text-white
          text-[16px]
          leading-[100%]
          font-normal
          "
        >
          Encontrar
        </span>
      </Link>


      <Link
        href="/servicos"
        className="flex flex-col items-center justify-center"
      >
        <Image
          src="/machine.svg"
          alt="Serviços"
          width={24}
          height={24}
        />

        <span
          className="
          text-white
          text-[16px]
          leading-[100%]
          font-normal
          "
        >
          Serviços
        </span>
      </Link>


      <Link
        href="/perfil"
        className="flex flex-col items-center justify-center"
      >
        <Image
          src="/profile.svg"
          alt="Perfil"
          width={24}
          height={24}
        />

        <span
          className="
          text-white
          text-[16px]
          leading-[100%]
          font-normal
          "
        >
          Perfil
        </span>
      </Link>

    </nav>
  )
}