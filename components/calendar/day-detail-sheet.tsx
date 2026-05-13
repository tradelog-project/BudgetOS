"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { X, Plus, Trash2, Pencil, CalendarDays, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Category, ExpenseRecord, PaymentMethod, SpecialEvent } from "@/types"
import { formatKRW } from "@/lib/calculations/budget"
import { specialEventCategoryLabel, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Props {
  date: string
  expenses: (ExpenseRecord & { categories?: Category; payment_methods?: PaymentMethod; profiles?: { name: string } })[]
  events: SpecialEvent[]
  dailyBudgetLimit: number
  onClose: () => void
  onAddExpense: () => void
  onEditExpense: (expense: ExpenseRecord) => void
  onRefresh: () => void
}

export function DayDetailSheet({
  date, expenses, events, dailyBudgetLimit,
  onClose, onAddExpense, onEditExpense, onRefresh
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0)
  const isOverBudget = dailyBudgetLimit > 0 && totalAmount > dailyBudgetLimit
  const isZeroDay = expenses.length === 0

  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    const { error } = await supabase.from("expense_records").delete().eq("id", id)
    if (error) {
      toast.error("삭제 실패: " + error.message)
    } else {
      toast.success("삭제되었습니다")
      onRefresh()
    }
    setDeletingId(null)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-50 bg-background rounded-t-2xl border-t border-x border-border shadow-xl max-h-[80vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {format(new Date(date + "T00:00:00"), "M월 d일 (EEEE)", { locale: ko })}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {isZeroDay ? (
                  <span className="text-sm text-emerald-600 font-medium">🎉 무지출일</span>
                ) : (
                  <span className={cn(
                    "text-sm font-semibold tabular-nums",
                    isOverBudget ? "text-red-600" : "text-foreground"
                  )}>
                    총 -₩{formatKRW(totalAmount)}
                    {isOverBudget && <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 rounded-full">초과</span>}
                  </span>
                )}
                {dailyBudgetLimit > 0 && !isZeroDay && (
                  <span className="text-xs text-muted-foreground">/ 권장 ₩{formatKRW(dailyBudgetLimit)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" onClick={onAddExpense} className="h-8 px-3 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> 추가
              </Button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Special events */}
          {events.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> 특별 일정
              </h3>
              <div className="space-y-2">
                {events.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {specialEventCategoryLabel(ev.category)} · 예상 ₩{formatKRW(ev.expected_amount)}
                      </p>
                      {ev.memo && <p className="text-xs text-muted-foreground">{ev.memo}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses */}
          {expenses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-sm font-medium text-emerald-600">무지출일입니다!</p>
              <p className="text-xs text-muted-foreground mt-1">지출을 추가하려면 상단 버튼을 눌러주세요.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">지출 내역</h3>
              <div className="space-y-2">
                {expenses.map(e => (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: (e.categories?.color ?? "#94a3b8") + "20" }}
                    >
                      {e.categories?.icon ?? "💸"}
                    </div>
                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() => onEditExpense(e)}
                    >
                      <p className="text-sm font-medium truncate">
                        {e.memo || e.categories?.name || "기타"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.categories?.name}
                        {e.payment_methods && ` · ${e.payment_methods.name}`}
                        {e.profiles && ` · ${e.profiles.name}`}
                      </p>
                    </button>
                    <p className="text-sm font-bold tabular-nums shrink-0">
                      -₩{formatKRW(e.amount)}
                    </p>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => onEditExpense(e)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="수정"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        disabled={deletingId === e.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom padding for safe area */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}
