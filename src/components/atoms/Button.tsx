type Props = {
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ children, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="
        w-full
        h-[44px]
        rounded-[20px]
        border-2
        border-[var(--color-primary-dark)]
        bg-[var(--color-primary)]
        text-[24px]
        font-bold
        text-[var(--color-primary-dark)]
      "
    >
      {children}
    </button>
  )
}