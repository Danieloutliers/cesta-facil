export interface Installment {
  number: number;
  date: Date;
  value: number;
}

export function calculatePaymentSchedule(order: any, customer?: any): Installment[] {
  if (!order || !order.total) return [];
  const installmentsCount = Number(order.installments) || 1;
  const total = Number(order.total) || 0;
  const valuePerInstallment = total / installmentsCount;

  const startDate = order.delivery_date ? new Date(order.delivery_date) : new Date();
  const schedule: Installment[] = [];

  for (let i = 1; i <= installmentsCount; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    schedule.push({
      number: i,
      date: dueDate,
      value: valuePerInstallment,
    });
  }

  return schedule;
}
