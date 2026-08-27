"use client";

import { useRouter } from "next/navigation";
import { StepShell } from "@/components/StepShell";
import { Button } from "@/components/Button";
import { useBill } from "@/lib/bill-store";
import { useRequireReceipt } from "@/lib/use-require-receipt";
import { formatCents, lineItemTotalCents, splitEvenly } from "@/lib/money";
import type { Assignments } from "@/lib/types";

export default function AssignPage() {
  const router = useRouter();
  const { ready, receipt } = useRequireReceipt();
  const { state, update } = useBill();

  if (!ready || !receipt) return null;

  const people = state.people;
  const assignments = state.assignments;

  function toggle(itemId: string, personId: string) {
    const current = assignments[itemId] ?? [];
    const next = current.includes(personId)
      ? current.filter((id) => id !== personId)
      : [...current, personId];
    const nextAssignments: Assignments = { ...assignments, [itemId]: next };
    update({ assignments: nextAssignments });
  }

  const everyItemCovered = receipt.items.every(
    (item) => (assignments[item.id] ?? []).length > 0,
  );

  return (
    <StepShell
      step="split"
      title="Who had what?"
      subtitle="Tap a name under each item. Shared plates can take more than one; tax and tip follow each person's share."
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
            disabled={!everyItemCovered}
            onClick={() => router.push("/results")}
          >
            {everyItemCovered ? "See totals" : "Assign every item"}
          </Button>
        </>
      }
    >
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {receipt.items.map((item) => {
          const assignees = assignments[item.id] ?? [];
          const itemTotal = lineItemTotalCents(
            item.unitPriceCents,
            item.quantity,
          );
          const perShare =
            assignees.length > 0
              ? splitEvenly(itemTotal, assignees.length)[0]
              : 0;

          return (
            <li key={item.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-slate-800">
                  {item.quantity > 1 ? `${item.quantity}× ` : ""}
                  {item.name}
                </span>
                <span className="text-sm font-medium tabular-nums text-slate-900">
                  {formatCents(itemTotal)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {people.map((person, i) => {
                  const on = assignees.includes(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(item.id, person.id)}
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        on
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-500 hover:border-emerald-300",
                      ].join(" ")}
                    >
                      {person.name || `Person ${i + 1}`}
                    </button>
                  );
                })}
              </div>

              <p
                className={[
                  "mt-1.5 text-xs",
                  assignees.length > 0 ? "text-slate-500" : "text-amber-600",
                ].join(" ")}
              >
                {assignees.length === 0
                  ? "No one assigned yet"
                  : `${formatCents(perShare)} each · ${assignees.length} ${
                      assignees.length === 1 ? "person" : "people"
                    }`}
              </p>
            </li>
          );
        })}
      </ul>
    </StepShell>
  );
}
