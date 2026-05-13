"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns"
import { ko } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import type { Category, ExpenseRecord, PaymentMethod, Profile, SpecialEvent } from "@/types"
import { formatKRW } from "@/lib/calculations/budget"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ExpenseInputModal } from "@/components/forms/expense-input-modal"
import { DayDetailSheet } from "./day-detail-sheet"

interface Props {
  year: number
  month: number
  expenses: (ExpenseRecord & { categories?: Category; payment_methods?: PaymentMethod; profiles?: { name: string } })[]
  specialEvents: SpecialEvent[]
  categories: Category[]
  paymentMethods: PaymentMethod[]
  members: Pick<Profile, "id" | "name" | "avatar_url">[]
  familyGroupId: string
  currentUserId: string
  dailyBudgetLimit: number
}

export function CalendarClient({
  year, month,
  expenses, specialEvents,
  categories, paymentMethods, members,
  familyGroupId, currentUserId,
  dailyBudgetLimit,
}: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null)

  const daysInMonth = getDaysInMonth(new Date(year, month - 1))
  const firstDayOfWeek = getDay(startOfMonth(new Date(year, month - 1)))

  // Group expenses by date
  const expensesByDate = new Map<string, typeof expenses>()
  for (const e of expenses) {
    const existing = expensesByDate.get(e.date) ?? []
    expensesByDate.set(e.date, [...existing, e])
  }

  // Group special events by date
  const eventsByDate = new Map<string, SpecialEvent[]>()
  for (const ev of specialEvents) {
    const existing = eventsByDate.get(ev.event_date) ?? []
    eventsByDate.set(ev.event_date, [...existing, ev])
  }

  const monthStats = {
    totalSpent: expenses.reduce((s, e) => s + e.amount, 0),
    spentDates: new Set(expenses.map(e => e.date)),
    zeroDayCount: 0,
  }

  // Count zero-spending days (past days only)
  const today = new Date()
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1
  const lastDay = isCurrentMonth ? today.getDate() - 1 : daysInMonth
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    if (!monthStats.spentDates.has(dateStr)) monthStats.zeroDayCount++
  }

  function navigateMonth(delta: number) {
    let newMonth = month + delta
    let newYear = year
    if (newMonth > 12) { newMonth = 1; newYear++ }
    if (newMonth < 1) { newMonth = 12; newYear-- }
    router.push(`/calendar?year=${newYear}&month=${newMonth}`)
  }

  function handleDayClick(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedDate(dateStr)
  }

  function handleQuickAdd(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setQuickAddDate(dateStr)
    setExpenseOpen(true)
  }

  const selectedDateExpenses = selectedDate ? expensesByDate.get(selectedDate) ?? [] : []
  const selectedDateEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : []

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg hover:bg-muted">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">{year}년 {month}월</h1>
            <p className="text-xs text-muted-foreground">
              총 ₩{formatKRW(monthStats.totalSpent)} · 무지출 {monthStats.zeroDayCount}일
            </p>
          </div>
          <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-muted">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="px-3 py-3">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 mb-1">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div
              key={d}
              className={cn(
                "text-xs font-medium text-center py-1",
                i === 0 && "text-red-500",
                i === 6 && "text-blue-500",
                !(i === 0 || i === 6) && "text-muted-foreground"
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayOfWeek = (firstDayOfWeek + i) % 7
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const dayExpenses = expensesByDate.get(dateStr) ?? []
            const dayEvents = eventsByDate.get(dateStr) ?? []
            const totalAmount = dayExpenses.reduce((s, e) => s + e.amount, 0)
            const isToday = isCurrentMonth && day === today.getDate()
            const isPast = !isCurrentMonth || day < today.getDate()
            const isZeroDay = isPast && dayExpenses.length === 0 && day > 0
            const isOverBudget = dailyBudgetLimit > 0 && totalAmount > dailyBudgetLimit
            const isSelected = selectedDate === dateStr

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                onDoubleClick={() => handleQuickAdd(day)}
                className={cn(
                  "relative min-h-[72px] rounded-lg p-1 text-left transition-all border",
                  "flex flex-col items-start",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : isToday
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:border-border hover:bg-muted/50",
                  isOverBudget && !isSelected && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20",
                )}
              >
                {/* Day number */}
                <span className={cn(
                  "text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-0.5",
                  isToday && "bg-primary text-primary-foreground",
                  dayOfWeek === 0 && !isToday && "text-red-500",
                  dayOfWeek === 6 && !isToday && "text-blue-500",
                )}>
                  {day}
                </span>

                {/* Zero day badge */}
                {isZeroDay && (
                  <span className="text-[9px] text-emerald-600 font-medium leading-tight">무지출</span>
                )}

                {/* Expense amount */}
                {totalAmount > 0 && (
                  <span className={cn(
                    "text-[10px] font-medium leading-tight tabular-nums",
                    isOverBudget ? "text-red-600" : "text-foreground"
                  )}>
                    {formatKRW(totalAmount)}
                  </span>
                )}

                {/* Events indicators */}
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 2).map(ev => (
                      <span key={ev.id} className="w-1.5 h-1.5 rounded-full bg-amber-500" title={ev.title} />
                    ))}
                  </div>
                )}

                {/* Category dots */}
                {dayExpenses.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap">
                    {dayExpenses.slice(0, 3).map(e => (
                      <span
                        key={e.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: e.categories?.color ?? "#94a3b8" }}
                      />
                    ))}
                    {dayExpenses.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">+{dayExpenses.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 특별일정</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> 예산초과</span>
          <span className="text-emerald-600 font-medium">무지출</span>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => {
          const today = new Date()
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(Math.min(today.getDate(), daysInMonth)).padStart(2, "0")}`
          setQuickAddDate(dateStr)
          setExpenseOpen(true)
        }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] right-4 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
        aria-label="지출 입력"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Day detail sheet */}
      {selectedDate && (
        <DayDetailSheet
          date={selectedDate}
          expenses={selectedDateExpenses}
          events={selectedDateEvents}
          dailyBudgetLimit={dailyBudgetLimit}
          onClose={() => setSelectedDate(null)}
          onAddExpense={() => {
            setEditingExpense(null)
            setQuickAddDate(selectedDate)
            setExpenseOpen(true)
          }}
          onEditExpense={(expense) => {
            setEditingExpense(expense)
            setQuickAddDate(null)
            setExpenseOpen(true)
          }}
          onRefresh={() => router.refresh()}
        />
      )}

      {/* Expense input / edit modal */}
      <ExpenseInputModal
        open={expenseOpen}
        onClose={() => { setExpenseOpen(false); setQuickAddDate(null); setEditingExpense(null) }}
        categories={categories}
        paymentMethods={paymentMethods}
        members={members}
        familyGroupId={familyGroupId}
        currentUserId={currentUserId}
        initialDate={quickAddDate ?? undefined}
        editingExpense={editingExpense}
        onSuccess={() => {
          setExpenseOpen(false)
          setQuickAddDate(null)
          setEditingExpense(null)
          router.refresh()
        }}
      />
    </div>
  )
}
