/** Valida CPF (11 dígitos) */
export function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "")
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += +d[i] * (10 - i)
  let rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  if (rem !== +d[9]) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += +d[i] * (11 - i)
  rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  return rem === +d[10]
}

/** Valida CNPJ (14 dígitos) */
export function validateCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, "")
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  let sum = w1.reduce((acc, w, i) => acc + +d[i] * w, 0)
  let rem = sum % 11
  if ((rem < 2 ? 0 : 11 - rem) !== +d[12]) return false

  sum = w2.reduce((acc, w, i) => acc + +d[i] * w, 0)
  rem = sum % 11
  return (rem < 2 ? 0 : 11 - rem) === +d[13]
}

/** Formata apenas CPF (000.000.000-00) */
export function formatCpf(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

/** Formata apenas CNPJ (00.000.000/0000-00) */
export function formatCnpj(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

/** Formata CPF ou CNPJ conforme o tamanho */
export function formatCpfCnpj(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14)
  if (d.length <= 11) {
    return formatCpf(d)
  }
  return formatCnpj(d)
}

/** Extrai os dígitos locais (DDD + número, 10 ou 11 dígitos) de um telefone */
export function extrairDigitosTelefone(raw: string): string {
  const d = raw.replace(/\D/g, "")
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) {
    return d.slice(2)
  }
  return d.slice(0, 11)
}

/** Formata telefone brasileiro no padrão (00) 00000-0000 ou (00) 0000-0000 */
export function formatTelefone(raw: string): string {
  const d = extrairDigitosTelefone(raw)
  if (d.length === 0) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6, 10)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`
}

/**
 * Valida se o telefone está em um formato brasileiro válido e aceito pelo WhatsApp
 * (DDD de 2 dígitos de 11 a 99 + 8 ou 9 dígitos de assinante).
 */
export function validateTelefone(raw: string): boolean {
  if (!raw) return false
  let d = raw.replace(/\D/g, "")
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) {
    d = d.slice(2)
  }
  if (d.length !== 10 && d.length !== 11) return false
  if (!/^[1-9][1-9]\d{8,9}$/.test(d)) return false
  const numeroAssinante = d.slice(2)
  if (/^0+$/.test(numeroAssinante)) return false
  return true
}

/** Gera o link oficial do WhatsApp (https://wa.me/TELEFONE) com DDI 55 */
export function formatWhatsAppUrl(raw: string): string {
  const d = raw.replace(/\D/g, "")
  if (!d) return "https://wa.me/"
  const comDdi = (d.length === 10 || d.length === 11) ? `55${d}` : d
  return `https://wa.me/${comDdi}`
}

/** Formata CEP no padrão 00000-000 */
export function formatCEP(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8)
  return d.replace(/^(\d{5})(\d)/, "$1-$2")
}

/** Valida CEP brasileiro (8 dígitos) */
export function validateCEP(raw: string): boolean {
  const d = raw.replace(/\D/g, "")
  return d.length === 8 && !/^(\d)\1{7}$/.test(d)
}

/**
 * Formata valor monetário em R$ (padrão brasileiro: 1.234,56) durante a digitação.
 * Opera por deslocamento de centavos sem exigir que o usuário digite vírgula ou ponto.
 */
export function formatMoeda(raw: string): string {
  if (!raw) return ""
  const d = raw.replace(/\D/g, "").slice(0, 11)
  if (!d) return ""
  const centavos = parseInt(d, 10)
  if (isNaN(centavos) || centavos === 0) {
    return raw.trim() === "0" ? "0,00" : ""
  }
  const inteiro = Math.floor(centavos / 100)
  const dec = String(centavos % 100).padStart(2, "0")
  const inteiroFmt = inteiro.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${inteiroFmt},${dec}`
}

/** Formata um número (ex.: vindo da API, como 150 ou 25.5) para máscara monetária "150,00" */
export function formatNumeroParaMoeda(val: unknown): string {
  if (val === null || val === undefined || val === "") return ""
  const n = typeof val === "number" ? val : Number(String(val).replace(",", "."))
  if (isNaN(n) || n < 0) return ""
  if (n === 0) return "0,00"
  return formatMoeda(String(Math.round(n * 100)))
}

/** Converte string monetária formatada ("1.234,56" ou "1234.56") para number normalizado */
export function parseMoedaParaNumero(val: string): number | null {
  const t = val.trim()
  if (!t) return null
  const normalizado = t.includes(",")
    ? t.replace(/\./g, "").replace(",", ".")
    : t
  const n = Number(normalizado)
  return isNaN(n) ? null : n
}

function ehDataCalendarioValida(ano: number, mes: number, dia: number): boolean {
  if (ano < 1900 || ano > 2100) return false
  if (mes < 1 || mes > 12) return false
  if (dia < 1 || dia > 31) return false
  const dt = new Date(ano, mes - 1, dia)
  return dt.getFullYear() === ano && dt.getMonth() === mes - 1 && dt.getDate() === dia
}

/**
 * Formata data no padrão brasileiro DD/MM/AAAA durante a digitação
 * ou converte uma data ISO (AAAA-MM-DD) vinda do backend para DD/MM/AAAA.
 */
export function formatDataBr(raw: string): string {
  if (!raw) return ""
  const isoMatch = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`
  }
  const d = raw.replace(/\D/g, "").slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`
}

/**
 * Converte data em DD/MM/AAAA ou AAAA-MM-DD para o formato ISO normalizado (AAAA-MM-DD)
 * esperado pelo backend. Retorna "" se a data for incompleta ou inválida.
 */
export function normalizarDataParaIso(raw: string): string {
  if (!raw) return ""
  const limpo = raw.trim()

  const isoMatch = limpo.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, a, m, d] = isoMatch
    return ehDataCalendarioValida(Number(a), Number(m), Number(d)) ? `${a}-${m}-${d}` : ""
  }

  const brMatch = limpo.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) {
    const [, d, m, a] = brMatch
    return ehDataCalendarioValida(Number(a), Number(m), Number(d)) ? `${a}-${m}-${d}` : ""
  }

  return ""
}

/** Valida uma data em DD/MM/AAAA (ou AAAA-MM-DD), retornando mensagem de erro ou null */
export function validateDataBr(
  raw: string,
  opcoes?: { permitirPassado?: boolean }
): string | null {
  if (!raw || !raw.trim()) return "Informe a data do prazo"
  const iso = normalizarDataParaIso(raw)
  if (!iso) return "Data inválida. Use o formato DD/MM/AAAA"

  if (!opcoes?.permitirPassado) {
    const hoje = new Date().toLocaleDateString("sv-SE")
    if (iso < hoje) return "A data do prazo não pode estar no passado"
  }

  return null
}

/** Formata campo numérico inteiro (como anos de experiência ou número de endereço) */
export function formatInteiro(raw: string, maxDigits = 4): string {
  return raw.replace(/\D/g, "").slice(0, maxDigits)
}
