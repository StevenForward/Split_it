"use client";

import { useRouter } from "next/navigation";
import { StepShell } from "@/components/StepShell";
import { Button } from "@/components/Button";
import { useBill } from "@/lib/bill-store";
import { useRequireReceipt } from "@/lib/use-require-receipt";
import { formatCents, splitEvenly } from "@/lib/money";
import { deriveTotals } from "@/lib/totals";

export default function ResultsPage() {
  const router = useRouter();
  const { ready, receipt } = useRequireReceipt();
  const { state, reset } = useBill();

  if (!ready || !receipt) return null;

  const people = state.people;
  // Phase 1 placeholder: an even split of the printed total. Phase 3 makes this
  // real (with the tip control), Phase 4 adds the itemized path.
  const totals = deriveTotals(receipt, state.tipOverrideCents);
  const shares = splitEvenly(totals.totalCents, people.length || 1);

  return (
    <StepShell
      step="results"
      title="Here's the damage"
      subtitle={
        state.splitMode === "itemized"
          ? "Split by item and tip."
          : "Split evenly, tax and tip included."
      }
      footer={
        <>
          <Button
            variant="secondary"
            className="flex-1"
            type="button"
            onClick={() => router.push("/split")}
          >
            Back
          </Button>
          <Button
            className="flex-[2]"
            type="button"
            onClick={() => {
              reset();
              router.push("/upload");
            }}
          >
            New bill
          </Button>
        </>
      }
    >
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {people.map((person, i) => (
          <li
            key={person.id}
            className="flex items-center justify-between px-4 py-4"
          >
            <span className="text-sm font-medium text-slate-800">
              {person.name || `Person ${i + 1}`}
            </span>
            <span className="text-base font-semibold tabular-nums text-slate-900">
              {formatCents(shares[i] ?? 0)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-between rounded-2xl bg-slate-100 px-4 py-3 text-sm">
        <span className="text-slate-500">Total collected</span>
        <span className="font-semibold tabular-nums text-slate-900">
          {formatCents(shares.reduce((a, b) => a + b, 0))}
        </span>
      </div>
    </StepShell>
  );
}
