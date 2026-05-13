export const dynamic = 'force-dynamic'

import { requireAuth } from "@/lib/supabase/auth"
import { FixedCostsClient } from "./fixed-costs-client"

export default async function FixedCostsPage() {
  const { supabase, familyGroupId } = await requireAuth()

  const [{ data: fixedCosts }, { data: categories }, { data: paymentMethods }] = await Promise.all([
    supabase.from("fixed_costs").select("*, categories(*), payment_methods(*)").eq("family_group_id", familyGroupId).order("is_active", { ascending: false }),
    supabase.from("categories").select("*").or(`family_group_id.eq.${familyGroupId},is_default.eq.true`).eq("type", "fixed").order("sort_order"),
    supabase.from("payment_methods").select("*").eq("family_group_id", familyGroupId).eq("is_active", true),
  ])

  return (
    <FixedCostsClient
      fixedCosts={fixedCosts ?? []}
      categories={categories ?? []}
      paymentMethods={paymentMethods ?? []}
      familyGroupId={familyGroupId}
    />
  )
}
