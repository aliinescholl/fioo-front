import Image from "next/image"

type Props = {
  label: string
  onRemove?: () => void
}

export function FilterTag({ label, onRemove }: Props) {
  return (
    <div
      className="
      flex
      items-center
      gap-2
      bg-[#EDEDED]
      rounded-[20px]
      px-3
      h-[38px]
      shadow-[0px_2px_4px_0px_#00000040]
      "
    >
      <span className="text-sm">
        {label}
      </span>

      <button onClick={onRemove}>
        <Image
          src="/x.svg"
          alt="Remover filtro"
          width={12}
          height={12}
        />
      </button>
    </div>
  )
}