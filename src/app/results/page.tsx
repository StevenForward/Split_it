"use client";

import { useRouter } from "next/navigation";
import { StepShell } from "@/components/StepShell";
import { Button } from "@/components/Button";
import { useBill } from "@/lib/bill-store";
import { useRequireReceipt } from "@/lib/use-require-receipt";
import { formatCents, splitEvenly } from "@/lib/money";
import { deriveTotals, derivePersonTotals } from "@/lib/totals";

export default function ResultsPage() {
  const router = useRouter();
  const { ready, receipt } = useRequireReceipt();
  const { state, reset } = useBill();

  if (!ready || !receipt) return null;

  const people = state.people;
  const totals = deriveTotals(receipt, state.tipOverrideCents);
  const itemized = state.splitMode === "itemized";

  const rows = itemized
    ? derivePersonTotals(
        receipt,
        people,
        state.assignments,
        state.tipOverrideCents,
      ).map((person, i) => ({
        key: person.personId,
        name: person.name || `Person ${i + 1}`,
        amount: person.totalCents,
        detail: `Items ${formatCents(person.subtotalCents)} · Tax ${formatCents(
          person.taxCents,
        )} · Tip ${formatCents(person.tipCents)}`,
      }))
    : splitEvenly(totals.totalCents, people.length || 1).map((amount, i) => ({
        key: people[i]?.id ?? `person-${i}`,
        name: people[i]?.name || `Person ${i + 1}`,
        amount,
        detail: null as string | null,
      }));

  const collected = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <StepShell
      step="results"
      title="Here's the damage"
      subtitle={
        itemized
          ? "Split by item, with tax and tip shared by what each person ordered."
          : "Split evenly, tax and tip included."
      }
      footer={
        <>
          <Button
            variant="secondary"
            className="flex-1"
            type="button"
            onClick={() => router.push(itemized ? "/assign" : "/split")}
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
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between gap-3 px-4 py-4"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-800">
                {row.name}
              </span>
              {row.detail ? (
                <span className="mt-0.5 block text-xs text-slate-500">
                  {row.detail}
                </span>
              ) : null}
            </span>
            <span className="text-base font-semibold tabular-nums text-slate-900">
              {formatCents(row.amount)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-between rounded-2xl bg-slate-100 px-4 py-3 text-sm">
        <span className="text-slate-500">Total collected</span>
        <span className="font-semibold tabular-nums text-slate-900">
          {formatCents(collected)}
        </span>
      </div>
    </StepShell>
  );
}
