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
        bg-[#f4f9f8]
        border
        border-[#cfe5e0]
        text-[#2a594d]
        rounded-[20px]
        px-3.5
        h-[36px]
        shadow-xs
      "
    >
      <span className="text-sm font-medium">{label}</span>

      <button
        type="button"
        onClick={onRemove}
        className="w-5 h-5 rounded-full hover:bg-[#e0f0ec] flex items-center justify-center transition-colors"
      >
        <Image
          src="/x.svg"
          alt="Remover filtro"
          width={11}
          height={11}
        />
      </button>
    </div>
  )
}
