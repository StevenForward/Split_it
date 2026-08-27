export const STEPS = [
  { key: "upload", label: "Receipt", href: "/upload" },
  { key: "summary", label: "Review", href: "/summary" },
  { key: "people", label: "People", href: "/people" },
  { key: "split", label: "Split", href: "/split" },
  { key: "results", label: "Totals", href: "/results" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

export function stepIndex(key: StepKey): number {
  return STEPS.findIndex((s) => s.key === key);
}
