"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Category, ExpenseRecord, FixedCost, IncomeRecord, MonthlyBudget, Savings } from "@/types"
import { formatKRW } from "@/lib/calculations/budget"
import { cn } from "@/lib/utils"

interface BudgetCategory {
  id: string
  category_id: string
  budget_amount: number
  categories?: Category
}

interface Props {
  year: number
  month: number
  expenses: (ExpenseRecord & { categories?: Category })[]
  incomeRecords: IncomeRecord[]
  fixedCosts: (FixedCost & { categories?: Category })[]
  savingsData: Savings[]
  budget: MonthlyBudget | null
  budgetCategories: BudgetCategory[]
  categories: Category[]
  familyGroupId: string
}

export function SettlementClient({
  year, month,
  expenses, incomeRecords, fixedCosts, savingsData,
  budget, budgetCategories, categories,
}: Props) {
  const router = useRouter()

  const totalIncome = incomeRecords.reduce((s, r) => s + r.amount, 0)
  const totalFixed = fixedCosts.reduce((s, r) => s + r.amount, 0)
  const totalSavings = savingsData.reduce((s, r) => s + r.amount, 0)
  const totalVariable = expenses.reduce((s, e) => s + e.amount, 0)
  const variableBudget = budget?.variable_budget ?? 0
  const balance = totalIncome - totalFixed - totalSavings - totalVariable

  // Group variable expenses by category
  const expByCat = new Map<string, number>()
  for (const e of expenses) {
    const key = e.category_id ?? "uncategorized"
    expByCat.set(key, (expByCat.get(key) ?? 0) + e.amount)
  }

  // Build budget category rows
  const variableCategories = categories.filter(c => c.type === "variable")
  const budgetByCatId = new Map(budgetCategories.map(bc => [bc.category_id, bc.budget_amount]))

  function navigateMonth(delta: number) {
    let m = month + delta, y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    router.push(`/settlement?year=${y}&month=${m}`)
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 bg-muted/50">{title}</h2>
      {children}
    </div>
  )

  const Row = ({ label, budget, actual, diff, bold }: {
    label: string; budget?: number; actual: number; diff?: number; bold?: boolean
  }) => (
    <div className={cn("grid grid-cols-4 px-4 py-2.5 border-b border-border last:border-0", bold && "bg-muted/30")}>
      <span className={cn("text-sm col-span-1 truncate", bold && "font-semibold")}>{label}</span>
      <span className="text-sm tabular-nums text-right text-muted-foreground">
        {budget !== undefined ? `₩${formatKRW(budget)}` : "-"}
      </span>
      <span className={cn("text-sm tabular-nums text-right font-medium", bold && "font-bold")}>
        ₩{formatKRW(actual)}
      </span>
      <span className={cn(
        "text-sm tabular-nums text-right",
        diff !== undefined && diff < 0 && "text-red-600",
        diff !== undefined && diff > 0 && "text-emerald-600",
      )}>
        {diff !== undefined ? (diff >= 0 ? `+${formatKRW(diff)}` : `-${formatKRW(Math.abs(diff))}`) : ""}
      </span>
    </div>
  )

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg hover:bg-muted">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">{year}년 {month}월 정산</h1>
          <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-muted">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Summary banner */}
      <div className={cn(
        "mx-4 mt-4 rounded-xl p-4 border",
        balance >= 0 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
      )}>
        <p className="text-xs text-muted-foreground">수입 - 고정비 - 저축 - 변동비</p>
        <p className={cn("text-3xl font-black tabular-nums mt-1", balance >= 0 ? "text-emerald-700" : "text-red-700")}>
          {balance >= 0 ? "+" : ""}₩{formatKRW(balance)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          수입 ₩{formatKRW(totalIncome)} · 지출 ₩{formatKRW(totalFixed + totalVariable + totalSavings)}
        </p>
      </div>

      {/* Table */}
      <div className="mt-4 border-t border-border">
        {/* Column headers */}
        <div className="grid grid-cols-4 px-4 py-2 bg-muted/50 border-b border-border">
          {["항목", "예산", "실제", "차이"].map(h => (
            <span key={h} className="text-xs font-semibold text-muted-foreground text-right first:text-left">{h}</span>
          ))}
        </div>

        {/* Income */}
        <Section title="수입">
          {incomeRecords.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">미입력</div>
          ) : incomeRecords.map(r => (
            <Row key={r.id} label={r.description ?? (r.type === "salary" ? "급여" : "기타수입")} actual={r.amount} />
          ))}
          <Row label="수입 합계" actual={totalIncome} bold />
        </Section>

        {/* Fixed costs */}
        <Section title="고정비">
          {fixedCosts.map(fc => (
            <Row key={fc.id} label={fc.name} actual={fc.amount} />
          ))}
          <Row label="고정비 합계" actual={totalFixed} bold />
        </Section>

        {/* Savings */}
        <Section title="저축">
          {savingsData.map(s => (
            <Row key={s.id} label={s.name} actual={s.amount} />
          ))}
          <Row label="저축 합계" actual={totalSavings} bold />
        </Section>

        {/* Variable expenses by category */}
        <Section title={`변동비 (예산: ₩${formatKRW(variableBudget)})`}>
          {variableCategories.map(cat => {
            const actual = expByCat.get(cat.id) ?? 0
            if (actual === 0 && !budgetByCatId.has(cat.id)) return null
            const catBudget = budgetByCatId.get(cat.id)
            const diff = catBudget !== undefined ? catBudget - actual : undefined
            return (
              <Row
                key={cat.id}
                label={`${cat.icon} ${cat.name}`}
                budget={catBudget}
                actual={actual}
                diff={diff}
              />
            )
          })}
          {expByCat.has("uncategorized") && (
            <Row label="미분류" actual={expByCat.get("uncategorized") ?? 0} />
          )}
          <Row
            label="변동비 합계"
            budget={variableBudget > 0 ? variableBudget : undefined}
            actual={totalVariable}
            diff={variableBudget > 0 ? variableBudget - totalVariable : undefined}
            bold
          />
        </Section>

        {/* Final balance */}
        <div className="px-4 py-4 border-t-2 border-border">
          <div className="grid grid-cols-2 gap-1">
            {[
              { label: "총 수입", value: totalIncome, plus: true },
              { label: "총 지출", value: totalFixed + totalVariable + totalSavings, minus: true },
            ].map(item => (
              <div key={item.label} className="text-center p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={cn(
                  "text-lg font-bold tabular-nums",
                  item.plus && "text-emerald-600",
                  item.minus && "text-red-600",
                )}>
                  {item.plus ? "+" : "-"}₩{formatKRW(item.value)}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">최종 잔액</p>
            <p className={cn("text-2xl font-black tabular-nums", balance >= 0 ? "text-emerald-600" : "text-red-600")}>
              {balance >= 0 ? "+" : ""}₩{formatKRW(balance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
