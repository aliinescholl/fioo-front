/**
 * Helper para resolver URLs de arquivos de mídia (fotos de perfil, portfólio, etc.)
 * Mantém caminhos relativos (ex: "/uploads/...", "/api/uploads/...") para passarem
 * pelo rewrite/rota do próprio Next.js (que usa process.env.API_BASE_URL no servidor),
 * evitando conflitos de porta ou host no navegador.
 */
export function getMediaUrl(path?: string | null): string | null {
  if (!path || typeof path !== "string") return null
  const trimmed = path.trim()
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed
  }

  // Normaliza barras invertidas de caminhos Windows eventualmente retornados pelo backend
  const normalized = trimmed.replace(/\\/g, "/")

  // Se vier uma URL absoluta ou relativa contendo /uploads/, usa o caminho relativo "/uploads/..."
  // para aproveitar o rewrite configurado em next.config.ts apontando para API_BASE_URL
  const uploadsIndex = normalized.indexOf("/uploads/")
  if (uploadsIndex !== -1) {
    return normalized.slice(uploadsIndex)
  }

  const apiUploadsIndex = normalized.indexOf("/api/uploads/")
  if (apiUploadsIndex !== -1) {
    return normalized.slice(apiUploadsIndex)
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized
  }

  return normalized.startsWith("/") ? normalized : `/${normalized}`
}
