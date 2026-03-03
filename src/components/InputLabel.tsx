import { useId } from "react"

type Props = {
    type: string,
    label: string,
    name: string
}

export function InputLabel({type = "text", label, name} : Props) {
    const id = useId();
    
    return (
        <div className="flex flex-col">
            <label htmlFor={id}>{label}</label>
            <input id={id} type={type} name={name} className="border-2 border-solid rounded-lg"/>
        </div>
    )
}