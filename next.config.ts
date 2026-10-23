import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Fotos de perfil/portfólio são salvas pelo backend em /uploads (URLs relativas);
  // repassa essas URLs para o backend para funcionarem mesmo em outro domínio.
  async rewrites() {
    const apiBase = process.env.API_BASE_URL || "http://localhost:5131";
    return [
      {
        source: "/uploads/:path*",
        destination: `${apiBase}/uploads/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/recuperar-senha",
        destination: "/esqueci-senha",
        permanent: true,
      },
      {
        source: "/esqueceu-senha",
        destination: "/esqueci-senha",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
