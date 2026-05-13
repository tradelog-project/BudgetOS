"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { IncomeRecord, MonthlyBudget, Savings } from "@/types"
import { formatKRW, formatInput, parseAmount } from "@/lib/calculations/budget"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectNative } from "@/components/ui/select"
import { BudgetSetupModal } from "@/components/forms/budget-setup-modal"
import { Separator } from "@/components/ui/separator"

interface Props {
  year: number
  month: number
  familyGroupId: string
  currentUserId: string
  incomeRecords: IncomeRecord[]
  savingsData: Savings[]
  budget: MonthlyBudget | null
  profile: { id: string; name: string; email: string; role: string }
  familyGroup: { name: string; invite_code: string }
}

export function SettingsClient({
  year, month, familyGroupId, currentUserId,
  incomeRecords, savingsData, budget,
  profile, familyGroup,
}: Props) {
  const router = useRouter()
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [savingsOpen, setSavingsOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)

  // Income form
  const [incomeAmount, setIncomeAmount] = useState("")
  const [incomeType, setIncomeType] = useState<"salary" | "side_income" | "other">("salary")
  const [incomeDesc, setIncomeDesc] = useState("")

  // Savings form
  const [savingsName, setSavingsName] = useState("")
  const [savingsAmount, setSavingsAmount] = useState("")
  const [savingsCategory, setSavingsCategory] = useState<"housing" | "emergency" | "investment" | "education" | "general" | "other">("general")

  const totalIncome = incomeRecords.reduce((s, r) => s + r.amount, 0)
  const totalSavings = savingsData.reduce((s, r) => s + r.amount, 0)

  function navigateMonth(delta: number) {
    let m = month + delta, y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    router.push(`/settings?year=${y}&month=${m}`)
  }

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseAmount(incomeAmount)
    if (!amount) { toast.error("금액을 입력하세요"); return }
    const supabase = createClient()
    const { error } = await supabase.from("income_records").insert({
      family_group_id: familyGroupId,
      member_id: currentUserId,
      year, month,
      amount,
      type: incomeType,
      description: incomeDesc || null,
    })
    if (error) { toast.error("저장 실패: " + error.message); return }
    toast.success("수입이 추가되었습니다")
    setIncomeAmount(""); setIncomeDesc("")
    setIncomeOpen(false)
    router.refresh()
  }

  async function handleAddSavings(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseAmount(savingsAmount)
    if (!savingsName || !amount) { toast.error("이름과 금액을 입력하세요"); return }
    const supabase = createClient()
    const { error } = await supabase.from("savings").insert({
      family_group_id: familyGroupId,
      year, month,
      name: savingsName,
      amount,
      category: savingsCategory,
    })
    if (error) { toast.error("저장 실패: " + error.message); return }
    toast.success("저축이 추가되었습니다")
    setSavingsName(""); setSavingsAmount("")
    setSavingsOpen(false)
    router.refresh()
  }

  async function handleDeleteIncome(id: string) {
    const supabase = createClient()
    await supabase.from("income_records").delete().eq("id", id)
    router.refresh()
  }

  async function handleDeleteSavings(id: string) {
    const supabase = createClient()
    await supabase.from("savings").delete().eq("id", id)
    router.refresh()
  }

  const incomeTypeLabel = (t: string) => ({ salary: "급여", side_income: "부수입", other: "기타" })[t] ?? t
  const savingsCatLabel = (t: string) => ({
    housing: "주택청약", emergency: "비상금", investment: "투자",
    education: "교육", general: "일반저축", other: "기타"
  })[t] ?? t

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg hover:bg-muted">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">{year}년 {month}월 설정</h1>
          <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-muted">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Budget */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <p className="text-sm font-semibold">변동비 예산</p>
              <p className="text-xl font-bold tabular-nums text-primary">₩{formatKRW(budget?.variable_budget ?? 0)}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setBudgetOpen(true)}>
              {budget ? "수정" : "설정"}
            </Button>
          </div>
        </div>

        {/* Income */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <p className="text-sm font-semibold">수입</p>
              <p className="text-xl font-bold tabular-nums">₩{formatKRW(totalIncome)}</p>
            </div>
            <Button size="sm" onClick={() => setIncomeOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> 추가
            </Button>
          </div>
          {incomeRecords.length > 0 && (
            <div className="divide-y divide-border">
              {incomeRecords.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1">
                    <p className="text-sm">{r.description || incomeTypeLabel(r.type)}</p>
                    <p className="text-xs text-muted-foreground">{incomeTypeLabel(r.type)}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums">+₩{formatKRW(r.amount)}</p>
                  <button onClick={() => handleDeleteIncome(r.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Savings */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <p className="text-sm font-semibold">저축</p>
              <p className="text-xl font-bold tabular-nums">₩{formatKRW(totalSavings)}</p>
            </div>
            <Button size="sm" onClick={() => setSavingsOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> 추가
            </Button>
          </div>
          {savingsData.length > 0 && (
            <div className="divide-y divide-border">
              {savingsData.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1">
                    <p className="text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{savingsCatLabel(s.category)}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums">₩{formatKRW(s.amount)}</p>
                  <button onClick={() => handleDeleteSavings(s.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Profile / Quick links */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">관리</p>
          {[
            { label: "고정비 관리", href: "/fixed-costs" },
            { label: "결제수단 관리", href: "/payment-methods" },
            { label: "특별 일정", href: "/events" },
            { label: "가족 설정", href: "/family" },
          ].map(item => (
            <a key={item.href} href={item.href}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted transition-colors">
              <span className="text-sm">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      </div>

      {/* Income modal */}
      <Dialog open={incomeOpen} onOpenChange={v => !v && setIncomeOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>수입 추가</DialogTitle></DialogHeader>
          <form onSubmit={handleAddIncome} className="space-y-4">
            <div className="space-y-1.5">
              <Label>금액</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₩</span>
                <Input
                  value={incomeAmount}
                  onChange={e => setIncomeAmount(formatInput(e.target.value))}
                  inputMode="numeric"
                  placeholder="0"
                  className="pl-7 text-xl font-bold h-14 tabular-nums"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>종류</Label>
                <SelectNative value={incomeType} onChange={e => setIncomeType(e.target.value as typeof incomeType)}>
                  <option value="salary">급여</option>
                  <option value="side_income">부수입</option>
                  <option value="other">기타</option>
                </SelectNative>
              </div>
              <div className="space-y-1.5">
                <Label>설명 (선택)</Label>
                <Input value={incomeDesc} onChange={e => setIncomeDesc(e.target.value)} placeholder="예: 5월 급여" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIncomeOpen(false)}>취소</Button>
              <Button type="submit" className="flex-1">저장</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Savings modal */}
      <Dialog open={savingsOpen} onOpenChange={v => !v && setSavingsOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>저축 추가</DialogTitle></DialogHeader>
          <form onSubmit={handleAddSavings} className="space-y-4">
            <div className="space-y-1.5">
              <Label>저축명</Label>
              <Input value={savingsName} onChange={e => setSavingsName(e.target.value)} placeholder="예: 아동수당" required />
            </div>
            <div className="space-y-1.5">
              <Label>금액</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₩</span>
                <Input
                  value={savingsAmount}
                  onChange={e => setSavingsAmount(formatInput(e.target.value))}
                  inputMode="numeric"
                  placeholder="0"
                  className="pl-7 text-xl font-bold h-14 tabular-nums"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>카테고리</Label>
              <SelectNative value={savingsCategory} onChange={e => setSavingsCategory(e.target.value as typeof savingsCategory)}>
                <option value="housing">주택청약</option>
                <option value="emergency">비상금</option>
                <option value="investment">투자</option>
                <option value="education">교육</option>
                <option value="general">일반저축</option>
                <option value="other">기타</option>
              </SelectNative>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setSavingsOpen(false)}>취소</Button>
              <Button type="submit" className="flex-1">저장</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BudgetSetupModal
        open={budgetOpen}
        onClose={() => setBudgetOpen(false)}
        familyGroupId={familyGroupId}
        year={year}
        month={month}
        existingBudget={budget}
        onSuccess={() => { setBudgetOpen(false); router.refresh() }}
      />
    </div>
  )
}
