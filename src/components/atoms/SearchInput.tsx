import Image from "next/image"

interface SearchInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  ariaLabel?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Pesquisar por nome",
  ariaLabel = "Pesquisar por nome",
}: SearchInputProps) {
  return (
    <div
      className="
        flex
        items-center
        border
        border-[#84c4b4]
        rounded-[12px]
        h-[44px]
        w-full
        max-w-[480px]
        overflow-hidden
        bg-white
        transition-all
        focus-within:border-[#68b0a0]
        focus-within:ring-2
        focus-within:ring-[#7EBEB2]/20
      "
    >
      <input
        type="search"
        aria-label={ariaLabel}
        placeholder={placeholder}
        className="flex-1 h-full px-3.5 outline-none text-sm text-gray-700 placeholder:text-gray-400 bg-transparent"
        value={value ?? ""}
        onChange={e => onChange?.(e.target.value)}
      />

      <div
        className="
          w-[44px]
          h-full
          flex
          items-center
          justify-center
          bg-[#84c4b4]
        "
      >
        <Image src="/search.svg" alt="" width={16} height={16} />
      </div>
    </div>
  )
}
