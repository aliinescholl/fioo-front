type Props = {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "danger" | "ghost"
}

export function Button({
  children,
  onClick,
  disabled,
  type = "button",
  variant = "primary",
}: Props) {
  const variants = {
    primary: `
      border-2 border-[var(--color-primary-dark)]
      bg-[var(--color-primary)]
      text-[var(--color-primary-dark)]
    `,
    danger: `
      border-2 border-red-300
      bg-red-50
      text-red-600
    `,
    ghost: `
      border-2 border-gray-200
      bg-white
      text-gray-600
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
        text-[24px]
        font-bold
        transition-opacity
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${variants[variant]}
      `}
    >
      {children}
    </button>
  )
}