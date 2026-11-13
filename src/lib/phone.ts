/** Formats a Brazilian phone number for display. */
export function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length > 11) digits = digits.slice(2);

  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return phone;
}

/** Digits-only representation, suitable for storage and wa.me links. */
export function normalizePhone(phone?: string | null): string {
  return (phone ?? '').replace(/\D/g, '');
}

/** wa.me / bot friendly number with the Brazilian country code. */
export function toWhatsAppPhone(phone?: string | null): string {
  const digits = normalizePhone(phone);
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
}
