"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import {
  Wallet, TrendingDown, PiggyBank, AlertTriangle, CalendarDays,
  ChevronLeft, ChevronRight, Plus, LogOut, RefreshCw
} from "lucide-react"
import type { DashboardData, Category, PaymentMethod, Profile, ExpenseRecord, FixedCost, Savings, IncomeRecord, MonthlyBudget } from "@/types"
import { formatKRW, formatKRWShort } from "@/lib/calculations/budget"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { StatCard } from "./stat-card"
import { StatusBadge } from "./status-badge"
import { ExpenseInputModal } from "@/components/forms/expense-input-modal"
import { BudgetSetupModal } from "@/components/forms/budget-setup-modal"
import { cn } from "@/lib/utils"

interface Props {
  dashboardData: DashboardData
  year: number
  month: number
  profile: Profile & { family_groups: { name: string; invite_code: string } }
  familyGroup: { name: string; invite_code: string }
  recentExpenses: (ExpenseRecord & { categories?: Category; payment_methods?: PaymentMethod; profiles?: Pick<Profile, "name" | "avatar_url"> })[]
  categories: Category[]
  paymentMethods: PaymentMethod[]
  members: Pick<Profile, "id" | "name" | "avatar_url">[]
  budget: MonthlyBudget | null
  fixedCosts: FixedCost[]
  savingsData: Savings[]
  incomeRecords: IncomeRecord[]
}

