import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Printer, CheckCircle, Calendar, CreditCard, DollarSign, Send } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useToast } from '@/hooks/use-toast';
import { BOT_API_URL } from '@/config/bot';
import { calculatePaymentSchedule } from '@/lib/financial';

interface ReceiptModalProps {
    order: any;
    customer: any;
}

export function ReceiptModal({ order, customer }: ReceiptModalProps) {
    const componentRef = useRef(null);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Comprovante_Pedido_${order.order_number}`,
    });

    const [sending, setSending] = useState(false);
    const { toast } = useToast();

    // Debug logging


    const formatDate = (dateString: string) => {
        // STRICT: Only use provided date or delivery_date. NO fallback to created_at/updated_at for delivery fields.
        // Smart Fallback: Check if this order matches the customer's last recorded order
        const isLastOrder = customer?.last_order_number === order.id || customer?.last_order_number === order.order_number;
        const fallbackDate = isLastOrder ? customer?.last_delivery_date : null;

        const dateToUse = dateString || order.delivery_date || fallbackDate;

        if (!dateToUse) return '-';
        return new Date(dateToUse).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const calculateInstallmentValue = () => {
        if (!order.total || !order.installments) return 0;
        return Number(order.total) / order.installments;
    };

    const handleSendWhatsapp = async () => {
        if (!customer.phone) {
            toast({ title: "Erro", description: "Cliente sem telefone cadastrado.", variant: "destructive" });
            return;
        }

        setSending(true);
        try {
            const installmentsText = installmentsList.length > 0
                ? `\n\n*Cronograma de Vencimentos:*\n` + installmentsList.map(i =>
                    `${i.number}ª Parcela (${formatDate(i.date.toISOString())}): ${formatCurrency(i.value)}`
                ).join('\n')
                : '';

            const message = `*Comprovante de Entrega - Cesta Fácil* ✅\n\n` +
                `*Pedido:* #${order.order_number || order.id}\n` +
                `*Cliente:* ${customer.full_name || customer.name}\n` +
                `*Data:* ${formatDate(order.delivery_date)}\n\n` +
                `*Total:* ${formatCurrency(order.total)}\n` +
                `*Forma de Pagamento:* ${order.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                    order.payment_method === 'debit_card' ? 'Cartão de Débito' :
                        order.payment_method === 'money' ? 'Dinheiro' :
                            order.payment_method === 'carnet' ? 'Carnê Digital' : order.payment_method
                }` +
                (order.installments > 1 ? ` (${order.installments}x de ${formatCurrency(calculateInstallmentValue())})` : '') +
                installmentsText +
                `\n\nObrigado pela preferência!`;

            const res = await fetch(`${BOT_API_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: customer.phone,
                    message
                })
            });

            if (res.ok) {
                toast({ title: "Sucesso", description: "Comprovante enviado." });
            } else {
                throw new Error("Falha ao enviar");
            }
        } catch (error) {
            console.error("Erro ao enviar WP:", error);
            toast({ title: "Erro", description: "Falha ao enviar comprovante.", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };



    const installmentsList = calculatePaymentSchedule(order, customer);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Printer className="h-4 w-4" />
                    Comprovante
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Comprovante de Entrega</DialogTitle>
                </DialogHeader>

                <div className="bg-white p-6 rounded-lg border shadow-sm print:shadow-none print:border-none" ref={componentRef}>
                    {/* Header */}
                    <div className="text-center border-b pb-4 mb-4">
                        <div className="flex justify-center mb-2">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Cesta Fácil</h2>
                        <h3 className="text-sm font-semibold text-gray-600 mt-1 uppercase">Comprovante de Entrega</h3>
                        <p className="text-xs text-gray-400 mt-1">Pedido ID: {order.order_number || order.id}</p>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center py-2 border-b">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600 font-medium">Data Entrega</span>
                            </div>
                            <span className="font-bold">{formatDate(order.delivery_date)}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Cliente</span>
                                <span className="font-bold text-gray-800">{customer.full_name || customer.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">CPF</span>
                                <span className="font-bold text-gray-800">{customer.cpf || '-'}</span>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Detalhes do Pagamento</h4>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Forma de Pagamento</span>
                                <span className="font-medium">
                                    {order.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                                        order.payment_method === 'debit_card' ? 'Cartão de Débito' :
                                            order.payment_method === 'money' ? 'Dinheiro' :
                                                order.payment_method === 'carnet' ? 'Carnê Digital' : order.payment_method}
                                </span>
                            </div>

                            {order.installments > 1 && (
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Parcelamento</span>
                                    <span className="font-medium">{order.installments}x de {formatCurrency(calculateInstallmentValue())}</span>
                                </div>
                            )}
                        </div>

                        {/* Installments Schedule */}
                        {installmentsList.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Cronograma de Vencimentos</h4>
                                <div className="space-y-1">
                                    {installmentsList.map((inst) => (
                                        <div key={inst.number} className="flex justify-between text-xs py-1 border-b border-dashed last:border-0">
                                            <span className="text-gray-600">{inst.number}ª Parcela - {formatDate(inst.date.toISOString())}</span>
                                            <span className="font-bold text-gray-800">{formatCurrency(inst.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Total */}
                        <div className="flex justify-between items-center py-3 mt-4 bg-gray-100 rounded-lg px-3">
                            <span className="text-base font-bold text-gray-800">Valor Total</span>
                            <span className="text-xl font-bold text-green-600">
                                {formatCurrency(order.total)}
                            </span>
                        </div>
                    </div>

                    {/* Signature Area */}
                    <div className="mt-12 pt-8 border-t border-gray-300">
                        <div className="text-center">
                            <p className="text-xs text-gray-400 mb-8">Recebi os produtos constantes neste comprovante.</p>
                            <div className="border-t border-black w-3/4 mx-auto mb-2"></div>
                            <p className="font-medium text-sm">{customer.full_name || customer.name}</p>
                        </div>
                    </div>

                    <div className="text-center mt-6 text-[10px] text-gray-300">
                        <p>Emitido em {new Date().toLocaleString('pt-BR')}</p>
                    </div>
                </div>

                <div className="flex justify-end mt-4 print:hidden">
                    <Button onClick={handlePrint} className="w-full sm:w-auto">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir / Salvar PDF
                    </Button>
                    <Button
                        onClick={handleSendWhatsapp}
                        disabled={sending}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        {sending ? 'Enviando...' : 'Enviar no WhatsApp'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
