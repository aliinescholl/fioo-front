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
