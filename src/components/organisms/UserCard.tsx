import Image from "next/image"
import { Avatar } from "@/components/atoms/Avatar"
import { getMediaUrl } from "@/lib/media"

type Props = {
  nome: string
  localizacao: string
  imagem?: string | null
  avaliacao: number
}

export function UserCard({ nome, localizacao, imagem, avaliacao }: Props) {
  const mediaUrl = getMediaUrl(imagem)
  const displayRating = typeof avaliacao === "number" && avaliacao > 0
    ? avaliacao.toFixed(1)
    : avaliacao || "0"

  return (
    <div
      className="
      flex
      items-center
      justify-between
      w-[317px]
      h-[79px]
      border
      rounded-[15px]
      px-3
      bg-white
      "
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar
          src={mediaUrl}
          nome={nome}
          tamanho="md"
          shape="rounded"
        />

        <div className="flex flex-col truncate">
          <span className="font-semibold text-sm truncate">
            {nome}
          </span>

          <span className="text-xs text-gray-500 truncate">
            {localizacao}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center shrink-0 ml-2">
        <Image
          src="/star.svg"
          alt="Avaliação"
          width={20}
          height={20}
        />

        <span
          className="
          font-[Abhaya_Libre]
          font-normal
          text-[16px]
          leading-[100%]
          "
        >
          {displayRating}
        </span>
      </div>
    </div>
  )
}