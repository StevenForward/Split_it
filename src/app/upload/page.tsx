"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StepShell } from "@/components/StepShell";
import { Button } from "@/components/Button";
import { useBill } from "@/lib/bill-store";
import { placeholderReceipt } from "@/lib/placeholder";

export default function UploadPage() {
  const router = useRouter();
  const { state, update } = useBill();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function onPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image. Try a JPG, PNG, or HEIC photo.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => update({ receiptImage: String(reader.result) });
    reader.readAsDataURL(file);
  }

  // Phase 1: extraction isn't wired yet, so both paths hand over the same
  // placeholder receipt. Phase 2 replaces this with the LLM call.
  function continueToSummary() {
    update({ receipt: placeholderReceipt() });
    router.push("/summary");
  }

  return (
    <StepShell
      step="upload"
      title="Snap the receipt"
      subtitle="Take a photo or pick one from your library. We'll pull out the line items."
      footer={
        <>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              update({ receiptImage: null, receipt: placeholderReceipt() });
              router.push("/summary");
            }}
            type="button"
          >
            Skip, use sample
          </Button>
          <Button className="flex-[2]" onClick={continueToSummary} type="button">
            {state.receiptImage ? "Scan receipt" : "Continue"}
          </Button>
        </>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      {state.receiptImage ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Image
              src={state.receiptImage}
              alt="Receipt preview"
              width={800}
              height={1200}
              unoptimized
              className="h-auto max-h-[52dvh] w-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Choose a different photo
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/40"
        >
          <span className="text-3xl" aria-hidden>
            🧾
          </span>
          <span className="text-sm font-medium text-slate-700">
            Tap to add a receipt photo
          </span>
          <span className="text-xs text-slate-400">JPG, PNG, or HEIC</span>
        </button>
      )}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <p className="mt-6 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Phase 1: extraction isn&apos;t wired up yet — either button loads the same
        sample receipt so you can walk the whole flow.
      </p>
    </StepShell>
  );
}
