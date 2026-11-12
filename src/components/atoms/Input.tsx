type Props = React.InputHTMLAttributes<HTMLInputElement>

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      {...props}
      className={`
        w-full
        h-[44px]
        px-3.5
        rounded-[12px]
        border
        border-[#d5e6e2]
        bg-white
        text-sm
        text-gray-700
        placeholder:text-gray-400
        outline-none
        transition-all
        hover:border-[#84c4b4]
        focus:border-[#7EBEB2]
        focus:ring-2
        focus:ring-[#7EBEB2]/20
        disabled:bg-gray-50
        disabled:text-gray-400
        disabled:border-gray-200
        disabled:cursor-not-allowed
        ${className}
      `}
    />
  )
}
