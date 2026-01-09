import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/utils/receipt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Calendar, DollarSign, Users, AlertTriangle,
    CheckCircle2, Search, Filter, Phone, MoreHorizontal, RefreshCw
} from "lucide-react";
import { formatDate } from "@/utils/receipt";
import { getRiskStatusLabel, RiskStatus } from "@/utils/financial";
import { toast } from "sonner";
import { BOT_API_URL } from "@/config/bot";

// Types
interface Receivable {
    id: string;
    installment_number: number;
    due_date: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    order_id: string;
    customer_id: string;
    consumer: {
        id: string;
        full_name: string;
        phone: string;
        risk_status: RiskStatus;
    };
}

export const FinancialDashboard = () => {
    const [receivables, setReceivables] = useState<Receivable[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        loadFinancialData();
    }, []);

    const handleSyncLegacy = async () => {
        setSyncing(true);
        toast.info("Iniciando sincronização de pedidos antigos...");
        try {
            // 1. Fetch relevant orders
            const { data: orders, error: orderError } = await supabase
                .from('orders')
                .select(`
                    id, order_number, total, installments, payment_method, payment_date, payment_day, created_at, user_id,
                    user:users!user_id(phone)
                `)
                .in('status', ['entregue', 'finalizado']);

            if (orderError) throw orderError;

            // Filter for orders that EITHER have installments OR are 'carnet'
            // Some might not have installments set but method is carnet
            const targetOrders = orders?.filter(o =>
                (o.installments && o.installments > 0) ||
                o.payment_method === 'carnet'
            );

            console.log(`🔎 Encontrados ${targetOrders?.length} pedidos elegíveis.`);

            // 2. Fetch existing consumer IDs map
            const { data: consumers } = await supabase
                .from('consumers')
                .select('id, phone');

            const consumerMap = new Map(consumers?.map(c => [c.phone, c.id]));

            // 3. Process
            let newCount = 0;
            const { generateReceivablesData } = await import("@/utils/financial");

            // Fetch existing receivables to avoid dupes
            const { data: existing } = await supabase.from('receivables').select('order_id');
            const existingIds = new Set(existing?.map(e => e.order_id));

            const toInsert: any[] = [];

            for (const order of targetOrders || []) {
                if (existingIds.has(order.id) || existingIds.has(order.order_number)) continue;

                const phone = order.user?.phone;
                const consumerId = consumerMap.get(phone);

                if (consumerId) {
                    // Use payment_date if exists, else construct from payment_day
                    let pDate = order.payment_date ? new Date(order.payment_date) : null;
                    if (!pDate && order.payment_day) {
                        const now = new Date();
                        pDate = new Date(now.getFullYear(), now.getMonth() + 1, order.payment_day);
                    }

                    // Default to 1 installment if missing but method is carnet
                    const numInstallments = order.installments || 1;

                    const recs = generateReceivablesData(
                        order.order_number || order.id,
                        consumerId,
                        Number(order.total),
                        numInstallments,
                        pDate,
                        new Date(order.created_at) // Base date from order creation
                    );
                    toInsert.push(...recs);
                }
            }

            if (toInsert.length > 0) {
                const { error: insError } = await supabase.from('receivables').insert(toInsert);
                if (insError) throw insError;
                newCount = toInsert.length;
                toast.success(`${newCount} novas parcelas importadas!`);
                loadFinancialData();
            } else {
                toast.info("Todos os pedidos já estão sincronizados.");
            }

        } catch (error) {
            console.error(error);
            toast.error("Erro na sincronização.");
        } finally {
            setSyncing(false);
        }
    };

    const loadFinancialData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('receivables')
                .select(`
                    *,
                    consumer:consumers!customer_id (
                        id, full_name, phone, risk_status
                    )
                `)
                .order('due_date', { ascending: true });

            if (error) throw error;
            setReceivables(data || []);
        } catch (error) {
            console.error("Erro ao carregar financeiro:", error);
            // toast.error("Erro ao carregar dados financeiros"); // Suppress initial load error if empty
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        try {
            const { error } = await supabase
                .from('receivables')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            setReceivables(prev => prev.map(r => r.id === id ? { ...r, status: 'paid' } : r));
            toast.success("Parcela baixada com sucesso!");
        } catch (error) {
            toast.error("Erro ao baixar parcela");
        }
    };

    const handleSendReminder = async (receivable: Receivable) => {
        if (!receivable.consumer.phone) return;

        const message = `Olá ${receivable.consumer.full_name}! 👋\n\n` +
            `Lembrete da sua parcela ${receivable.installment_number} no valor de ${formatCurrency(receivable.amount)}.\n` +
            `Vencimento: ${formatDate(receivable.due_date)}.\n\n` +
            `Qualquer dúvida estamos à disposição!`;

        try {
            await fetch(`${BOT_API_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: receivable.consumer.phone,
                    message
                })
            });
            toast.success("Lembrete enviado!");
        } catch (error) {
            toast.error("Erro ao enviar WhatsApp");
        }
    };

    // Metrics
    const totalPending = receivables.filter(r => r.status === 'pending').reduce((acc, r) => acc + r.amount, 0);
    const totalOverdue = receivables
        .filter(r => r.status === 'pending' && new Date(r.due_date) < new Date())
        .reduce((acc, r) => acc + r.amount, 0);
    const totalPaid = receivables.filter(r => r.status === 'paid').reduce((acc, r) => acc + r.amount, 0);

    const filteredList = receivables.filter(r =>
        r.consumer?.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
        r.status.includes(filter.toLowerCase())
    );

    const overdueList = filteredList.filter(r => r.status === 'pending' && new Date(r.due_date) < new Date());
    const activeList = filteredList.filter(r => r.status === 'pending' && new Date(r.due_date) >= new Date());
    const paidList = filteredList.filter(r => r.status === 'paid');

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Financeiro & Cobrança</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSyncLegacy} disabled={syncing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Sincronizando...' : 'Importar Antigos'}
                    </Button>
                    <Button variant="outline" onClick={loadFinancialData}>Atualizar</Button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-l-4 border-l-red-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Em Atraso</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</div>
                        <p className="text-xs text-gray-500">{overdueList.length} parcelas vencidas</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-orange-400">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">A Receber (Total)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-700">{formatCurrency(totalPending)}</div>
                        <p className="text-xs text-gray-500">Previsão futura</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Recebido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                        <p className="text-xs text-gray-500">Total baixado</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                    placeholder="Buscar por cliente..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="max-w-xs bg-white"
                />
            </div>

            <Tabs defaultValue="overdue" className="w-full">
                <TabsList className="bg-white p-1">
                    <TabsTrigger value="overdue" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Em Atraso ({overdueList.length})
                    </TabsTrigger>
                    <TabsTrigger value="active">
                        <Calendar className="h-4 w-4 mr-2" />
                        A Vencer ({activeList.length})
                    </TabsTrigger>
                    <TabsTrigger value="paid">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Baixados ({paidList.length})
                    </TabsTrigger>
                    <TabsTrigger value="crm">
                        <Users className="h-4 w-4 mr-2" />
                        Carteira CRM
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overdue" className="mt-4 space-y-4">
                    {overdueList.map(item => (
                        <ReceivableItem
                            key={item.id}
                            item={item}
                            onPay={() => handleMarkAsPaid(item.id)}
                            onRemind={() => handleSendReminder(item)}
                            isOverdue={true}
                        />
                    ))}
                    {overdueList.length === 0 && <EmptyState message="Nenhuma parcela em atraso!" icon="🎉" />}
                </TabsContent>

                <TabsContent value="active" className="mt-4 space-y-4">
                    {activeList.map(item => (
                        <ReceivableItem
                            key={item.id}
                            item={item}
                            onPay={() => handleMarkAsPaid(item.id)}
                            onRemind={() => handleSendReminder(item)}
                        />
                    ))}
                    {activeList.length === 0 && <EmptyState message="Nenhuma conta a vencer." icon="📅" />}
                </TabsContent>

                <TabsContent value="paid" className="mt-4 space-y-4">
                    {paidList.map(item => (
                        <ReceivableItem
                            key={item.id}
                            item={item}
                            onPay={() => { }}
                            onRemind={() => { }}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="crm" className="mt-4">
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                            Em breve: Visão detalhada por cliente com Score e Promessas.
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Sub-component for listing items
const ReceivableItem = ({ item, onPay, onRemind, isOverdue }: any) => (
    <Card className={`transition-all hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}>
        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-full ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <DollarSign className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{item.consumer?.full_name || 'Consumidor'}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">
                            {item.installment_number}ª Parcela
                        </span>
                        <span>Vence: {formatDate(item.due_date)}</span>
                        {isOverdue && (
                            <Badge variant="destructive" className="text-[10px]">ATRASADO</Badge>
                        )}
                        {item.status === 'paid' && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">PAGO</Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className="font-bold text-lg">{formatCurrency(item.amount)}</div>
                    <div className="text-xs text-gray-500 capitalize">{item.status === 'paid' ? 'Pago' : item.status}</div>
                </div>
                {item.status !== 'paid' && (
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={onRemind}>
                            <Phone className="h-4 w-4 mr-1" /> Cobrar
                        </Button>
                        <Button size="sm" onClick={onPay}>Baixar</Button>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
);

const EmptyState = ({ message, icon }: any) => (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <div className="text-4xl mb-2">{icon}</div>
        <p>{message}</p>
    </div>
);

export default FinancialDashboard;
