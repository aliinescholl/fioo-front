import Image from "next/image"

type Props = {
  nome: string
  localizacao: string
  imagem: string
  avaliacao: number
}

export function UserCard({ nome, localizacao, imagem, avaliacao }: Props) {
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
      "
    >
      <div className="flex items-center gap-3">

        <Image
          src={imagem}
          alt={nome}
          width={60}
          height={60}
          className="rounded-[15px]"
        />

        <div className="flex flex-col">
          <span className="font-semibold text-sm">
            {nome}
          </span>

          <span className="text-xs text-gray-500">
            {localizacao}
          </span>
        </div>

      </div>

     <div className="flex flex-col items-center">

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
        {avaliacao}
      </span>

    </div>

    </div>
  )
}