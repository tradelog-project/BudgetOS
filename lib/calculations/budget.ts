import { getDaysInMonth } from 'date-fns'

export function formatInput(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return new Intl.NumberFormat('ko-KR').format(parseInt(num, 10))
}

export function parseAmount(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0
}
import type { BudgetStatus, DashboardData, SpecialEvent } from '@/types'

export function calculateBudgetStatus(usageRate: number): BudgetStatus {
  if (usageRate >= 100) return 'DANGER'
  if (usageRate >= 80) return 'WARNING'
  return 'SAFE'
}

export function calculateDashboard(params: {
  year: number
  month: number
  totalIncome: number
  totalFixedCosts: number
  totalSavings: number
  variableBudget: number
  totalVariableSpent: number
  upcomingSpecialEvents: SpecialEvent[]
  zeroDayCount: number
}): DashboardData {
  const {
    year, month, totalIncome, totalFixedCosts, totalSavings,
    variableBudget, totalVariableSpent, upcomingSpecialEvents, zeroDayCount
  } = params

  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()

  const isCurrentMonth = year === currentYear && month === currentMonth
  const totalDays = getDaysInMonth(new Date(year, month - 1))

  let daysElapsed: number
  let remainingDays: number

  if (isCurrentMonth) {
    daysElapsed = today.getDate()
    remainingDays = totalDays - today.getDate() + 1 // include today
  } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
    // past month
    daysElapsed = totalDays
    remainingDays = 0
  } else {
    // future month
    daysElapsed = 0
    remainingDays = totalDays
  }

  const remainingBudget = variableBudget - totalVariableSpent

  // Special events this month (not completed, with expected amount)
  const upcomingSpecialEventsTotal = upcomingSpecialEvents
    .filter(e => !e.is_completed)
    .reduce((sum, e) => sum + e.expected_amount, 0)

  const nearestEvent = upcomingSpecialEvents
    .filter(e => !e.is_completed)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))[0] ?? null

  // Daily reserve needed = total special event amount / remaining days
  const dailyReserveNeeded = remainingDays > 0
    ? Math.ceil(upcomingSpecialEventsTotal / remainingDays)
    : 0

  // Today's allowance (base)
  const todayAllowance = remainingDays > 0
    ? Math.max(0, Math.floor(remainingBudget / remainingDays))
    : 0

  // Adjusted allowance = (remaining - upcoming events) / remaining days
  const adjustedTodayAllowance = remainingDays > 0
    ? Math.max(0, Math.floor((remainingBudget - upcomingSpecialEventsTotal) / remainingDays))
    : 0

  // Projections
  const projectedMonthlySpend = daysElapsed > 0
    ? Math.round((totalVariableSpent / daysElapsed) * totalDays)
    : 0

  const projectedBalance = variableBudget - projectedMonthlySpend

  const usageRate = variableBudget > 0
    ? Math.min(Math.round((totalVariableSpent / variableBudget) * 100), 999)
    : 0

  const status = calculateBudgetStatus(usageRate)

  return {
    totalIncome,
    totalFixedCosts,
    totalSavings,
    variableBudget,
    totalVariableSpent,
    remainingBudget,
    todayAllowance,
    remainingDays,
    daysElapsed,
    projectedMonthlySpend,
    projectedBalance,
    upcomingSpecialEventsTotal,
    nearestEvent,
    dailyReserveNeeded,
    adjustedTodayAllowance,
    status,
    usageRate,
    zeroDayCount,
  }
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

export function formatKRWShort(amount: number): string {
  if (Math.abs(amount) >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(1)}억`
  }
  if (Math.abs(amount) >= 10_000) {
    return `${Math.round(amount / 10_000)}만`
  }
  return new Intl.NumberFormat('ko-KR').format(amount)
}

export function getDailyBudgetLimit(variableBudget: number, days: number): number {
  if (days <= 0) return 0
  return Math.floor(variableBudget / days)
}
