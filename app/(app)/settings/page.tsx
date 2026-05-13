export const dynamic = 'force-dynamic'

import { requireAuth } from "@/lib/supabase/auth"
import { getCurrentYearMonth } from "@/lib/utils"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const { supabase, user, familyGroupId } = await requireAuth()

  const params = await searchParams
  const { year: defaultYear, month: defaultMonth } = getCurrentYearMonth()
  const year = parseInt(params.year ?? String(defaultYear))
  const month = parseInt(params.month ?? String(defaultMonth))

  const [{ data: incomeRecords }, { data: savingsData }, { data: budget }, { data: familyGroup }] = await Promise.all([
    supabase.from("income_records").select("*").eq("family_group_id", familyGroupId).eq("year", year).eq("month", month).order("created_at"),
    supabase.from("savings").select("*").eq("family_group_id", familyGroupId).eq("year", year).eq("month", month).order("created_at"),
    supabase.from("monthly_budgets").select("*").eq("family_group_id", familyGroupId).eq("year", year).eq("month", month).single(),
    supabase.from("family_groups").select("*").eq("id", familyGroupId).single(),
  ])

  return (
    <SettingsClient
      year={year} month={month}
      familyGroupId={familyGroupId}
      currentUserId={user.id}
      incomeRecords={incomeRecords ?? []}
      savingsData={savingsData ?? []}
      budget={budget}
      profile={{ id: user.id, name: user.user_metadata?.name ?? "", email: user.email ?? "", role: "owner" }}
      familyGroup={familyGroup ?? { name: "내 가족", invite_code: "" }}
    />
  )
}
