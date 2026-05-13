export const dynamic = 'force-dynamic'

import { requireAuth } from "@/lib/supabase/auth"
import { FamilyClient } from "./family-client"

export default async function FamilyPage() {
  const { supabase, user, familyGroupId } = await requireAuth()

  const [{ data: familyGroup }, { data: members }] = await Promise.all([
    supabase.from("family_groups").select("*").eq("id", familyGroupId).single(),
    supabase.from("profiles").select("id, name, email, role, avatar_url, created_at").eq("family_group_id", familyGroupId).order("created_at"),
  ])

  return (
    <FamilyClient
      currentUser={{ id: user.id, role: members?.find(m => m.id === user.id)?.role ?? "member" }}
      familyGroup={familyGroup ?? { name: "내 가족", invite_code: "" }}
      members={members ?? []}
    />
  )
}
