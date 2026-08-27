# Split-It

Scan a restaurant receipt, then split the bill — evenly, or itemized by what each
person actually ordered. After you can share the results with the people you came
with and get their input on the amount

No payment processing, no accounts, no database. One bill, one session. 
No sending money using this either, this is just a tool to help display 
the bill split.

## How it works

1. **Upload** a photo of the receipt
2. **Review** the extracted line items and correct anything the model misread
3. **People** — say how many are splitting, optionally name them
4. **Split** — evenly, or item by item (shared plates can go to several people)
5. **Totals** — per-person breakdown, with tax and tip allocated in proportion to
   each person's share of the subtotal
6. **Share** — share the summarized bill with the guests splitting with, with the option to suggest
   edits if something seems off

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Receipt extraction via a vision-capable Claude call returning strict JSON —
  no OCR library, no retrieval pipeline
- State lives in a sessionStorage-backed store for the length of one session

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Notes on the money math

Every amount is stored as **integer cents**; dollars only exist at the input and
display edges. Proportional allocation uses the largest-remainder method, so
per-person shares always sum back to the exact total — no cents quietly go
missing in rounding.

