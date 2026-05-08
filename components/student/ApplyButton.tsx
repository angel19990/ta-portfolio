"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { applyToCastingCall } from "@/app/(app)/student/casting-calls/actions"
import { Button } from "@/components/ui/button"

export function ApplyButton({ callId }: { callId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onApply() {
    startTransition(async () => {
      const result = await applyToCastingCall(callId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Application submitted")
      router.refresh()
    })
  }

  return (
    <Button type="button" disabled={pending} onClick={onApply}>
      {pending ? "Applying…" : "Apply to this call"}
    </Button>
  )
}
