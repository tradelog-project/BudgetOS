"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ToggleLeft, ToggleRight, CreditCard, Banknote, Building } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { PaymentMethod } from "@/types"
import { paymentMethodTypeLabel } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectNative } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const TYPE_COLORS = ["#6366f1", "#ec4899", "#f97316", "#22c55e", "#06b6d4", "#8b5cf6", "#f59e0b"]

interface Props {
  paymentMethods: PaymentMethod[]
  familyGroupId: string
}

export function PaymentMethodsClient({ paymentMethods: initial, familyGroupId }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [type, setType] = useState<string>("credit_card")
  const [bankName, setBankName] = useState("")
  const [lastFour, setLastFour] = useState("")
  const [billingDay, setBillingDay] = useState("")
  const [color, setColor] = useState(TYPE_COLORS[0])
  const [loading, setLoading] = useState(false)

  function openAdd() {
    setEditingId(null)
    setName(""); setType("credit_card"); setBankName(""); setLastFour(""); setBillingDay(""); setColor(TYPE_COLORS[0])
    setModalOpen(true)
  }

  function openEdit(pm: PaymentMethod) {
    setEditingId(pm.id)
    setName(pm.name); setType(pm.type); setBankName(pm.bank_name ?? "")
    setLastFour(pm.last_four ?? ""); setBillingDay(pm.billing_day?.toString() ?? ""); setColor(pm.color)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name) { toast.error("이름을 입력하세요."); return }
    setLoading(true)
    const supabase = createClient()
    const payload = {
      family_group_id: familyGroupId,
      name, type: type as PaymentMethod["type"],
      bank_name: bankName || null,
      last_four: lastFour || null,
      billing_day: billingDay ? parseInt(billingDay) : null,
      color,
    }
    const { error } = editingId
      ? await supabase.from("payment_methods").update(payload).eq("id", editingId)
      : await supabase.from("payment_methods").insert(payload)
    if (error) { toast.error("저장 실패: " + error.message) }
    else { toast.success("저장되었습니다"); setModalOpen(false); router.refresh() }
    setLoading(false)
  }

  async function handleToggle(pm: PaymentMethod) {
    const supabase = createClient()
    await supabase.from("payment_methods").update({ is_active: !pm.is_active }).eq("id", pm.id)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("삭제하시겠습니까?")) return
    const supabase = createClient()
    await supabase.from("payment_methods").delete().eq("id", id)
    toast.success("삭제되었습니다")
    router.refresh()
  }

  const TypeIcon = ({ type }: { type: string }) => {
    if (type === "cash") return <Banknote className="h-5 w-5" />
    if (type === "bank_account") return <Building className="h-5 w-5" />
    return <CreditCard className="h-5 w-5" />
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">결제수단 관리</h1>
          <Button onClick={openAdd} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> 추가
          </Button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-2">
        {initial.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            결제수단을 추가해주세요
          </div>
        )}
        {initial.map(pm => (
          <div
            key={pm.id}
            className={cn("flex items-center gap-3 rounded-xl border border-border bg-card p-3", !pm.is_active && "opacity-50")}
          >
            <button onClick={() => openEdit(pm)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: pm.color }}
              >
                <TypeIcon type={pm.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{pm.name}</p>
                <p className="text-xs text-muted-foreground">
                  {paymentMethodTypeLabel(pm.type)}
                  {pm.bank_name && ` · ${pm.bank_name}`}
                  {pm.last_four && ` · ****${pm.last_four}`}
                  {pm.billing_day && ` · ${pm.billing_day}일 결제`}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => handleToggle(pm)} className="p-1.5 rounded-lg hover:bg-muted">
                {pm.is_active ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
              </button>
              <button onClick={() => handleDelete(pm.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={v => !v && setModalOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "결제수단 수정" : "결제수단 추가"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>이름</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="예: 하나카드" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>종류</Label>
                <SelectNative value={type} onChange={e => setType(e.target.value)}>
                  <option value="credit_card">신용카드</option>
                  <option value="debit_card">체크카드</option>
                  <option value="cash">현금</option>
                  <option value="bank_account">계좌이체</option>
                </SelectNative>
              </div>
              <div className="space-y-1.5">
                <Label>결제일</Label>
                <Input type="number" min={1} max={31} value={billingDay} onChange={e => setBillingDay(e.target.value)} placeholder="매월 N일" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>은행/카드사</Label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="예: 하나" />
              </div>
              <div className="space-y-1.5">
                <Label>끝 4자리</Label>
                <Input value={lastFour} onChange={e => setLastFour(e.target.value)} maxLength={4} placeholder="1234" inputMode="numeric" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>색상</Label>
              <div className="flex gap-2 flex-wrap">
                {TYPE_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={cn("w-8 h-8 rounded-full transition-all", color === c && "ring-2 ring-offset-2 ring-primary")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>취소</Button>
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? "저장 중..." : "저장"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
