export interface ReceiptData {
  orderId: string;
  customerName: string;
  deliveryDate?: Date | string;
  total: number;
  paymentMethod?: string;
  installments?: number;
  paymentDate?: Date | string | null;
}

export function generateReceiptMessage(data: ReceiptData): string {
  const formatMoney = (val: number) => `R$ ${(Number(val) || 0).toFixed(2).replace('.', ',')}`;
  const d = data.deliveryDate ? new Date(data.deliveryDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

  let text = `*Comprovante de Pedido - Cesta Fácil* ✅\n\n`;
  text += `*Pedido:* #${data.orderId}\n`;
  text += `*Cliente:* ${data.customerName}\n`;
  text += `*Data:* ${d}\n`;
  text += `*Total:* ${formatMoney(data.total)}\n`;

  if (data.paymentMethod) {
    text += `*Forma de Pagamento:* ${data.paymentMethod}\n`;
  }

  if (data.installments && data.installments > 1) {
    const valParcela = data.total / data.installments;
    text += `*Parcelamento:* ${data.installments}x de ${formatMoney(valParcela)}\n`;
  }

  text += `\nAgradecemos a preferência!`;
  return text;
}

export const printReceipt = () => {};
