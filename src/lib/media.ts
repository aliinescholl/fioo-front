/**
 * Helper para resolver URLs de arquivos de mídia (fotos de perfil, portfólio, etc.)
 * Suporta caminhos relativos do backend, URLs completas (http/https), data URIs e blob URLs.
 */
export function getMediaUrl(path?: string | null): string | null {
  if (!path) return null
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5131"
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
}
