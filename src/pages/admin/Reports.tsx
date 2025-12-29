import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SalesChart } from '@/components/charts/SalesChart';
import { TopProductsChart } from '@/components/charts/TopProductsChart';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';

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

export default function Reports() {
    const [salesData, setSalesData] = useState<SalesData[]>([]);
    const [topProducts, setTopProducts] = useState<ProductData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportsData();
    }, []);

    const fetchReportsData = async () => {
        try {
            const { data: orders } = await supabase
                .from('orders')
                .select('*');

            // Generate sales data for last 30 days
            const salesByDate: { [key: string]: { revenue: number, orders: number } } = {};
            const last30Days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'dd/MM'));

            last30Days.forEach(date => {
                salesByDate[date] = { revenue: 0, orders: 0 };
            });

            orders?.forEach(order => {
                const orderDate = format(new Date(order.created_at), 'dd/MM');
                if (salesByDate[orderDate]) {
                    salesByDate[orderDate].revenue += order.total;
                    salesByDate[orderDate].orders += 1;
                }
            });

            const salesChartData: SalesData[] = last30Days.reverse().map(date => ({
                date,
                revenue: salesByDate[date].revenue,
                orders: salesByDate[date].orders
            }));

            // Calculate top products
            const productSales: { [key: string]: { quantity: number, revenue: number } } = {};

            orders?.forEach(order => {
                order.items.forEach((item: any) => {
                    if (!productSales[item.name]) {
                        productSales[item.name] = { quantity: 0, revenue: 0 };
                    }
                    productSales[item.name].quantity += item.quantity;
                    productSales[item.name].revenue += item.price * item.quantity;
                });
            });

            const topProductsData: ProductData[] = Object.entries(productSales)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10);

            setSalesData(salesChartData);
            setTopProducts(topProductsData);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        // TODO: Implement Excel export
        alert('Exportação para Excel será implementada em breve!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
                    <p className="text-muted-foreground">Análises e exportações de dados</p>
                </div>
                <Button onClick={exportToExcel}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Excel
                </Button>
            </div>

            {/* Period Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Período de Análise</CardTitle>
                    <CardDescription>Selecione o período para visualizar os relatórios</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Calendar className="mr-2 h-4 w-4" />
                            Últimos 7 dias
                        </Button>
                        <Button variant="default" size="sm">
                            <Calendar className="mr-2 h-4 w-4" />
                            Últimos 30 dias
                        </Button>
                        <Button variant="outline" size="sm">
                            <Calendar className="mr-2 h-4 w-4" />
                            Últimos 90 dias
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Charts */}
            <div className="space-y-4">
                <SalesChart data={salesData} title="Performance de Vendas" description="Receita diária" />
                <TopProductsChart data={topProducts} title="Top 10 Produtos" description="Por quantidade vendida" />
            </div>
        </div>
    );
}
