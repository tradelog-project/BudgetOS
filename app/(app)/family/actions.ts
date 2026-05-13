"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateGroupName(groupId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "로그인이 필요합니다." }

  const { error } = await supabase
    .from("family_groups")
    .update({ name: name.trim() })
    .eq("id", groupId)

  if (error) return { error: "저장 실패: " + error.message }

  revalidatePath("/family")
  return { success: true }
}
