"use client"

import { useState, useEffect } from "react"
import { getDaysInMonth } from "date-fns"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { formatInput, parseAmount } from "@/lib/utils"
import type { MonthlyBudget } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  open: boolean
  onClose: () => void
  familyGroupId: string
  year: number
  month: number
  existingBudget: MonthlyBudget | null
  onSuccess: () => void
}

export function BudgetSetupModal({ open, onClose, familyGroupId, year, month, existingBudget, onSuccess }: Props) {
  const [monthlyInput, setMonthlyInput] = useState("")
  const [dailyInput, setDailyInput] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const daysInMonth = getDaysInMonth(new Date(year, month - 1))

  useEffect(() => {
    if (open) {
      if (existingBudget && existingBudget.variable_budget > 0) {
        const monthly = existingBudget.variable_budget
        setMonthlyInput(monthly.toLocaleString("ko-KR"))
        setDailyInput(Math.floor(monthly / daysInMonth).toLocaleString("ko-KR"))
        setNotes(existingBudget.notes ?? "")
      } else {
        setMonthlyInput("")
        setDailyInput("")
        setNotes("")
      }
    }
  }, [open, existingBudget, daysInMonth])

  function handleMonthlyChange(val: string) {
    const formatted = formatInput(val)
    setMonthlyInput(formatted)
    const num = parseAmount(formatted)
    setDailyInput(num > 0 ? Math.floor(num / daysInMonth).toLocaleString("ko-KR") : "")
  }

  function handleDailyChange(val: string) {
    const formatted = formatInput(val)
    setDailyInput(formatted)
    const num = parseAmount(formatted)
    setMonthlyInput(num > 0 ? (num * daysInMonth).toLocaleString("ko-KR") : "")
  }

  async function handleSave() {
    const budget = parseAmount(monthlyInput)
    if (!budget) { toast.error("예산을 입력해주세요."); return }

    setLoading(true)
    const supabase = createClient()
    const payload = {
      family_group_id: familyGroupId,
      year, month,
      variable_budget: budget,
      notes: notes || null,
    }

    const { error } = existingBudget
      ? await supabase.from("monthly_budgets").update(payload).eq("id", existingBudget.id)
      : await supabase.from("monthly_budgets").insert(payload)

    if (error) {
      toast.error("저장 실패: " + error.message)
    } else {
      toast.success(`${year}년 ${month}월 예산이 설정되었습니다!`)
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{year}년 {month}월 예산 설정</DialogTitle>
          <DialogDescription>
            월예산 또는 일예산 중 하나를 입력하면 자동으로 계산됩니다. ({daysInMonth}일 기준)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 월예산 */}
          <div className="space-y-1.5">
            <Label htmlFor="monthly-budget">월 변동비 예산</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₩</span>
              <Input
                id="monthly-budget"
                value={monthlyInput}
                onChange={e => handleMonthlyChange(e.target.value)}
                inputMode="numeric"
                placeholder="0"
                className="pl-7 text-xl font-bold h-14 tabular-nums"
              />
            </div>
            <p className="text-xs text-muted-foreground">식비·교통비·생활비 등 변동 지출 합계</p>
          </div>

          {/* 구분선 + 자동계산 안내 */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground px-2">↕ 자동 계산</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* 일예산 */}
          <div className="space-y-1.5">
            <Label htmlFor="daily-budget">하루 사용 가능 금액</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₩</span>
              <Input
                id="daily-budget"
                value={dailyInput}
                onChange={e => handleDailyChange(e.target.value)}
                inputMode="numeric"
                placeholder="0"
                className="pl-7 text-xl font-bold h-14 tabular-nums"
              />
            </div>
            <p className="text-xs text-muted-foreground">일예산 입력 시 월예산 자동 계산 (× {daysInMonth}일)</p>
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label htmlFor="budget-notes">메모 (선택)</Label>
            <Input
              id="budget-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="예: 여행 예정으로 예산 증액"
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>취소</Button>
            <Button type="button" className="flex-1" disabled={loading} onClick={handleSave}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
