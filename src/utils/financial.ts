export const formatCurrency = (val: number) => `R$ ${(Number(val) || 0).toFixed(2).replace('.', ',')}`;

export interface RiskStatusInfo {
  label: string;
  icon: string;
  color?: string;
}

export function getRiskStatusLabel(status: string): RiskStatusInfo {
  switch (status) {
    case 'danger':
    case 'high':
      return { label: 'Alto Risco', icon: '⚠️', color: 'red' };
    case 'warning':
    case 'medium':
      return { label: 'Atenção', icon: '⚡', color: 'yellow' };
    case 'safe':
    case 'low':
    default:
      return { label: 'Bom Pagador', icon: '✅', color: 'green' };
  }
}

export function generateReceivablesData(
  orderId: string,
  consumerId: string,
  total: number,
  installmentsCount: number,
  firstPaymentDate?: Date | null
) {
  const count = Number(installmentsCount) || 1;
  const valuePerInstallment = total / count;
  const startDate = firstPaymentDate ? new Date(firstPaymentDate) : new Date();

  const receivables = [];
  for (let i = 1; i <= count; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));
    receivables.push({
      order_id: orderId,
      consumer_id: consumerId,
      installment_number: i,
      total_installments: count,
      amount: Number(valuePerInstallment.toFixed(2)),
      due_date: dueDate.toISOString(),
      status: 'pending'
    });
  }
  return receivables;
}
