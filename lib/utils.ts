import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseAmount(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0
}

export function formatInput(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return new Intl.NumberFormat('ko-KR').format(parseInt(num, 10))
}

export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function specialEventCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    birthday: '생일',
    family_gathering: '가족모임',
    travel: '여행',
    hospital: '병원',
    school_event: '학교행사',
    holiday: '명절',
    condolence: '경조사',
    car_insurance: '자동차보험',
    tax: '세금',
    tuition: '학원비',
    other: '기타',
  }
  return map[cat] ?? cat
}

export function paymentMethodTypeLabel(type: string): string {
  const map: Record<string, string> = {
    cash: '현금',
    credit_card: '신용카드',
    debit_card: '체크카드',
    bank_account: '계좌이체',
  }
  return map[type] ?? type
}
