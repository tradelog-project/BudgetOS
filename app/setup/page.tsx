"use client"

import { useState } from "react"
import { Users, KeyRound, PlusCircle } from "lucide-react"
import { createFamilyGroup, joinFamilyGroup } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SetupPage() {
  const [tab, setTab] = useState<"create" | "join">("create")
  const [groupName, setGroupName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleCreate() {
    if (!groupName.trim()) { setError("그룹 이름을 입력해주세요."); return }
    setLoading(true)
    setError("")
    const result = await createFamilyGroup(groupName.trim())
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) { setError("초대 코드를 입력해주세요."); return }
    setLoading(true)
    setError("")
    const result = await joinFamilyGroup(inviteCode.trim())
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground">
            <Users className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">가족 그룹 설정</h1>
          <p className="text-sm text-muted-foreground">새 그룹을 만들거나 기존 그룹에 참여하세요</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setTab("create")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "create" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
            }`}
          >
            <PlusCircle className="inline h-4 w-4 mr-1.5" />
            새 그룹 만들기
          </button>
          <button
            onClick={() => setTab("join")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "join" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
            }`}
          >
            <KeyRound className="inline h-4 w-4 mr-1.5" />
            초대 코드 입력
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {tab === "create" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">그룹 이름</Label>
              <Input
                id="group-name"
                placeholder="예: 홍길동 가족"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="w-full h-11 text-base"
              disabled={loading}
              onClick={handleCreate}
            >
              {loading ? "생성 중..." : "그룹 만들기"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code">초대 코드</Label>
              <Input
                id="invite-code"
                placeholder="8자리 코드 입력"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                maxLength={8}
                className="text-center text-lg tracking-widest uppercase font-mono"
              />
            </div>
            <Button
              type="button"
              className="w-full h-11 text-base"
              disabled={loading}
              onClick={handleJoin}
            >
              {loading ? "참여 중..." : "그룹 참여"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
