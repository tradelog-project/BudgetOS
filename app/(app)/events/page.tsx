export const dynamic = 'force-dynamic'

import { requireAuth } from "@/lib/supabase/auth"
import { getTodayString } from "@/lib/utils"
import { EventsClient } from "./events-client"

export default async function EventsPage() {
  const { supabase, user, familyGroupId } = await requireAuth()
  const today = getTodayString()

  const [{ data: upcoming }, { data: completed }, { data: paymentMethods }] = await Promise.all([
    supabase.from("special_events").select("*").eq("family_group_id", familyGroupId).eq("is_completed", false).gte("event_date", today).order("event_date"),
    supabase.from("special_events").select("*").eq("family_group_id", familyGroupId).or(`is_completed.eq.true,event_date.lt.${today}`).order("event_date", { ascending: false }).limit(10),
    supabase.from("payment_methods").select("*").eq("family_group_id", familyGroupId).eq("is_active", true),
  ])

  return (
    <EventsClient
      upcoming={upcoming ?? []}
      completed={completed ?? []}
      paymentMethods={paymentMethods ?? []}
      familyGroupId={familyGroupId}
      currentUserId={user.id}
    />
  )
}
