"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBill } from "./bill-store";

/**
 * Every screen after /upload needs a receipt in state. Deep-linking to one
 * without a receipt (or after a refresh, which clears the whole bill) bounces
 * to /upload. Waits for hydration so we don't redirect before the client store
 * takes over from the server snapshot.
 */
export function useRequireReceipt() {
  const { state, hydrated } = useBill();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !state.receipt) router.replace("/upload");
  }, [hydrated, state.receipt, router]);

  return { ready: hydrated && state.receipt !== null, receipt: state.receipt };
}