export function DashboardClient({
  dashboardData: d,
  year, month,
  profile, familyGroup,
  recentExpenses,
  categories, paymentMethods, members,
  budget, fixedCosts, savingsData, incomeRecords,
}: Props) {
  const router = useRouter()
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const progressColor =
    d.status === "DANGER" ? "bg-red-500" :
    d.status === "WARNING" ? "bg-amber-500" :
    "bg-emerald-500"

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                let m = month - 1, y = year
                if (m < 1) { m = 12; y-- }
                router.push(`/?year=${y}&month=${m}`)
              }}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="text-center px-1">
              <p className="text-xs text-muted-foreground">{familyGroup.name}</p>
              <h1 className="text-base font-bold leading-tight">{year}년 {month}월</h1>
            </div>
            <button
              onClick={() => {
                let m = month + 1, y = year
                if (m > 12) { m = 1; y++ }
                router.push(`/?year=${y}&month=${m}`)
              }}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.refresh()}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 space-y-4 pb-6">

        {/* Budget status banner */}
        <div className={cn(
          "rounded-xl p-4 border",
          d.status === "SAFE" && "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800",
          d.status === "WARNING" && "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
          d.status === "DANGER" && "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
        )}>
          <div className="flex items-center justify-between mb-3">
            <StatusBadge status={d.status} large />
            <span className="text-sm font-semibold tabular-nums">{d.usageRate}%</span>
          </div>
          <Progress
            value={d.usageRate}
            max={100}
            className="h-2.5 bg-white/50 dark:bg-black/20"
            indicatorClassName={progressColor}
          />
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>사용 ₩{formatKRW(d.totalVariableSpent)}</span>
            <span>예산 ₩{formatKRW(d.variableBudget)}</span>
          </div>
        </div>

        {/* TODAY allowance — hero card */}
        <div className="rounded-xl bg-primary text-primary-foreground p-5 space-y-1">
          <p className="text-sm opacity-80">오늘 사용 가능 금액</p>
          <p className="text-4xl font-black tabular-nums tracking-tight">
            ₩{formatKRW(d.adjustedTodayAllowance)}
          </p>
          <p className="text-xs opacity-70">
            남은 {d.remainingDays}일 | 예비비 반영 | 무지출 {d.zeroDayCount}일
          </p>
          {d.dailyReserveNeeded > 0 && (
            <p className="text-xs opacity-70 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              일일 예비비 ₩{formatKRW(d.dailyReserveNeeded)} 별도 확보 필요
            </p>
          )}
        </div>

        {/* 4-grid summary */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="이번 달 수입"
            value={d.totalIncome}
            icon={<Wallet className="h-4 w-4" />}
            sub={incomeRecords.length > 0 ? `${incomeRecords.length}건` : "미입력"}
          />
          <StatCard
            title="고정비"
            value={d.totalFixedCosts}
            icon={<TrendingDown className="h-4 w-4" />}
            sub={`${fixedCosts.length}개 항목`}
          />
          <StatCard
            title="저축"
            value={d.totalSavings}
            icon={<PiggyBank className="h-4 w-4" />}
            sub={savingsData.length > 0 ? `${savingsData.length}건` : "미입력"}
          />
          <StatCard
            title="남은 예산"
            value={d.remainingBudget}
            highlight={d.remainingBudget > 0}
            danger={d.remainingBudget < 0}
            sub={`예산 ₩${formatKRWShort(d.variableBudget)}`}
          />
        </div>

        {/* Projection row */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="예상 월말 지출"
            value={d.projectedMonthlySpend}
            sub="현재 소비 속도 기준"
          />
          <StatCard
            title="예상 잔액"
            value={d.projectedBalance}
            highlight={d.projectedBalance >= 0}
            danger={d.projectedBalance < 0}
            sub="월 변동비 대비"
          />
        </div>

        {/* Special events alert */}
        {d.nearestEvent && (
          <Link href="/events">
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  다가오는 특별 지출
                </p>
                <p className="text-sm font-bold truncate">{d.nearestEvent.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(d.nearestEvent.event_date), "M월 d일", { locale: ko })} ·
                  예상 ₩{formatKRW(d.nearestEvent.expected_amount)}
                </p>
                {d.upcomingSpecialEventsTotal > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    이번 달 특별지출 합계: ₩{formatKRW(d.upcomingSpecialEventsTotal)}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </Link>
        )}

        {/* Budget setup CTA if not set */}
        {d.variableBudget === 0 && (
          <button
            onClick={() => setBudgetOpen(true)}
            className="w-full rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-center space-y-1 hover:bg-primary/10 transition-colors"
          >
            <p className="text-sm font-medium text-primary">월 예산을 설정하세요</p>
            <p className="text-xs text-muted-foreground">변동비 예산을 입력하면 하루 사용 가능 금액이 자동 계산됩니다</p>
          </button>
        )}

        {/* Recent expenses */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">최근 지출</h2>
            <Link href="/calendar" className="text-xs text-primary flex items-center gap-0.5">
              전체 보기 <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              이번 달 지출 내역이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map(expense => (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: expense.categories?.color + "20" }}
                  >
                    {expense.categories?.icon ?? "💸"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {expense.memo || expense.categories?.name || "기타"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(expense.date), "M/d", { locale: ko })}
                      {expense.payment_methods && ` · ${expense.payment_methods.name}`}
                      {expense.profiles && ` · ${expense.profiles.name}`}
                    </p>
                  </div>
                  <p className="text-sm font-bold tabular-nums shrink-0">
                    -₩{formatKRW(expense.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/fixed-costs", label: "고정비 관리", icon: "📋" },
            { href: "/payment-methods", label: "결제수단", icon: "💳" },
            { href: "/settlement", label: "월말 정산", icon: "📊" },
            { href: "/family", label: "가족 설정", icon: "👨‍👩‍👧" },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 hover:bg-muted transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </Link>
          ))}
        </div>
      </div>

      {/* FAB - Quick expense input */}
      <button
        onClick={() => setExpenseOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] right-4 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
        aria-label="지출 입력"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modals */}
      <ExpenseInputModal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        categories={categories}
        paymentMethods={paymentMethods}
        members={members}
        familyGroupId={profile.family_group_id!}
        currentUserId={profile.id}
        onSuccess={() => { setExpenseOpen(false); router.refresh() }}
      />
      <BudgetSetupModal
        open={budgetOpen}
        onClose={() => setBudgetOpen(false)}
        familyGroupId={profile.family_group_id!}
        year={year}
        month={month}
        existingBudget={budget}
        onSuccess={() => { setBudgetOpen(false); router.refresh() }}
      />
    </div>
  )
}
