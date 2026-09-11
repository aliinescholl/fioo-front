import Image from "next/image";

interface SearchInputProps {
  value?: string
  onChange?: (value: string) => void
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div
      className="
      flex
      items-center
      border-[1.5px]
      border-[#7EBEB2]
      rounded-[10px]
      h-[39px]
      w-[309px]
      overflow-hidden
      "
    >
      <input
        placeholder="Pesquisar por nome"
        className="flex-1 h-full px-3 outline-none"
        value={value ?? ""}
        onChange={e => onChange?.(e.target.value)}
      />

      <div
        className="
        w-[40px]
        h-full
        flex
        items-center
        justify-center
        bg-[#84c4b4]
        "
      >
        <Image src="/search.svg" alt="Search" width={16} height={16} />
      </div>
    </div>
  )
}