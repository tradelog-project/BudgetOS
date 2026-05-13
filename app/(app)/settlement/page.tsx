export const dynamic = 'force-dynamic'

import { requireAuth } from "@/lib/supabase/auth"
import { getCurrentYearMonth } from "@/lib/utils"
import { getDaysInMonth } from "date-fns"
import { SettlementClient } from "./settlement-client"

export default async function SettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const { supabase, familyGroupId } = await requireAuth()

  const params = await searchParams
  const { year: defaultYear, month: defaultMonth } = getCurrentYearMonth()
  const year = parseInt(params.year ?? String(defaultYear))
  const month = parseInt(params.month ?? String(defaultMonth))

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${getDaysInMonth(new Date(year, month - 1))}`

  const [
    { data: expenses },
    { data: incomeRecords },
    { data: fixedCosts },
    { data: savingsData },
    { data: budget },
    { data: budgetCategories },
    { data: categories },
  ] = await Promise.all([
    supabase.from("expense_records").select("*, categories(*)").eq("family_group_id", familyGroupId).gte("date", monthStart).lte("date", monthEnd),
    supabase.from("income_records").select("*").eq("family_group_id", familyGroupId).eq("year", year).eq("month", month),
    supabase.from("fixed_costs").select("*, categories(*)").eq("family_group_id", familyGroupId).eq("is_active", true),
    supabase.from("savings").select("*").eq("family_group_id", familyGroupId).eq("year", year).eq("month", month),
    supabase.from("monthly_budgets").select("*").eq("family_group_id", familyGroupId).eq("year", year).eq("month", month).single(),
    supabase.from("budget_categories").select("*, categories(*)").eq("family_group_id", familyGroupId).eq("year", year).eq("month", month),
    supabase.from("categories").select("*").or(`family_group_id.eq.${familyGroupId},is_default.eq.true`).order("sort_order"),
  ])

  return (
    <SettlementClient
      year={year} month={month}
      expenses={expenses ?? []}
      incomeRecords={incomeRecords ?? []}
      fixedCosts={fixedCosts ?? []}
      savingsData={savingsData ?? []}
      budget={budget}
      budgetCategories={budgetCategories ?? []}
      categories={categories ?? []}
      familyGroupId={familyGroupId}
    />
  )
}
