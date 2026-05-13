"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { formatInput, parseAmount, getTodayString } from "@/lib/utils"
import type { Category, ExpenseRecord, PaymentMethod, Profile } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectNative } from "@/components/ui/select"

interface Props {
  open: boolean
  onClose: () => void
  categories: Category[]
  paymentMethods: PaymentMethod[]
  members: Pick<Profile, "id" | "name" | "avatar_url">[]
  familyGroupId: string
  currentUserId: string
  onSuccess: () => void
  initialDate?: string
  editingExpense?: ExpenseRecord | null
}

export function ExpenseInputModal({
  open, onClose,
  categories, paymentMethods, members,
  familyGroupId, currentUserId,
  onSuccess, initialDate,
  editingExpense,
}: Props) {
  const amountRef = useRef<HTMLInputElement>(null)
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [paymentMethodId, setPaymentMethodId] = useState("")
  const [memo, setMemo] = useState("")
  const [date, setDate] = useState(initialDate ?? getTodayString())
  const [memberId, setMemberId] = useState(currentUserId)
  const [loading, setLoading] = useState(false)

  const variableCategories = categories.filter(c => c.type === "variable")
  const isEditing = !!editingExpense

  useEffect(() => {
    if (open) {
      if (editingExpense) {
        setAmount(editingExpense.amount.toLocaleString("ko-KR"))
        setCategoryId(editingExpense.category_id ?? "")
        setPaymentMethodId(editingExpense.payment_method_id ?? "")
        setMemo(editingExpense.memo ?? "")
        setDate(editingExpense.date)
        setMemberId(editingExpense.member_id)
      } else {
        setAmount("")
        setCategoryId("")
        setPaymentMethodId("")
        setMemo("")
        setDate(initialDate ?? getTodayString())
        setMemberId(currentUserId)
        setTimeout(() => amountRef.current?.focus(), 100)
      }
    }
  }, [open, editingExpense, initialDate, currentUserId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numAmount = parseAmount(amount)
    if (!numAmount) { toast.error("금액을 입력해주세요."); return }

    setLoading(true)
    const supabase = createClient()
    const payload = {
      family_group_id: familyGroupId,
      member_id: memberId,
      date,
      amount: numAmount,
      category_id: categoryId || null,
      payment_method_id: paymentMethodId || null,
      memo: memo || null,
    }

    const { error } = isEditing
      ? await supabase.from("expense_records").update(payload).eq("id", editingExpense!.id)
      : await supabase.from("expense_records").insert(payload)

    if (error) {
      toast.error("저장 실패: " + error.message)
    } else {
      toast.success(isEditing ? "수정되었습니다!" : "지출이 기록되었습니다!")
      if (!isEditing) {
        setAmount("")
        setCategoryId("")
        setMemo("")
      }
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "지출 수정" : "지출 입력"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-amount">금액</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₩</span>
              <Input
                id="exp-amount"
                ref={amountRef}
                value={amount}
                onChange={e => setAmount(formatInput(e.target.value))}
                inputMode="numeric"
                placeholder="0"
                className="pl-7 text-xl font-bold h-14 tabular-nums"
                required
              />
            </div>
          </div>

          {/* Category + Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-cat">카테고리</Label>
              <SelectNative
                id="exp-cat"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                placeholder="선택"
              >
                {variableCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </SelectNative>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-pm">결제수단</Label>
              <SelectNative
                id="exp-pm"
                value={paymentMethodId}
                onChange={e => setPaymentMethodId(e.target.value)}
                placeholder="선택"
              >
                {paymentMethods.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </SelectNative>
            </div>
          </div>

          {/* Date + Member */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">날짜</Label>
              <Input
                id="exp-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            {members.length > 1 && (
              <div className="space-y-1.5">
                <Label htmlFor="exp-member">구성원</Label>
                <SelectNative
                  id="exp-member"
                  value={memberId}
                  onChange={e => setMemberId(e.target.value)}
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </SelectNative>
              </div>
            )}
          </div>

          {/* Memo */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-memo">메모 (선택)</Label>
            <Input
              id="exp-memo"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="예: 점심 식사"
              maxLength={100}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "저장 중..." : isEditing ? "수정" : "저장"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
