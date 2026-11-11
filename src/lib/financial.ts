export interface Installment {
    number: number;
    date: Date;
    value: number;
}

export const calculatePaymentSchedule = (
    order: {
        id?: string;
        order_number?: string;
        total: number | string;
        installments?: number;
        payment_day?: number;
        paymentDay?: number;
        payment_date?: string | null;
        paymentDate?: string | null;
        delivery_date?: string;
        estimatedDelivery?: string;
        created_at?: string;
        createdAt?: string;
    },
    customer: {
        last_order_number?: string;
        payment_day?: number;
    } | null
): Installment[] => {
    // Smart fallback logic for payment_day
    const isLastOrder = customer && (customer.last_order_number === order.id || customer.last_order_number === order.order_number);
    const paymentDay = order.payment_day || order.paymentDay || (isLastOrder ? customer?.payment_day : null);
    const paymentDateStr = order.payment_date || order.paymentDate;
    const paymentDate = paymentDateStr ? new Date(paymentDateStr) : null;
    const installmentsCount = order.installments || 1;
    const total = Number(order.total) || 0;

    if ((!paymentDay && !paymentDate) || installmentsCount <= 1) return [];

    const items: Installment[] = [];
    const installmentValue = total / installmentsCount;

    if (paymentDate) {
        let currentMonth = paymentDate.getMonth();
        let currentYear = paymentDate.getFullYear();
        let day = paymentDate.getDate();

        for (let i = 0; i < installmentsCount; i++) {
            // Calculate next month correctly handling flow (e.g. Jan 31 -> Feb 28)
            const dueDate = new Date(currentYear, currentMonth + i, day);

            items.push({
                number: i + 1,
                date: dueDate,
                value: installmentValue
            });
        }
        return items;
    }

    // Fallback to payment_day logic
    const baseDate = order.delivery_date || order.estimatedDelivery || order.created_at || order.createdAt;
    if (!baseDate) return [];

    let currentDate = new Date(baseDate);

    // Logic: First due date is the next occurrence of payment_day
    let targetYear = currentDate.getFullYear();
    let targetMonth = currentDate.getMonth();

    if (currentDate.getDate() >= (paymentDay as number)) {
        targetMonth++;
    }

    for (let i = 0; i < installmentsCount; i++) {
        const dueDate = new Date(targetYear, targetMonth + i, paymentDay as number);
        items.push({
            number: i + 1,
            date: dueDate,
            value: installmentValue
        });
    }
    return items;
};

export const calculateInstallmentTotal = (
    total: number,
    installments: number,
    rates: { rate1to2: number; rate3to5: number }
) => {
    let rate = 0;

    if (installments >= 1 && installments <= 2) {
        rate = rates.rate1to2;
    } else if (installments >= 3 && installments <= 5) {
        rate = rates.rate3to5;
    }

    const totalWithInterest = total * (1 + rate / 100);
    const installmentValue = totalWithInterest / installments;

    return {
        installmentValue,
        totalWithInterest,
        interestRate: rate
    };
};
