export const dynamic = 'force-dynamic'

import { requireAuth } from "@/lib/supabase/auth"
import { PaymentMethodsClient } from "./payment-methods-client"

export default async function PaymentMethodsPage() {
  const { supabase, familyGroupId } = await requireAuth()

  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("family_group_id", familyGroupId)
    .order("is_active", { ascending: false })

  return (
    <PaymentMethodsClient
      paymentMethods={paymentMethods ?? []}
      familyGroupId={familyGroupId}
    />
  )
}
