type Props = {
  children: React.ReactNode
  htmlFor: string
}

export function Label({ children, htmlFor }: Props) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm text-[var(--color-primary-dark)] mb-1"
    >
      {children}
    </label>
  )
}