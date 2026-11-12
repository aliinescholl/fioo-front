type Props = {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "danger" | "ghost"
  className?: string
}

export function Button({
  children,
  onClick,
  disabled,
  type = "button",
  variant = "primary",
  className = "",
}: Props) {
  const variants = {
    primary: `
      border border-[#68b0a0]
      bg-[var(--color-primary)]
      text-[var(--color-primary-dark)]
      hover:bg-[#72b5a4]
      hover:border-[#5aa090]
    `,
    danger: `
      border border-red-200
      bg-red-50
      text-red-600
      hover:bg-red-100
      hover:border-red-300
    `,
    ghost: `
      border border-[#d5e6e2]
      bg-white
      text-gray-600
      hover:bg-[#f4f9f8]
      hover:border-[#84c4b4]
    `,
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full
        h-[44px]
        rounded-[20px]
        text-[20px]
        font-bold
        transition-all
        outline-none
        focus-visible:ring-2
        focus-visible:ring-[#7EBEB2]/30
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}
