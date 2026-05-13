import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BottomNav } from "@/components/layout/bottom-nav"
import { FamilyProvider } from "@/components/providers/family-provider"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const familyGroupId: string | null = user.user_metadata?.family_group_id ?? null
  if (!familyGroupId) redirect("/setup")

  return (
    <FamilyProvider userId={user.id} familyGroupId={familyGroupId}>
      <div className="min-h-screen flex flex-col max-w-lg mx-auto">
        <main className="flex-1 pb-20">
          {children}
        </main>
        <BottomNav />
      </div>
    </FamilyProvider>
  )
}
