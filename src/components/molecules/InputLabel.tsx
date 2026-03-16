"use client"

import { useId } from "react"
import { Input } from "../atoms/Input"
import { Label } from "../atoms/Label"

type Props = {
  label: string
} & React.InputHTMLAttributes<HTMLInputElement>

export function InputLabel({ label, ...props }: Props) {
  const id = useId()

  return (
    <div className="flex flex-col w-full gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
    </div>
  )
}