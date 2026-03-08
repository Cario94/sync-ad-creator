/**
 * Date helpers for consistent date-only serialization in node config.
 *
 * Strategy: store dates as "YYYY-MM-DD" strings to avoid timezone drift.
 * When re-hydrating, parse in local time so the calendar picker shows the
 * same date regardless of timezone.
 */

/** Serialize a Date (or undefined) to a "YYYY-MM-DD" string for storage in config. */
export function toDateString(date: Date | undefined | null): string | undefined {
  if (!date) return undefined;
  // Use local date parts to avoid UTC shift
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse a stored date string back to a Date in local time.
 *  Handles both "YYYY-MM-DD" and full ISO strings gracefully. */
export function fromDateString(value: unknown): Date | undefined {
  if (!value || typeof value !== 'string') return undefined;
  // "YYYY-MM-DD" — parse as local date (not UTC)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // Full ISO string fallback — extract date portion only
  if (value.includes('T')) {
    const datePart = value.split('T')[0];
    const [y, m, d] = datePart.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return undefined;
}
