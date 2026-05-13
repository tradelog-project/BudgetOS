import { createClient } from "./server"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const familyGroupId: string | null =
    user.user_metadata?.family_group_id ?? null

  if (!familyGroupId) redirect("/setup")

  return { supabase, user, familyGroupId }
}
