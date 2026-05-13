import type { BudgetStatus } from "@/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: BudgetStatus
  large?: boolean
}

const statusConfig = {
  SAFE: { label: "✅ SAFE", variant: "success" as const, desc: "안정적 소비 중" },
  WARNING: { label: "⚠️ WARNING", variant: "warning" as const, desc: "초과 가능성 있음" },
  DANGER: { label: "🔴 DANGER", variant: "danger" as const, desc: "예산 초과 예상" },
}

export function StatusBadge({ status, large }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={config.variant}
        className={cn("font-semibold", large && "text-sm px-3 py-1")}
      >
        {config.label}
      </Badge>
      {large && <span className="text-sm text-muted-foreground">{config.desc}</span>}
    </div>
  )
}
