/** Shared client-side validators — mirror the backend `@Matches` rules exactly. */

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s()-]/g, '');
}

/**
 * Ukrainian number in any of the forms people actually type:
 * +380XXXXXXXXX, 380XXXXXXXXX, 0XXXXXXXXX — spaces/dashes/parens ignored.
 * Same regex as the backend DTOs; change both together.
 */
export function isValidUAPhone(raw: string): boolean {
  return /^(\+?38)?0\d{9}$/.test(normalizePhone(raw));
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim());
}

/**
 * Input mask: keeps only digits and renders «+380 XX XXX XX XX» as the user
 * types — letters simply cannot enter the field. Accepts pastes that start
 * with 380 or 0. Empty input stays empty so placeholders remain visible.
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('380')
    ? digits.slice(3)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  const d = local.slice(0, 9);
  let out = '+380';
  if (d.length > 0) out += ' ' + d.slice(0, 2);
  if (d.length > 2) out += ' ' + d.slice(2, 5);
  if (d.length > 5) out += ' ' + d.slice(5, 7);
  if (d.length > 7) out += ' ' + d.slice(7, 9);
  return out === '+380' && raw === '' ? '' : out;
}
