import Image from "next/image";

export function FilterBar() {
  return (
    <div className="flex gap-3 px-4 mt-2">

      <button
        className="
        flex items-center gap-2
        h-[38px]
        px-4
        rounded-[20px]
        bg-[#84c4b4]
        text-white
        border-2 border-[#84c4b4]
        "
      >
        <Image src="/filter.svg" alt="Filtro" width={24} height={24} />
        Filtro
      </button>

      <button
        className="
        flex items-center gap-2
        h-[38px]
        px-4
        rounded-[20px]
        border-2 border-[#84c4b4]
        text-black
        bg-white
        "
      >
        <Image src="/sort.svg" alt="Ordenar" width={24} height={24} />
        Ordenar
      </button>

    </div>
  )
}