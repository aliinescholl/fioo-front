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

/** Formata CPF ou CNPJ conforme o tamanho */
export function formatCpfCnpj(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14)
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
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
