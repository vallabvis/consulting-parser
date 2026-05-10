import Navbar from '@/components/shared/Navbar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-muted/40 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-[#8B1A1A]">Wisconsin Consulting Club</span> · UW–Madison
          </span>
          <span>© {new Date().getFullYear()} · All rights reserved</span>
        </div>
      </footer>
    </div>
  )
}
