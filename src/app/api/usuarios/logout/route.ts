import { NextResponse } from "next/server"
import { COOKIE_NAME, COOKIE_CLEAR_OPTIONS } from "@/lib/cookie"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, "", COOKIE_CLEAR_OPTIONS)
  return res
}
