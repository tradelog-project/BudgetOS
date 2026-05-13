"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, differenceInDays, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Plus, Trash2, CheckCircle, AlertTriangle, Calendar } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { PaymentMethod, SpecialEvent, SpecialEventCategory } from "@/types"
import { formatKRW } from "@/lib/calculations/budget"
import { formatInput, parseAmount, specialEventCategoryLabel, getTodayString } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectNative } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const EVENT_CATEGORIES: SpecialEventCategory[] = [
  "birthday", "family_gathering", "travel", "hospital",
  "school_event", "holiday", "condolence", "car_insurance",
  "tax", "tuition", "other"
]

interface Props {
  upcoming: SpecialEvent[]
  completed: SpecialEvent[]
  paymentMethods: PaymentMethod[]
  familyGroupId: string
  currentUserId: string
}

export function EventsClient({ upcoming, completed, paymentMethods, familyGroupId, currentUserId }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [expectedAmount, setExpectedAmount] = useState("")
  const [category, setCategory] = useState<SpecialEventCategory>("other")
  const [paymentMethodId, setPaymentMethodId] = useState("")
  const [memo, setMemo] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const today = getTodayString()
  const totalUpcoming = upcoming.reduce((s, e) => s + e.expected_amount, 0)

  function openAdd() {
    setEditingId(null)
    setTitle(""); setEventDate(""); setExpectedAmount(""); setCategory("other")
    setPaymentMethodId(""); setMemo(""); setIsRecurring(false); setRecurrencePattern("")
    setModalOpen(true)
  }

  function openEdit(ev: SpecialEvent) {
    setEditingId(ev.id)
    setTitle(ev.title); setEventDate(ev.event_date)
    setExpectedAmount(ev.expected_amount.toLocaleString("ko-KR"))
    setCategory(ev.category); setPaymentMethodId(ev.payment_method_id ?? "")
    setMemo(ev.memo ?? ""); setIsRecurring(ev.is_recurring)
    setRecurrencePattern(ev.recurrence_pattern ?? "")
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseAmount(expectedAmount)
    if (!title || !eventDate) { toast.error("제목과 날짜를 입력하세요."); return }
    setLoading(true)
    const supabase = createClient()
    const payload = {
      family_group_id: familyGroupId,
      member_id: currentUserId,
      title, event_date: eventDate,
      expected_amount: amount,
      category,
      payment_method_id: paymentMethodId || null,
      memo: memo || null,
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? (recurrencePattern || null) : null,
    }
    const { error } = editingId
      ? await supabase.from("special_events").update(payload).eq("id", editingId)
      : await supabase.from("special_events").insert(payload)
    if (error) { toast.error("저장 실패: " + error.message) }
    else { toast.success("저장되었습니다"); setModalOpen(false); router.refresh() }
    setLoading(false)
  }

  async function handleComplete(ev: SpecialEvent) {
    const supabase = createClient()
    await supabase.from("special_events").update({ is_completed: true }).eq("id", ev.id)
    toast.success("완료 처리되었습니다")
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("삭제하시겠습니까?")) return
    const supabase = createClient()
    await supabase.from("special_events").delete().eq("id", id)
    toast.success("삭제되었습니다")
    router.refresh()
  }

  function daysUntil(dateStr: string): number {
    return differenceInDays(parseISO(dateStr), parseISO(today))
  }

  function urgencyColor(days: number) {
    if (days <= 1) return "danger"
    if (days <= 7) return "warning"
    return "secondary"
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">특별 일정</h1>
            {totalUpcoming > 0 && (
              <p className="text-xs text-muted-foreground">예정 지출 합계: ₩{formatKRW(totalUpcoming)}</p>
            )}
          </div>
          <Button onClick={openAdd} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> 추가
          </Button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Upcoming events */}
        <div>
          <h2 className="text-sm font-semibold mb-2 text-muted-foreground">다가오는 일정</h2>
          {upcoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              예정된 특별 지출이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map(ev => {
                const days = daysUntil(ev.event_date)
                return (
                  <div key={ev.id} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={cn(
                        "h-5 w-5 shrink-0 mt-0.5",
                        days <= 1 ? "text-red-500" : days <= 7 ? "text-amber-500" : "text-muted-foreground"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{ev.title}</p>
                          <Badge variant={urgencyColor(days) as any} className="shrink-0 text-xs">
                            {days === 0 ? "오늘" : days < 0 ? "지남" : `D-${days}`}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(ev.event_date), "M월 d일 (EEEE)", { locale: ko })} ·
                          {specialEventCategoryLabel(ev.category)}
                        </p>
                        {ev.expected_amount > 0 && (
                          <p className="text-sm font-bold tabular-nums mt-0.5">
                            예상 ₩{formatKRW(ev.expected_amount)}
                          </p>
                        )}
                        {ev.memo && <p className="text-xs text-muted-foreground mt-0.5">{ev.memo}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg hover:bg-muted text-xs text-muted-foreground">수정</button>
                        <button onClick={() => handleComplete(ev)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Completed / past events */}
        {completed.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground">완료 / 지난 일정</h2>
            <div className="space-y-1">
              {completed.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 opacity-60">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-through truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(ev.event_date), "M월 d일", { locale: ko })}</p>
                  </div>
                  <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <Dialog open={modalOpen} onOpenChange={v => !v && setModalOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "일정 수정" : "특별 일정 추가"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>일정명</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 딸 생일" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>날짜</Label>
                <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>카테고리</Label>
                <SelectNative value={category} onChange={e => setCategory(e.target.value as SpecialEventCategory)}>
                  {EVENT_CATEGORIES.map(c => (
                    <option key={c} value={c}>{specialEventCategoryLabel(c)}</option>
                  ))}
                </SelectNative>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>예상 지출</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₩</span>
                <Input
                  value={expectedAmount}
                  onChange={e => setExpectedAmount(formatInput(e.target.value))}
                  inputMode="numeric"
                  placeholder="0"
                  className="pl-7 text-lg font-bold h-12 tabular-nums"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>결제수단 (선택)</Label>
              <SelectNative value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)} placeholder="선택">
                {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </SelectNative>
            </div>
            <div className="space-y-1.5">
              <Label>메모 (선택)</Label>
              <Input value={memo} onChange={e => setMemo(e.target.value)} placeholder="메모" />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="recurring">반복 일정</Label>
              {isRecurring && (
                <SelectNative
                  value={recurrencePattern}
                  onChange={e => setRecurrencePattern(e.target.value)}
                  className="ml-auto w-32"
                >
                  <option value="">주기 선택</option>
                  <option value="yearly">매년</option>
                  <option value="monthly">매월</option>
                  <option value="quarterly">분기</option>
                </SelectNative>
              )}
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
