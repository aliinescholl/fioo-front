import { ROTULO_ESTRELAS, formatarMedia } from "@/types/avaliacao"

function Estrela({ cheia, tamanho }: { cheia: boolean; tamanho: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true"
      className={cheia ? "fill-amber-400 stroke-amber-500" : "fill-white stroke-gray-300"} strokeWidth="1.5">
      <path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z" />
    </svg>
  )
}

type InputProps = {
  rotulo: string
  nome: string
  valor: number | null
  onChange: (valor: number) => void
  erro?: string
  grande?: boolean
}

/**
 * Escolha de 1 a 5 estrelas. São botões de rádio nativos (setas do teclado funcionam),
 * com área de toque de 44px e o significado da nota em texto.
 */
export function EstrelasInput({ rotulo, nome, valor, onChange, erro, grande }: InputProps) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className={`font-semibold text-gray-700 ${grande ? "text-base" : "text-sm"}`}>{rotulo}</legend>
      <div className="flex flex-wrap items-center">
        {[1, 2, 3, 4, 5].map(n => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name={nome}
              value={n}
              checked={valor === n}
              onChange={() => onChange(n)}
              aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}: ${ROTULO_ESTRELAS[n - 1]}`}
              className="sr-only peer"
            />
            <span className={`flex items-center justify-center rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-[#2a594d] ${grande ? "w-12 h-12" : "w-11 h-11"}`}>
              <Estrela cheia={valor !== null && n <= valor} tamanho={grande ? 36 : 30} />
            </span>
          </label>
        ))}
        <span className="ml-2 text-sm text-gray-600" aria-live="polite">
          {valor ? ROTULO_ESTRELAS[valor - 1] : "Toque nas estrelas"}
        </span>
      </div>
      {erro && <p className="text-xs text-red-500">{erro}</p>}
    </fieldset>
  )
}

/** Média e total de avaliações, só leitura: "★ 4,5 (12 avaliações)". */
export function NotaResumo({ media, total, compacto }: { media: number | null; total: number; compacto?: boolean }) {
  if (total === 0 || media === null) {
    return <span className="text-xs text-gray-400">Sem avaliações</span>
  }
  const texto = `${formatarMedia(media)} de 5, ${total} ${total === 1 ? "avaliação" : "avaliações"}`
  return (
    <span className="flex items-center gap-1" aria-label={texto} title={texto}>
      <Estrela cheia tamanho={compacto ? 16 : 20} />
      <span className={`font-semibold text-gray-800 ${compacto ? "text-sm" : "text-base"}`}>{formatarMedia(media)}</span>
      <span className="text-xs text-gray-500">({total})</span>
    </span>
  )
}
