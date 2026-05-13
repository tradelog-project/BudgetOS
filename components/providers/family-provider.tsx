"use client"

import { createContext, useContext } from "react"

interface FamilyContext {
  userId: string
  familyGroupId: string
}

const FamilyCtx = createContext<FamilyContext | null>(null)

export function FamilyProvider({
  userId,
  familyGroupId,
  children,
}: FamilyContext & { children: React.ReactNode }) {
  return (
    <FamilyCtx.Provider value={{ userId, familyGroupId }}>
      {children}
    </FamilyCtx.Provider>
  )
}

export function useFamilyContext() {
  const ctx = useContext(FamilyCtx)
  if (!ctx) throw new Error("useFamilyContext must be used within FamilyProvider")
  return ctx
}
