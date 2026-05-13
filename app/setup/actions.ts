"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function createFamilyGroup(groupName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "로그인이 필요합니다." }

  // 그룹 생성
  const { data: group, error: groupError } = await supabase
    .from("family_groups")
    .insert({ name: groupName, created_by: user.id })
    .select()
    .single()

  if (groupError) return { error: "그룹 생성 실패: " + groupError.message }

  // 프로필 업데이트
  const { data: updatedProfile, error: profileError } = await supabase
    .from("profiles")
    .update({ family_group_id: group.id, role: "owner" })
    .eq("id", user.id)
    .select()

  console.log("[setup] user.id:", user.id)
  console.log("[setup] group.id:", group.id)
  console.log("[setup] updatedProfile:", JSON.stringify(updatedProfile))
  console.log("[setup] profileError:", profileError)

  if (profileError) return { error: "프로필 업데이트 실패: " + profileError.message }

  // user_metadata에도 저장해서 JWT에서 바로 읽을 수 있게 함
  await supabase.auth.updateUser({
    data: { family_group_id: group.id }
  })

  redirect("/")
}

export async function joinFamilyGroup(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "로그인이 필요합니다." }

  const { data: group, error: groupError } = await supabase
    .from("family_groups")
    .select()
    .eq("invite_code", inviteCode.toUpperCase().trim())
    .single()

  if (groupError || !group) return { error: "초대 코드를 찾을 수 없습니다." }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ family_group_id: group.id, role: "member" })
    .eq("id", user.id)

  if (profileError) return { error: "그룹 참여 실패: " + profileError.message }

  redirect("/")
}
