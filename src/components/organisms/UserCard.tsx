import Link from "next/link"
import { Avatar } from "@/components/atoms/Avatar"
import { NotaResumo } from "@/components/molecules/Estrelas"
import { getMediaUrl } from "@/lib/media"

type Props = {
  id: number
  nome: string
  localizacao?: string | null
  imagem?: string | null
  media?: number | null
  totalAvaliacoes?: number
  avaliacao?: number
}

export function UserCard({
  id,
  nome,
  localizacao,
  imagem,
  media,
  totalAvaliacoes = 0,
  avaliacao,
}: Props) {
  const mediaUrl = getMediaUrl(imagem)
  const notaFinal = media ?? (typeof avaliacao === "number" ? avaliacao : null)

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
      bg-white
      hover:border-[#84c4b4]
      transition-colors
      "
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar
          src={mediaUrl}
          nome={nome}
          tamanho="md"
          shape="rounded"
        />

        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm truncate">
            {nome}
          </span>

          <span className="text-xs text-gray-500 truncate">
            {localizacao || "Local não informado"}
          </span>
        </div>
      </div>

      <div className="shrink-0">
        <NotaResumo media={notaFinal} total={totalAvaliacoes} compacto />
      </div>
    </Link>
  )
}
