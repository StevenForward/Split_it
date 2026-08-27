"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/StepShell";
import { Button } from "@/components/Button";
import { EditableField } from "@/components/EditableField";
import { useRequireReceipt } from "@/lib/use-require-receipt";
import {
  addReceiptItem,
  removeReceiptItem,
  updateBill,
  updateReceiptDate,
  updateReceiptItem,
  updateRestaurantName,
  useBill,
} from "@/lib/bill-store";
import {
  centsToDollarString,
  formatCents,
  lineItemTotalCents,
  parseDollarsToCents,
} from "@/lib/money";
import { toISODate, todayISODate } from "@/lib/date";
import { deriveTotals } from "@/lib/totals";
import type { LineItem } from "@/lib/types";

const MAX_QUANTITY = 99;

export default function SummaryPage() {
  const router = useRouter();
  const { ready, receipt } = useRequireReceipt();
  const { state } = useBill();

  // A scan that found no date (or a manual entry) starts on today.
  useEffect(() => {
    if (ready && receipt && !receipt.date) updateReceiptDate(todayISODate());
  }, [ready, receipt]);

  if (!ready || !receipt) return null;

  const totals = deriveTotals(receipt, state.tipOverrideCents);

  return (
    <StepShell
      step="summary"
      title="Does this look right?"
      subtitle="Tap any name, quantity, or price to fix what the scan got wrong."
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
          <EditableField
            label="Restaurant name"
            display={receipt.restaurantName ?? "Unknown restaurant"}
            editValue={receipt.restaurantName ?? ""}
            onCommit={updateRestaurantName}
            className="w-full font-medium text-slate-900"
          />
          <input
            type="date"
            aria-label="Receipt date"
            value={toISODate(receipt.date)}
            onChange={(e) => updateReceiptDate(e.target.value)}
            className="-mx-1 mt-0.5 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-xs text-slate-500 hover:border-slate-200 hover:bg-slate-50 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <ul className="divide-y divide-slate-100">
          {receipt.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              canRemove={receipt.items.length > 1}
            />
          ))}
          <li className="px-4 py-3">
            <button
              type="button"
              onClick={addReceiptItem}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              + Add item
            </button>
          </li>
        </ul>

        <dl className="space-y-1.5 border-t border-slate-100 px-4 py-3 text-sm">
          <Row label="Subtotal" value={formatCents(totals.subtotalCents)} />
          <Row label="Tax" value={formatCents(totals.taxCents)} />
          <TipRow tipCents={totals.tipCents} />
          <Row label="Total" value={formatCents(totals.totalCents)} strong />
        </dl>
      </div>

      {totals.subtotalDiffersFromReceipt ? (
        <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800">
          Your edits put the subtotal at {formatCents(totals.subtotalCents)}; the
          receipt read {formatCents(receipt.subtotalCents)}. Totals below use
          your version.
        </p>
      ) : null}
    </StepShell>
  );
}

function ItemRow({
  item,
  canRemove,
}: {
  item: LineItem;
  canRemove: boolean;
}) {
  function commitName(raw: string) {
    const name = raw.trim();
    // An empty name would leave an unidentifiable row, so keep the old one.
    if (name) updateReceiptItem(item.id, { name });
  }

  function commitQuantity(raw: string) {
    const parsed = Number.parseInt(raw.trim(), 10);
    if (!Number.isFinite(parsed)) return;
    updateReceiptItem(item.id, {
      quantity: Math.min(MAX_QUANTITY, Math.max(1, parsed)),
    });
  }

  function commitPrice(raw: string) {
    const cents = parseDollarsToCents(raw);
    if (cents === null) return;
    updateReceiptItem(item.id, { unitPriceCents: Math.max(0, cents) });
  }

  return (
    <li className="px-4 py-3">
      <div className="flex items-baseline gap-3">
        <EditableField
          label={`Name of ${item.name || "new item"}`}
          display={item.name || "Item name"}
          editValue={item.name}
          onCommit={commitName}
          className="flex-1 text-sm text-slate-800"
        />
        <span className="text-sm font-medium tabular-nums text-slate-900">
          {formatCents(lineItemTotalCents(item.unitPriceCents, item.quantity))}
        </span>
        {canRemove ? (
          <button
            type="button"
            aria-label={`Remove ${item.name || "item"}`}
            onClick={() => removeReceiptItem(item.id)}
            className="-mr-1 shrink-0 rounded-md px-1 text-slate-400 transition-colors hover:text-red-600"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <EditableField
          label={`Quantity of ${item.name}`}
          display={String(item.quantity)}
          editValue={String(item.quantity)}
          onCommit={commitQuantity}
          inputMode="numeric"
          className="w-8 text-center tabular-nums"
        />
        <span aria-hidden>×</span>
        <EditableField
          label={`Unit price of ${item.name}`}
          display={formatCents(item.unitPriceCents)}
          editValue={centsToDollarString(item.unitPriceCents)}
          onCommit={commitPrice}
          inputMode="decimal"
          className="w-20 tabular-nums"
        />
        <span>each</span>
      </div>
    </li>
  );
}

function TipRow({ tipCents }: { tipCents: number }) {
  function commitTip(raw: string) {
    const cents = parseDollarsToCents(raw);
    if (cents === null) return;
    // Editing replaces the receipt's tip wholesale; deriveTotals reads this next.
    updateBill({ tipOverrideCents: Math.max(0, cents) });
  }

  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-slate-500">Tip</dt>
      <dd className="tabular-nums text-slate-700">
        <EditableField
          label="Tip amount"
          display={formatCents(tipCents)}
          editValue={centsToDollarString(tipCents)}
          onCommit={commitTip}
          inputMode="decimal"
          className="w-20 text-right tabular-nums"
        />
      </dd>
    </div>
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
