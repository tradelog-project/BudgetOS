export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { calculateDashboard } from "@/lib/calculations/budget"
import { getCurrentYearMonth } from "@/lib/utils"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile?.family_group_id) redirect("/setup")

  const { data: familyGroupData } = await supabase
    .from("family_groups")
    .select("*")
    .eq("id", profile.family_group_id)
    .single()

  const familyGroupId = profile.family_group_id
  const params = await searchParams
  const { year: defaultYear, month: defaultMonth } = getCurrentYearMonth()
  const year = parseInt(params.year ?? String(defaultYear))
  const month = parseInt(params.month ?? String(defaultMonth))
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]

  // Parallel data fetching
  const [
    { data: incomeRecords },
    { data: fixedCosts },
    { data: savingsData },
    { data: budget },
    { data: expenseRecords },
    { data: specialEvents },
    { data: categories },
    { data: paymentMethods },
    { data: members },
  ] = await Promise.all([
    supabase.from("income_records").select("*").eq("family_group_id", familyGroupId).eq("year", year).eq("month", month),
    supabase.from("fixed_costs").select("*, categories(*), payment_methods(*)").eq("family_group_id", familyGroupId).eq("is_active", true),
    supabase.from("savings").select("*").eq("family_group_id", familyGroupId).eq("year", year).eq("month", month),
    supabase.from("monthly_budgets").select("*").eq("family_group_id", familyGroupId).eq("year", year).eq("month", month).single(),
    supabase.from("expense_records").select("*, categories(*), payment_methods(*), profiles(name, avatar_url)").eq("family_group_id", familyGroupId).gte("date", `${year}-${String(month).padStart(2, "0")}-01`).lte("date", `${year}-${String(month).padStart(2, "0")}-31`).order("date", { ascending: false }),
    supabase.from("special_events").select("*").eq("family_group_id", familyGroupId).gte("event_date", todayStr).lte("event_date", `${year}-${String(month).padStart(2, "0")}-31`).eq("is_completed", false),
    supabase.from("categories").select("*").or(`family_group_id.eq.${familyGroupId},is_default.eq.true`).order("sort_order"),
    supabase.from("payment_methods").select("*").eq("family_group_id", familyGroupId).eq("is_active", true),
    supabase.from("profiles").select("id, name, avatar_url").eq("family_group_id", familyGroupId),
  ])

  const totalIncome = (incomeRecords ?? []).reduce((s, r) => s + r.amount, 0)
  const totalFixedCosts = (fixedCosts ?? []).reduce((s, r) => s + r.amount, 0)
  const totalSavings = (savingsData ?? []).reduce((s, r) => s + r.amount, 0)
  const variableBudget = budget?.variable_budget ?? 0
  const totalVariableSpent = (expenseRecords ?? []).reduce((s, r) => s + r.amount, 0)

  // Calculate zero-spending days in current month
  const spentDates = new Set((expenseRecords ?? []).map(e => e.date))
  const daysElapsed = today.getDate()
  let zeroDayCount = 0
  for (let d = 1; d < daysElapsed; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    if (!spentDates.has(dateStr)) zeroDayCount++
  }

  const dashboardData = calculateDashboard({
    year, month,
    totalIncome,
    totalFixedCosts,
    totalSavings,
    variableBudget,
    totalVariableSpent,
    upcomingSpecialEvents: specialEvents ?? [],
    zeroDayCount,
  })

  return (
    <DashboardClient
      dashboardData={dashboardData}
      year={year}
      month={month}
      profile={profile}
      familyGroup={familyGroupData ?? { name: "내 가족", invite_code: "" }}
      recentExpenses={(expenseRecords ?? []).slice(0, 5)}
      categories={categories ?? []}
      paymentMethods={paymentMethods ?? []}
      members={members ?? []}
      budget={budget}
      fixedCosts={fixedCosts ?? []}
      savingsData={savingsData ?? []}
      incomeRecords={incomeRecords ?? []}
    />
  )
}
