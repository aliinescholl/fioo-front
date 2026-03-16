type Props = React.InputHTMLAttributes<HTMLInputElement>

export function Input(props: Props) {
  return (
    <input
      {...props}
      className="
        w-full
        h-[40px]
        px-[12px]
        rounded-[8px]
        border
        border-[var(--color-muted)]
        outline-none
        focus:border-[var(--color-primary)]
      "
    />
  )
}