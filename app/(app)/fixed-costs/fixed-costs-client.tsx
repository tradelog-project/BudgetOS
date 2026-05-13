"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Category, FixedCost, PaymentMethod } from "@/types"
import { formatKRW, formatInput, parseAmount } from "@/lib/calculations/budget"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectNative } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Props {
  fixedCosts: (FixedCost & { categories?: Category; payment_methods?: PaymentMethod })[]
  categories: Category[]
  paymentMethods: PaymentMethod[]
  familyGroupId: string
}

export function FixedCostsClient({ fixedCosts: initialCosts, categories, paymentMethods, familyGroupId }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [paymentMethodId, setPaymentMethodId] = useState("")
  const [paymentDay, setPaymentDay] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const totalActive = initialCosts.filter(c => c.is_active).reduce((s, c) => s + c.amount, 0)

  function openAdd() {
    setEditingId(null)
    setName(""); setAmount(""); setCategoryId(""); setPaymentMethodId(""); setPaymentDay(""); setNotes("")
    setModalOpen(true)
  }

  function openEdit(fc: FixedCost) {
    setEditingId(fc.id)
    setName(fc.name)
    setAmount(fc.amount.toLocaleString("ko-KR"))
    setCategoryId(fc.category_id ?? "")
    setPaymentMethodId(fc.payment_method_id ?? "")
    setPaymentDay(fc.payment_day?.toString() ?? "")
    setNotes(fc.notes ?? "")
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = parseAmount(amount)
    if (!name || !num) { toast.error("이름과 금액을 입력하세요."); return }
    setLoading(true)
    const supabase = createClient()
    const payload = {
      family_group_id: familyGroupId,
      name,
      amount: num,
      category_id: categoryId || null,
      payment_method_id: paymentMethodId || null,
      payment_day: paymentDay ? parseInt(paymentDay) : null,
      notes: notes || null,
    }

    const { error } = editingId
      ? await supabase.from("fixed_costs").update(payload).eq("id", editingId)
      : await supabase.from("fixed_costs").insert(payload)

    if (error) { toast.error("저장 실패: " + error.message) }
    else { toast.success(editingId ? "수정되었습니다" : "추가되었습니다"); setModalOpen(false); router.refresh() }
    setLoading(false)
  }

  async function handleToggle(fc: FixedCost) {
    const supabase = createClient()
    await supabase.from("fixed_costs").update({ is_active: !fc.is_active }).eq("id", fc.id)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("삭제하시겠습니까?")) return
    const supabase = createClient()
    await supabase.from("fixed_costs").delete().eq("id", id)
    toast.success("삭제되었습니다")
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">고정비 관리</h1>
            <p className="text-xs text-muted-foreground">월 합계: ₩{formatKRW(totalActive)}</p>
          </div>
          <Button onClick={openAdd} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> 추가
          </Button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-2">
        {initialCosts.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            고정비를 추가해주세요
          </div>
        )}
        {initialCosts.map(fc => (
          <div
            key={fc.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border bg-card p-3",
              !fc.is_active && "opacity-50"
            )}
          >
            <button
              onClick={() => openEdit(fc)}
              className="flex items-center gap-3 flex-1 min-w-0 text-left"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: (fc.categories?.color ?? "#94a3b8") + "20" }}
              >
                {fc.categories?.icon ?? "💸"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {fc.categories?.name}
                  {fc.payment_methods && ` · ${fc.payment_methods.name}`}
                  {fc.payment_day && ` · 매월 ${fc.payment_day}일`}
                </p>
              </div>
              <p className="text-sm font-bold tabular-nums shrink-0">₩{formatKRW(fc.amount)}</p>
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => handleToggle(fc)} className="p-1.5 rounded-lg hover:bg-muted">
                {fc.is_active
                  ? <ToggleRight className="h-5 w-5 text-primary" />
                  : <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                }
              </button>
              <button onClick={() => handleDelete(fc.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={v => !v && setModalOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "고정비 수정" : "고정비 추가"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>항목명</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="예: 월세" required />
            </div>
            <div className="space-y-1.5">
              <Label>금액</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₩</span>
                <Input
                  value={amount}
                  onChange={e => setAmount(formatInput(e.target.value))}
                  inputMode="numeric"
                  placeholder="0"
                  className="pl-7 text-lg font-bold h-12 tabular-nums"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>카테고리</Label>
                <SelectNative value={categoryId} onChange={e => setCategoryId(e.target.value)} placeholder="선택">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </SelectNative>
              </div>
              <div className="space-y-1.5">
                <Label>결제일</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={paymentDay}
                  onChange={e => setPaymentDay(e.target.value)}
                  placeholder="예: 25"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>결제수단</Label>
              <SelectNative value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)} placeholder="선택">
                {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </SelectNative>
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
