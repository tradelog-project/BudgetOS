export const dynamic = 'force-dynamic'

import { requireAuth } from "@/lib/supabase/auth"
import { getCurrentYearMonth } from "@/lib/utils"
import { getDaysInMonth } from "date-fns"
import { CalendarClient } from "@/components/calendar/calendar-client"

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const { supabase, user, familyGroupId } = await requireAuth()

  const params = await searchParams
  const { year: defaultYear, month: defaultMonth } = getCurrentYearMonth()
  const year = parseInt(params.year ?? String(defaultYear))
  const month = parseInt(params.month ?? String(defaultMonth))

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${getDaysInMonth(new Date(year, month - 1))}`

  const [
    { data: expenses },
    { data: specialEvents },
    { data: categories },
    { data: paymentMethods },
    { data: members },
    { data: budget },
  ] = await Promise.all([
    supabase.from("expense_records").select("*, categories(*), payment_methods(*), profiles(name)").eq("family_group_id", familyGroupId).gte("date", monthStart).lte("date", monthEnd).order("date"),
    supabase.from("special_events").select("*").eq("family_group_id", familyGroupId).gte("event_date", monthStart).lte("event_date", monthEnd),
    supabase.from("categories").select("*").or(`family_group_id.eq.${familyGroupId},is_default.eq.true`).order("sort_order"),
    supabase.from("payment_methods").select("*").eq("family_group_id", familyGroupId).eq("is_active", true),
    supabase.from("profiles").select("id, name, avatar_url").eq("family_group_id", familyGroupId),
    supabase.from("monthly_budgets").select("*").eq("family_group_id", familyGroupId).eq("year", year).eq("month", month).single(),
  ])

  const variableBudget = budget?.variable_budget ?? 0
  const daysInMonth = getDaysInMonth(new Date(year, month - 1))
  const dailyBudgetLimit = variableBudget > 0 ? Math.floor(variableBudget / daysInMonth) : 0

  return (
    <CalendarClient
      year={year} month={month}
      expenses={expenses ?? []}
      specialEvents={specialEvents ?? []}
      categories={categories ?? []}
      paymentMethods={paymentMethods ?? []}
      members={members ?? []}
      familyGroupId={familyGroupId}
      currentUserId={user.id}
      dailyBudgetLimit={dailyBudgetLimit}
    />
  )
}
