"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Check, Users, Crown, Trash2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { updateGroupName } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Member {
  id: string
  name: string
  email: string
  role: string
  avatar_url: string | null
  created_at: string
}

interface Props {
  currentUser: { id: string; role: string }
  familyGroup: { id?: string; name: string; invite_code: string }
  members: Member[]
}

export function FamilyClient({ currentUser, familyGroup, members }: Props) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [groupName, setGroupName] = useState(familyGroup.name)
  const [saving, setSaving] = useState(false)

  async function copyInviteCode() {
    await navigator.clipboard.writeText(familyGroup.invite_code)
    setCopied(true)
    toast.success("초대 코드가 복사되었습니다!")
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveName() {
    if (!groupName.trim()) { toast.error("그룹 이름을 입력해주세요."); return }
    if (groupName.trim() === familyGroup.name) { setEditingName(false); return }
    if (!familyGroup.id) { toast.error("그룹 ID를 찾을 수 없습니다."); return }
    setSaving(true)
    const result = await updateGroupName(familyGroup.id, groupName.trim())
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("그룹명이 변경되었습니다!")
      setEditingName(false)
      router.refresh()
    }
    setSaving(false)
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("이 멤버를 그룹에서 제거하시겠습니까?")) return
    const supabase = createClient()
    await supabase.from("profiles").update({ family_group_id: null, role: "member" }).eq("id", memberId)
    toast.success("멤버가 제거되었습니다")
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold">가족 설정</h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Group info */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {/* Group name */}
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground shrink-0" />
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="h-8 text-sm font-semibold"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSaveName()
                    if (e.key === "Escape") { setGroupName(familyGroup.name); setEditingName(false) }
                  }}
                />
                <Button type="button" size="sm" className="h-8 px-3 shrink-0" disabled={saving} onClick={handleSaveName}>
                  {saving ? "저장 중" : "저장"}
                </Button>
                <button
                  type="button"
                  onClick={() => { setGroupName(familyGroup.name); setEditingName(false) }}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <div>
                  <p className="text-sm font-semibold">{familyGroup.name}</p>
                  <p className="text-xs text-muted-foreground">가족 그룹</p>
                </div>
                {currentUser.role === "owner" && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="ml-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="그룹명 수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Invite code */}
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground mb-1">초대 코드 (가족에게 공유하세요)</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black tracking-widest text-primary font-mono">
                {familyGroup.invite_code}
              </p>
              <button
                onClick={copyInviteCode}
                className="flex items-center gap-1.5 text-sm text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          </div>
        </div>

        {/* Members list */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">구성원 ({members.length}명)</h2>
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium">{member.name}</p>
                    {member.role === "owner" && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                    {member.id === currentUser.id && <span className="text-xs text-muted-foreground">(나)</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                {currentUser.role === "owner" && member.id !== currentUser.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {currentUser.role !== "owner" && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={async () => {
              if (!confirm("그룹을 나가시겠습니까?")) return
              const supabase = createClient()
              await supabase.from("profiles").update({ family_group_id: null }).eq("id", currentUser.id)
              router.push("/setup")
            }}
          >
            그룹 나가기
          </Button>
        )}
      </div>
    </div>
  )
}
