/**
 * IBAN validation (ISO 13616): format check + mod-97 checksum.
 * Accepts input with spaces; returns true for valid IBANs.
 */
export function isValidIban(input: string): boolean {
  const iban = input.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;

  // Move the first 4 chars to the end, expand letters to digits (A=10…Z=35),
  // then take mod 97 — a valid IBAN leaves remainder 1. Processed in chunks
  // because the expanded string far exceeds Number precision.
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of code) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

/** True when the value looks like an IBAN (bank-style detail) at all. */
export function looksLikeIban(input: string): boolean {
  return /^[A-Za-z]{2}\d/.test(input.replace(/\s+/g, ''));
}
