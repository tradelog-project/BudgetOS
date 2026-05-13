export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================
// Database row types
// ============================================================
export interface Profile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  family_group_id: string | null
  role: 'owner' | 'member'
  created_at: string
  updated_at: string
}

export interface FamilyGroup {
  id: string
  name: string
  created_by: string
  invite_code: string
  created_at: string
}

export interface Category {
  id: string
  family_group_id: string | null
  name: string
  icon: string
  color: string
  type: 'fixed' | 'variable' | 'income' | 'savings'
  is_default: boolean
  sort_order: number
  created_at: string
}

export interface PaymentMethod {
  id: string
  family_group_id: string
  name: string
  type: 'cash' | 'credit_card' | 'debit_card' | 'bank_account'
  bank_name: string | null
  last_four: string | null
  color: string
  billing_day: number | null
  is_active: boolean
  created_at: string
}

export interface MonthlyBudget {
  id: string
  family_group_id: string
  year: number
  month: number
  variable_budget: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BudgetCategory {
  id: string
  family_group_id: string
  category_id: string
  year: number
  month: number
  budget_amount: number
  created_at: string
}

export interface IncomeRecord {
  id: string
  family_group_id: string
  member_id: string
  year: number
  month: number
  amount: number
  type: 'salary' | 'side_income' | 'other'
  description: string | null
  created_at: string
}

export interface Savings {
  id: string
  family_group_id: string
  name: string
  amount: number
  year: number
  month: number
  category: 'housing' | 'emergency' | 'investment' | 'education' | 'general' | 'other'
  notes: string | null
  created_at: string
}

export interface FixedCost {
  id: string
  family_group_id: string
  name: string
  amount: number
  category_id: string | null
  payment_method_id: string | null
  payment_day: number | null
  is_active: boolean
  start_date: string | null
  end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joins
  category?: Category
  payment_method?: PaymentMethod
}

export interface ExpenseRecord {
  id: string
  family_group_id: string
  member_id: string
  date: string
  amount: number
  category_id: string | null
  payment_method_id: string | null
  memo: string | null
  is_zero_day_candidate: boolean
  created_at: string
  updated_at: string
  // joins
  category?: Category
  payment_method?: PaymentMethod
  member?: Profile
}

export type SpecialEventCategory =
  | 'birthday' | 'family_gathering' | 'travel' | 'hospital'
  | 'school_event' | 'holiday' | 'condolence' | 'car_insurance'
  | 'tax' | 'tuition' | 'other'

export interface SpecialEvent {
  id: string
  family_group_id: string
  member_id: string | null
  title: string
  event_date: string
  expected_amount: number
  category: SpecialEventCategory
  payment_method_id: string | null
  memo: string | null
  is_recurring: boolean
  recurrence_pattern: 'yearly' | 'monthly' | 'quarterly' | null
  is_completed: boolean
  actual_amount: number | null
  created_at: string
  updated_at: string
  // joins
  payment_method?: PaymentMethod
  member?: Profile
}

// ============================================================
// Dashboard calculation types
// ============================================================
export type BudgetStatus = 'SAFE' | 'WARNING' | 'DANGER'

export interface DashboardData {
  // Income
  totalIncome: number
  // Fixed
  totalFixedCosts: number
  totalSavings: number
  // Variable budget
  variableBudget: number
  // Actual spending
  totalVariableSpent: number
  // Remaining
  remainingBudget: number
  // Daily
  todayAllowance: number
  remainingDays: number
  daysElapsed: number
  // Projections
  projectedMonthlySpend: number
  projectedBalance: number
  // Special events
  upcomingSpecialEventsTotal: number
  nearestEvent: SpecialEvent | null
  dailyReserveNeeded: number
  adjustedTodayAllowance: number
  // Status
  status: BudgetStatus
  usageRate: number
  // Zero spending days
  zeroDayCount: number
}

export interface CalendarDayData {
  date: string
  totalAmount: number
  expenses: ExpenseRecord[]
  events: SpecialEvent[]
  isZeroDay: boolean
  isOverBudget: boolean
}

// ============================================================
// Form types
// ============================================================
export interface ExpenseFormData {
  date: string
  amount: string
  category_id: string
  payment_method_id: string
  memo: string
}

export interface FixedCostFormData {
  name: string
  amount: string
  category_id: string
  payment_method_id: string
  payment_day: string
  notes: string
}

export interface SpecialEventFormData {
  title: string
  event_date: string
  expected_amount: string
  category: SpecialEventCategory
  payment_method_id: string
  memo: string
  is_recurring: boolean
  recurrence_pattern: 'yearly' | 'monthly' | 'quarterly' | ''
}
