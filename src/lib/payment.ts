import { PaymentMethod } from '@/types';

/** Canonical label for every payment method identifier used by the system. */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  money: 'Dinheiro',
  cartao: 'Cartão',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  carne: 'Carnê Digital',
  carnet: 'Carnê Digital',
};

/**
 * Returns a human readable label for a payment method, falling back to the
 * raw value when it is unknown (so nothing is ever hidden from the user).
 */
export function getPaymentMethodLabel(method?: string | null): string {
  if (!method) return 'Não informado';
  return PAYMENT_METHOD_LABELS[method.toLowerCase()] ?? method;
}

/** Whether the method represents the storefront's "carnê" installment flow. */
export function isCarnetMethod(method?: string | null): boolean {
  if (!method) return false;
  const normalized = method.toLowerCase();
  return normalized === 'carne' || normalized === 'carnet';
}

/** Normalizes legacy identifiers to the ones stored by the storefront. */
export function normalizePaymentMethod(method?: string | null): PaymentMethod | undefined {
  if (!method) return undefined;
  switch (method.toLowerCase()) {
    case 'money':
      return 'dinheiro';
    case 'credit_card':
    case 'debit_card':
      return 'cartao';
    case 'carnet':
      return 'carne';
    case 'pix':
      return 'pix';
    case 'dinheiro':
    case 'cartao':
    case 'carne':
      return method.toLowerCase() as PaymentMethod;
    default:
      return undefined;
  }
}

/**
 * Converts the storefront identifiers to the legacy identifiers used by the
 * delivery registration form and the `consumers` table.
 */
export function toDeliveryPaymentMethod(method?: string | null): string {
  switch (normalizePaymentMethod(method)) {
    case 'dinheiro':
      return 'money';
    case 'cartao':
      return 'credit_card';
    case 'carne':
      return 'carnet';
    case 'pix':
      return 'pix';
    default:
      return method || 'money';
  }
}
