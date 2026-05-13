import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatKRW } from "@/lib/calculations/budget"

interface StatCardProps {
  title: string
  value: number | string
  sub?: string
  icon?: React.ReactNode
  highlight?: boolean
  danger?: boolean
  className?: string
}

export function StatCard({ title, value, sub, icon, highlight, danger, className }: StatCardProps) {
  const displayValue = typeof value === "number" ? formatKRW(value) : value

  return (
    <Card className={cn(
      "relative overflow-hidden",
      highlight && "border-primary/50 bg-primary/5",
      danger && "border-destructive/50 bg-destructive/5",
      className
    )}>
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn(
          "text-2xl font-bold tabular-nums tracking-tight",
          highlight && "text-primary",
          danger && "text-destructive"
        )}>
          {typeof value === "number" ? (
            <>
              <span className="text-sm font-normal mr-0.5 text-muted-foreground">₩</span>
              {displayValue}
            </>
          ) : displayValue}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}
