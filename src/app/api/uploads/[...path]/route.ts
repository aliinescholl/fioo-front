import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { UPLOADS_DIR } from "@/lib/perfilStore"

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params
    if (!segments || segments.length === 0) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Impede path traversal
    const nomeSeguro = path.basename(segments.join("_"))
    const arquivoPath = path.join(UPLOADS_DIR, nomeSeguro)

    if (!fs.existsSync(arquivoPath)) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const ext = nomeSeguro.split(".").pop()?.toLowerCase() ?? "jpg"
    const contentType = MIME_MAP[ext] ?? "application/octet-stream"
    const buffer = fs.readFileSync(arquivoPath)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
