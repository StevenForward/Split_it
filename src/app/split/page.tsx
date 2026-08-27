"use client";

import { useRouter } from "next/navigation";
import { StepShell } from "@/components/StepShell";
import { Button } from "@/components/Button";
import { useBill } from "@/lib/bill-store";
import { useRequireReceipt } from "@/lib/use-require-receipt";
import { formatCents } from "@/lib/money";
import { deriveTotals } from "@/lib/totals";
import type { SplitMode } from "@/lib/types";

export default function SplitPage() {
  const router = useRouter();
  const { ready, receipt } = useRequireReceipt();
  const { state, update } = useBill();

  if (!ready || !receipt) return null;

  const totals = deriveTotals(receipt, state.tipOverrideCents);
  const count = state.people.length || 1;
  const perHead = Math.round(totals.totalCents / count);

  function choose(mode: SplitMode) {
    update({ splitMode: mode });
    router.push(mode === "itemized" ? "/assign" : "/results");
  }

  return (
    <StepShell
      step="split"
      title="How are you splitting?"
      subtitle={`${count} ${count === 1 ? "person" : "people"} · ${formatCents(totals.totalCents)} on the bill`}
      footer={
        <Button
          variant="secondary"
          className="flex-1"
          type="button"
          onClick={() => router.push("/people")}
        >
          Back
        </Button>
      }
    >
      <div className="space-y-3">
        <Option
          emoji="🟰"
          title="Split evenly"
          body={`Everyone pays about ${formatCents(perHead)}, tax and tip included.`}
          selected={state.splitMode === "equal"}
          onClick={() => choose("equal")}
        />
        <Option
          emoji="🍽️"
          title="Split by item"
          body="Assign each dish to whoever ordered it. Shared plates can go to several people, and tax and tip follow each person's share."
          selected={state.splitMode === "itemized"}
          onClick={() => choose("itemized")}
        />
      </div>
    </StepShell>
  );
}

function Option({
  emoji,
  title,
  body,
  selected,
  onClick,
}: {
  emoji: string;
  title: string;
  body: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full gap-3 rounded-2xl border bg-white p-4 text-left transition-colors",
        selected
          ? "border-emerald-500 ring-2 ring-emerald-100"
          : "border-slate-200 hover:border-emerald-300",
      ].join(" ")}
    >
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-slate-900">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-500">
          {body}
        </span>
      </span>
    </button>
  );
}
