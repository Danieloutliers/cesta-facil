import { addMonths } from 'date-fns';

export type RiskStatus = 'safe' | 'attention' | 'risk';

export const getRiskStatusLabel = (status: RiskStatus) => {
    switch (status) {
        case 'safe': return { label: 'Bom Pagador', color: 'bg-green-100 text-green-800', icon: '🟢' };
        case 'attention': return { label: 'Atenção', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' };
        case 'risk': return { label: 'Inadimplente', color: 'bg-red-100 text-red-800', icon: '🔴' };
        default: return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800', icon: '⚪' };
    }
};

export const generateReceivablesData = (
    orderId: string,
    customerId: string,
    total: number,
    installments: number,
    paymentDate: Date | null,
    baseDate: Date = new Date()
) => {
    if (installments <= 0) return [];

    const installmentValue = total / installments;
    const receivables = [];

    // Check payment date logic. 
    // If paymentDate is provided, use it as the anchor day.
    // E.g. Today is Jan 9. Payment Date is 15th.
    // 1st installment: Jan 15 (if today < 15) or Feb 15 (if today > 15)?
    // Usually, first payment is next month. Let's assume standard "next month" logic if not specified otherwise, 
    // or next occurrence of the day.

    let targetMonth = baseDate.getMonth();
    let targetYear = baseDate.getFullYear();
    const day = paymentDate ? paymentDate.getDate() : baseDate.getDate();

    // If day has passed in current month, start next month
    if (baseDate.getDate() >= day) {
        targetMonth++;
    }

    for (let i = 0; i < installments; i++) {
        // Create date safely handling year rollover
        const dueDate = new Date(targetYear, targetMonth + i, day);

        receivables.push({
            order_id: orderId,
            customer_id: customerId,
            installment_number: i + 1,
            due_date: dueDate.toISOString(),
            amount: installmentValue,
            status: 'pending'
        });
    }

    return receivables;
};
