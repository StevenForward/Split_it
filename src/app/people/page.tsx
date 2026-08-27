"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/StepShell";
import { Button } from "@/components/Button";
import { useBill } from "@/lib/bill-store";
import { useRequireReceipt } from "@/lib/use-require-receipt";
import type { Person } from "@/lib/types";

const MIN_PEOPLE = 1;
const MAX_PEOPLE = 20;

function makePerson(index: number): Person {
  return { id: `person-${crypto.randomUUID()}`, name: `Person ${index + 1}` };
}

export default function PeoplePage() {
  const router = useRouter();
  const { ready } = useRequireReceipt();
  const { state, update } = useBill();
  const people = state.people;

  // Default to a party of two on first arrival.
  useEffect(() => {
    if (ready && people.length === 0) {
      update({ people: [makePerson(0), makePerson(1)] });
    }
  }, [ready, people.length, update]);

  if (!ready) return null;

  function setCount(next: number) {
    const clamped = Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, next));
    if (clamped === people.length) return;
    if (clamped < people.length) {
      update({ people: people.slice(0, clamped) });
      return;
    }
    const added = Array.from({ length: clamped - people.length }, (_, i) =>
      makePerson(people.length + i),
    );
    update({ people: [...people, ...added] });
  }

  function rename(id: string, name: string) {
    update({ people: people.map((p) => (p.id === id ? { ...p, name } : p)) });
  }

  return (
    <StepShell
      step="people"
      title="Who's at the table?"
      subtitle="Names are optional — they just make the final screen easier to read."
      footer={
        <>
          <Button
            variant="secondary"
            className="flex-1"
            type="button"
            onClick={() => router.push("/summary")}
          >
            Back
          </Button>
          <Button
            className="flex-[2]"
            type="button"
            disabled={people.length < MIN_PEOPLE}
            onClick={() => router.push("/split")}
          >
            Continue
          </Button>
        </>
      }
    >
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
        <span className="text-sm font-medium text-slate-700">People</span>
        <div className="flex items-center gap-4">
          <Stepper
            label="Remove a person"
            symbol="−"
            onClick={() => setCount(people.length - 1)}
            disabled={people.length <= MIN_PEOPLE}
          />
          <span className="w-8 text-center text-xl font-semibold tabular-nums">
            {people.length}
          </span>
          <Stepper
            label="Add a person"
            symbol="+"
            onClick={() => setCount(people.length + 1)}
            disabled={people.length >= MAX_PEOPLE}
          />
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {people.map((person, i) => (
          <li key={person.id}>
            <label className="sr-only" htmlFor={person.id}>
              Name of person {i + 1}
            </label>
            <input
              id={person.id}
              value={person.name}
              onChange={(e) => rename(person.id, e.target.value)}
              placeholder={`Person ${i + 1}`}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </li>
        ))}
      </ul>
    </StepShell>
  );
}

function Stepper({
  label,
  symbol,
  onClick,
  disabled,
}: {
  label: string;
  symbol: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-lg text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-30"
    >
      {symbol}
    </button>
  );
}
