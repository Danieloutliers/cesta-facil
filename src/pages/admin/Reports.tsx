import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Download, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SalesChart } from '@/components/charts/SalesChart';
import { TopProductsChart } from '@/components/charts/TopProductsChart';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { format, subDays, isAfter, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface SalesData {
    date: string;
    revenue: number;
    orders: number;
}

interface ProductData {
    name: string;
    quantity: number;
    revenue: number;
}

interface ReportOrder {
    id: string;
    created_at: string;
    total: number;
    status: string;
    items: Array<{ name?: string; quantity?: number; price?: number }> | null;
}

type Period = 7 | 30 | 90;

export default function Reports() {
    const [orders, setOrders] = useState<ReportOrder[]>([]);
    const [period, setPeriod] = useState<Period>(30);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchReportsData = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('id, created_at, total, status, items')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders((data ?? []) as ReportOrder[]);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast({
                title: 'Erro ao carregar relatórios',
                description: 'Verifique sua conexão e tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        void fetchReportsData();
    }, [fetchReportsData]);

    const filteredOrders = useMemo(() => {
        const startDate = startOfDay(subDays(new Date(), period - 1));
        return orders.filter((order) => {
            if (order.status === 'cancelado') return false;
            const createdAt = new Date(order.created_at);
            return !Number.isNaN(createdAt.getTime()) && isAfter(createdAt, startDate);
        });
    }, [orders, period]);

    const salesData = useMemo<SalesData[]>(() => {
        const salesByDate: Record<string, { revenue: number; orders: number }> = {};
        const days = Array.from({ length: period }, (_, i) => format(subDays(new Date(), i), 'dd/MM'));

        days.forEach((date) => {
            salesByDate[date] = { revenue: 0, orders: 0 };
        });

        filteredOrders.forEach((order) => {
            const orderDate = format(new Date(order.created_at), 'dd/MM');
            if (salesByDate[orderDate]) {
                salesByDate[orderDate].revenue += Number(order.total) || 0;
                salesByDate[orderDate].orders += 1;
            }
        });

        return days.reverse().map((date) => ({
            date,
            revenue: salesByDate[date].revenue,
            orders: salesByDate[date].orders,
        }));
    }, [filteredOrders, period]);

    const topProducts = useMemo<ProductData[]>(() => {
        const productSales: Record<string, { quantity: number; revenue: number }> = {};

        filteredOrders.forEach((order) => {
            (order.items ?? []).forEach((item) => {
                const name = item.name?.trim();
                if (!name) return;
                if (!productSales[name]) productSales[name] = { quantity: 0, revenue: 0 };
                const quantity = Number(item.quantity) || 0;
                const price = Number(item.price) || 0;
                productSales[name].quantity += quantity;
                productSales[name].revenue += price * quantity;
            });
        });

        return Object.entries(productSales)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
    }, [filteredOrders]);

    const exportToCsv = () => {
        if (filteredOrders.length === 0) {
            toast({ title: 'Nenhum pedido no período selecionado', variant: 'destructive' });
            return;
        }

        const headers = ['Pedido', 'Data', 'Total (R$)'];
        const rows = filteredOrders.map((order) => [
            order.id,
            format(new Date(order.created_at), 'dd/MM/yyyy HH:mm'),
            (Number(order.total) || 0).toFixed(2).replace('.', ','),
        ]);

        const csv = [headers.join(';'), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';'))].join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio_${period}dias_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({ title: 'Relatório exportado!', description: `${filteredOrders.length} pedidos exportados.` });
    };

    const periods: Array<{ label: string; value: Period }> = [
        { label: 'Últimos 7 dias', value: 7 },
        { label: 'Últimos 30 dias', value: 30 },
        { label: 'Últimos 90 dias', value: 90 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
                    <p className="text-muted-foreground">Análises e exportações de dados</p>
                </div>
                <Button onClick={exportToCsv} disabled={loading}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Período de Análise</CardTitle>
                    <CardDescription>Selecione o período para visualizar os relatórios</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {periods.map((option) => (
                            <Button
                                key={option.value}
                                variant={period === option.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPeriod(option.value)}
                                aria-pressed={period === option.value}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm">Carregando relatórios...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <SalesChart
                        data={salesData}
                        title="Performance de Vendas"
                        description={`Receita diária (${period} dias) — ${filteredOrders.length} pedidos`}
                    />
                    <TopProductsChart
                        data={topProducts}
                        title="Top 10 Produtos"
                        description="Por receita no período selecionado"
                    />
                </div>
            )}

            {!loading && filteredOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 opacity-40" />
                    <p className="text-sm">Nenhum pedido encontrado neste período.</p>
                </div>
            )}
        </div>
    );
}
