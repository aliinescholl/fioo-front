import Image from "next/image"
import Link from "next/link"
import { NotaResumo } from "@/components/molecules/Estrelas"

type Props = {
  id: number
  nome: string
  localizacao: string | null
  imagem: string
  media: number | null
  totalAvaliacoes: number
}

export function UserCard({ id, nome, localizacao, imagem, media, totalAvaliacoes }: Props) {
  return (
    <Link
      href={`/usuarios/${id}`}
      className="
      flex
      items-center
      justify-between
      gap-2
      w-full
      min-h-[79px]
      border
      rounded-[15px]
      px-3
      py-2
      hover:border-[#84c4b4]
      "
    >
      <div className="flex items-center gap-3 min-w-0">

        <Image
          src={imagem}
          alt=""
          width={60}
          height={60}
          className="rounded-[15px] shrink-0"
        />

        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm truncate">
            {nome}
          </span>

          <span className="text-xs text-gray-500">
            {localizacao || "Local não informado"}
          </span>
        </div>

      </div>

      <div className="shrink-0">
        <NotaResumo media={media} total={totalAvaliacoes} compacto />
      </div>

    </Link>
  )
}
