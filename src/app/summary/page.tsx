"use client";

import { useRouter } from "next/navigation";
import { StepShell } from "@/components/StepShell";
import { Button } from "@/components/Button";
import { useRequireReceipt } from "@/lib/use-require-receipt";
import { formatCents, lineItemTotalCents } from "@/lib/money";

export default function SummaryPage() {
  const router = useRouter();
  const { ready, receipt } = useRequireReceipt();

  if (!ready || !receipt) return null;

  return (
    <StepShell
      step="summary"
      title="Does this look right?"
      subtitle="Thermal receipts fade, so check the numbers before we split them."
      footer={
        <>
          <Button
            variant="secondary"
            className="flex-1"
            type="button"
            onClick={() => router.push("/upload")}
          >
            Back
          </Button>
          <Button
            className="flex-[2]"
            type="button"
            onClick={() => router.push("/people")}
          >
            Looks good
          </Button>
        </>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="font-medium text-slate-900">
            {receipt.restaurantName ?? "Unknown restaurant"}
          </p>
          <p className="text-xs text-slate-500">{receipt.date ?? "No date found"}</p>
        </div>

        <ul className="divide-y divide-slate-100">
          {receipt.items.map((item) => (
            <li key={item.id} className="flex items-baseline gap-3 px-4 py-3">
              <span className="flex-1 text-sm text-slate-800">
                {item.name}
                {item.quantity > 1 ? (
                  <span className="ml-1.5 text-xs text-slate-400">
                    ×{item.quantity}
                  </span>
                ) : null}
              </span>
              <span className="text-sm tabular-nums text-slate-900">
                {formatCents(
                  lineItemTotalCents(item.unitPriceCents, item.quantity),
                )}
              </span>
            </li>
          ))}
        </ul>

        <dl className="space-y-1.5 border-t border-slate-100 px-4 py-3 text-sm">
          <Row label="Subtotal" value={formatCents(receipt.subtotalCents)} />
          <Row label="Tax" value={formatCents(receipt.taxCents)} />
          {receipt.tipCents !== null ? (
            <Row label="Tip" value={formatCents(receipt.tipCents)} />
          ) : (
            <Row label="Tip" value="add later" muted />
          )}
          <Row label="Total" value={formatCents(receipt.totalCents)} strong />
        </dl>
      </div>

      <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Phase 1: read-only. Inline editing of every field lands in Phase 2.
      </p>
    </StepShell>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className={strong ? "font-medium text-slate-900" : "text-slate-500"}>
        {label}
      </dt>
      <dd
        className={[
          "tabular-nums",
          strong ? "font-semibold text-slate-900" : "",
          muted ? "text-slate-400" : "text-slate-700",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
