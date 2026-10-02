import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fotos de perfil/portfólio são salvas pelo backend em /uploads (URLs relativas);
  // repassa essas URLs para o backend para funcionarem mesmo em outro domínio.
  async rewrites() {
    if (!process.env.API_BASE_URL) return [];
    return [{ source: "/uploads/:path*", destination: `${process.env.API_BASE_URL}/uploads/:path*` }];
  },
};

export default nextConfig;
