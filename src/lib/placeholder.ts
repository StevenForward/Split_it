import type { Receipt } from "./types";

/** Phase 1 stand-in for the LLM extraction result. Replaced in Phase 2. */
export function placeholderReceipt(): Receipt {
  return {
    restaurantName: "Nonna's Trattoria",
    date: "2026-08-26",
    items: [
      { id: "item-1", name: "Calamari Fritti", unitPriceCents: 1450, quantity: 1 },
      { id: "item-2", name: "Margherita Pizza", unitPriceCents: 1800, quantity: 1 },
      { id: "item-3", name: "Rigatoni Bolognese", unitPriceCents: 2200, quantity: 1 },
      { id: "item-4", name: "Caesar Salad", unitPriceCents: 1200, quantity: 1 },
      { id: "item-5", name: "Sparkling Water", unitPriceCents: 600, quantity: 2 },
      { id: "item-6", name: "Tiramisu", unitPriceCents: 1100, quantity: 1 },
    ],
    subtotalCents: 8350,
    taxCents: 741,
    tipCents: null,
    totalCents: 9091,
  };
}
