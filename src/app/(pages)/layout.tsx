import { TopBar } from "@/components/organisms/TopBar"
import { BottomNav } from "@/components/organisms/BottomNav"

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">

      <TopBar />

      <main className="flex-1 px-4 pt-4 pb-[80px]">
        {children}
      </main>

      <BottomNav />

    </div>
  )
}