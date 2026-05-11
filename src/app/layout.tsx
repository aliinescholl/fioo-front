import "./globals.css"
import { Abhaya_Libre, Newsreader } from "next/font/google"
import { AuthProvider } from "@/context/AuthContext"

const abhaya = Abhaya_Libre({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-abhaya",
})

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-newsreader",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className={`${abhaya.variable} ${newsreader.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}