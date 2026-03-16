import Image from "next/image"

type Props = {
  size?: number
}

export function Logo({ size = 32 }: Props) {
  return (
    <h1 className="flex items-center gap-2 text-[32px] font-bold text-[#7EBEB2] font-[var(--font-newsreader)]">
      Fioo

      <Image
        src="/fioo.svg"
        alt="Fioo"
        width={size}
        height={size}
      />
      
    </h1>
  )
}