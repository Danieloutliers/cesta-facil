
export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

export const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
};

export const getPaymentMethodLabel = (method: string) => {
    switch (method) {
        case 'credit_card': return 'Cartão de Crédito';
        case 'debit_card': return 'Cartão de Débito';
        case 'money': return 'Dinheiro';
        case 'carnet': return 'Carnê Digital';
        default: return method;
    }
};

export const generateInstallmentsList = (
    total: number,
    installments: number,
    paymentDate?: Date | null,
    baseDate: Date = new Date()
) => {
    if (!installments || installments <= 1) return [];

    const installmentValue = total / installments;
    const list = [];

    let currentMonth = paymentDate ? paymentDate.getMonth() : baseDate.getMonth();
    let currentYear = paymentDate ? paymentDate.getFullYear() : baseDate.getFullYear();
    let day = paymentDate ? paymentDate.getDate() : baseDate.getDate();

    // If no payment date, assume standard 30 days logic or similar? 
    // But for this specific use case, we usually have a payment date.
    // If using baseDate (today) and just day, we might need to increment month if day < today?
    // Let's stick to the logic: if paymentDate provided, use it as anchor.

    for (let i = 0; i < installments; i++) {
        const date = new Date(currentYear, currentMonth + i, day);
        list.push({
            number: i + 1,
            date: date,
            value: installmentValue
        });
    }

    return list;
};

interface ReceiptData {
    orderId: string;
    customerName: string;
    deliveryDate: string | Date;
    total: number;
    paymentMethod: string;
    installments?: number;
    paymentDate?: Date | null;
}

export const generateReceiptMessage = (data: ReceiptData) => {
    const installmentsList = generateInstallmentsList(
        data.total,
        data.installments || 1,
        data.paymentDate,
        new Date(data.deliveryDate)
    );

    const installmentsText = installmentsList.length > 0
        ? `\n\n*Cronograma de Vencimentos:*\n` + installmentsList.map(i =>
            `${i.number}ª Parcela (${formatDate(i.date)}): ${formatCurrency(i.value)}`
        ).join('\n')
        : '';

    return `*Comprovante de Entrega - Cesta Fácil* ✅\n\n` +
        `*Pedido:* #${data.orderId}\n` +
        `*Cliente:* ${data.customerName}\n` +
        `*Data:* ${formatDate(data.deliveryDate)}\n\n` +
        `*Total:* ${formatCurrency(data.total)}\n` +
        `*Forma de Pagamento:* ${getPaymentMethodLabel(data.paymentMethod)}` +
        (data.installments && data.installments > 1 ? ` (${data.installments}x de ${formatCurrency(data.total / data.installments)})` : '') +
        installmentsText +
        `\n\nObrigado pela preferência!`;
};
