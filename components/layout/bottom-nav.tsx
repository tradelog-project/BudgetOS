"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CalendarDays, BarChart3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "홈" },
  { href: "/calendar", icon: CalendarDays, label: "달력" },
  { href: "/settlement", icon: BarChart3, label: "정산" },
  { href: "/settings", icon: Settings, label: "설정" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border">
      <div className="max-w-lg mx-auto flex">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-primary/10")} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          )
        })}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  )
}
