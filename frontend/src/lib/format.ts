const XAF_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "decimal",
  maximumFractionDigits: 0,
});

/** For prices/totals a viewer is being asked to pay: 0 reads as "Gratuit". */
export function formatXaf(amount: number): string {
  if (amount === 0) return "Gratuit";
  return formatCurrency(amount);
}

/** For revenue/aggregate figures (gross sales, etc.): always a currency amount, never "Gratuit". */
export function formatCurrency(amount: number): string {
  return `${XAF_FORMATTER.format(amount)} FCFA`;
}

const DATE_TZ = "Africa/Libreville";

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: DATE_TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(new Date(iso));
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: DATE_TZ,
    day: "2-digit",
    month: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: DATE_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} à ${formatTime(iso)}`;
}
