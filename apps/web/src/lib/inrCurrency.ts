/** Indian Rupee — stored as integer paise (1 ₹ = 100 paise), displayed with 2 decimals. */

export const DEFAULT_CURRENCY = "INR";

export function formatInrFromPaise(paise: number, currency = DEFAULT_CURRENCY): string {
  if (currency !== DEFAULT_CURRENCY) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(paise / 100);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function rupeesToPaise(rupees: string | number): number {
  const n = typeof rupees === "string" ? parseFloat(rupees) : rupees;
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function paiseToRupeesInput(paise: number): string {
  return (paise / 100).toFixed(2);
}
