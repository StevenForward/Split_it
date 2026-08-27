/**
 * Receipt dates arrive in whatever shape the extraction produced — ISO from a
 * clean read, US or European slash formats copied verbatim off the paper, or a
 * spelled-out month. Everything here normalizes to MM/DD/YYYY for display.
 */

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

type Ymd = { year: number; month: number; day: number };

/** Rejects impossible dates like 02/30 — Date rolls those over silently. */
function isRealDate({ year, month, day }: Ymd): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

/** "24" -> 2024, "97" -> 1997. Receipts are never far from today. */
function expandYear(year: number): number {
  if (year >= 100) return year;
  return year <= 69 ? 2000 + year : 1900 + year;
}

function monthFromName(token: string): number | null {
  const key = token.toLowerCase().replace(/\.$/, "");
  if (key.length < 3) return null;
  // Matches "september", "sep", and "sept" alike.
  const index = MONTH_NAMES.findIndex(
    (name) => name === key || name.startsWith(key.slice(0, 3)),
  );
  return index === -1 ? null : index + 1;
}

function parseReceiptDate(raw: string): Ymd | null {
  // ISO first, with or without a time component: 2026-08-26, 2026-08-26T19:32
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (iso) {
    const parsed = {
      year: Number(iso[1]),
      month: Number(iso[2]),
      day: Number(iso[3]),
    };
    return isRealDate(parsed) ? parsed : null;
  }

  // Year-first with other separators: 2026/08/26, 2026.08.26
  const yearFirst = raw.match(/^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})$/);
  if (yearFirst) {
    const parsed = {
      year: Number(yearFirst[1]),
      month: Number(yearFirst[2]),
      day: Number(yearFirst[3]),
    };
    return isRealDate(parsed) ? parsed : null;
  }

  // Ambiguous numeric: 08/26/2026 (US) vs 26/08/2026 (European).
  const numeric = raw.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    const year = expandYear(Number(numeric[3]));
    // A first component over 12 can only be a day, so that one's unambiguous.
    // Otherwise assume US order — these are US restaurant receipts.
    const dayFirst = first > 12;
    const parsed = {
      year,
      month: dayFirst ? second : first,
      day: dayFirst ? first : second,
    };
    return isRealDate(parsed) ? parsed : null;
  }

  // Spelled-out month, either order: "Aug 26, 2026" / "26 August 2026"
  const words = raw.match(/^([A-Za-z]+\.?)\s+(\d{1,2}),?\s+(\d{2,4})$/);
  if (words) {
    const month = monthFromName(words[1]);
    if (month) {
      const parsed = {
        year: expandYear(Number(words[3])),
        month,
        day: Number(words[2]),
      };
      if (isRealDate(parsed)) return parsed;
    }
  }

  const wordsDayFirst = raw.match(/^(\d{1,2})\s+([A-Za-z]+\.?),?\s+(\d{2,4})$/);
  if (wordsDayFirst) {
    const month = monthFromName(wordsDayFirst[2]);
    if (month) {
      const parsed = {
        year: expandYear(Number(wordsDayFirst[3])),
        month,
        day: Number(wordsDayFirst[1]),
      };
      if (isRealDate(parsed)) return parsed;
    }
  }

  return null;
}

/**
 * Always renders MM/DD/YYYY. Anything unrecognizable is passed through as-is
 * rather than guessed at — showing the user the raw string beats inventing a
 * date they'd never think to check.
 */
export function formatReceiptDate(
  input: string | null | undefined,
  fallback = "No date found",
): string {
  const raw = (input ?? "").trim();
  if (!raw) return fallback;

  const parsed = parseReceiptDate(raw);
  if (!parsed) return raw;

  const mm = String(parsed.month).padStart(2, "0");
  const dd = String(parsed.day).padStart(2, "0");
  return `${mm}/${dd}/${parsed.year}`;
}
