/**
 * FRONTEND_URL is a comma-separated list of allowed origins (used for CORS in
 * main.ts). Building a link for an email/redirect/notification needs exactly
 * one URL, not the raw joined string — this picks the first configured origin.
 */
export function getPrimaryFrontendUrl(
  rawFrontendUrl: string | undefined,
  fallback = 'http://localhost:3000',
): string {
  const first = (rawFrontendUrl || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)[0];
  return first || fallback;
}
