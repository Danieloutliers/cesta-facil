import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Tag, TrendingUp, ShoppingBag, DollarSign, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SalesChart } from '@/components/charts/SalesChart';
import { TopProductsChart } from '@/components/charts/TopProductsChart';
import { format, subDays } from 'date-fns';

interface DashboardStats {
    totalProducts: number;
    activeCategories: number;
    averagePrice: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    statusCounts: {
        processando: number;
        separando: number;
        em_rota: number;
        entregue: number;
        cancelado: number;
    };
}

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

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        activeCategories: 0,
        averagePrice: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        statusCounts: {
            processando: 0,
            separando: 0,
            em_rota: 0,
            entregue: 0,
            cancelado: 0
        }
    });
    const [salesData, setSalesData] = useState<SalesData[]>([]);
    const [topProducts, setTopProducts] = useState<ProductData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch products stats
            const { count: productsCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('active', true);

            const { count: categoriesCount } = await supabase
                .from('categories')
                .select('*', { count: 'exact', head: true })
                .neq('id', 'todos');

            const { data: products } = await supabase
                .from('products')
                .select('price')
                .eq('active', true);

            const avgPrice = products && products.length > 0
                ? products.reduce((sum, p) => sum + p.price, 0) / products.length
                : 0;

            // Fetch orders stats
            const { data: orders } = await supabase
                .from('orders')
                .select('*');

            const totalOrders = orders?.length || 0;
            // Cancelled orders must not inflate revenue, sales or top products.
            const validOrders = (orders ?? []).filter((order) => order.status !== 'cancelado');
            const totalRevenue = validOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
            const pendingOrders = orders?.filter(o => ['processando', 'separando', 'em_rota'].includes(o.status)).length || 0;

            // Generate sales data for last 30 days
            const salesByDate: { [key: string]: { revenue: number, orders: number } } = {};
            const last30Days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'dd/MM'));

            last30Days.forEach(date => {
                salesByDate[date] = { revenue: 0, orders: 0 };
            });

            validOrders.forEach(order => {
                const orderDate = format(new Date(order.created_at), 'dd/MM');
                if (salesByDate[orderDate]) {
                    salesByDate[orderDate].revenue += Number(order.total) || 0;
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

            validOrders.forEach(order => {
                const items = (order.items ?? []) as Array<{ name?: string; quantity?: number; price?: number }>;
                items.forEach((item) => {
                    if (!item.name) return;
                    if (!productSales[item.name]) {
                        productSales[item.name] = { quantity: 0, revenue: 0 };
                    }
                    const quantity = Number(item.quantity) || 0;
                    const price = Number(item.price) || 0;
                    productSales[item.name].quantity += quantity;
                    productSales[item.name].revenue += price * quantity;
                });
            });

            const topProductsData: ProductData[] = Object.entries(productSales)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            // Calculate status counts
            const statusCounts = {
                processando: orders?.filter(o => o.status === 'processando').length || 0,
                separando: orders?.filter(o => o.status === 'separando').length || 0,
                em_rota: orders?.filter(o => o.status === 'saiu_para_entrega' || o.status === 'em_rota').length || 0,
                entregue: orders?.filter(o => o.status === 'entregue').length || 0,
                cancelado: orders?.filter(o => o.status === 'cancelado').length || 0
            };

            setStats({
                totalProducts: productsCount || 0,
                activeCategories: categoriesCount || 0,
                averagePrice: avgPrice,
                totalOrders,
                totalRevenue,
                pendingOrders,
                statusCounts
            });

            setSalesData(salesChartData);
            setTopProducts(topProductsData);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Visão geral do seu negócio</p>
            </div>

            {/* Funil de Pedidos */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-5">
                <Card className="border border-amber-200/80 bg-amber-500/5 dark:bg-amber-950/20 dark:border-amber-900/50 shadow-xs">
                    <CardHeader className="p-4 pb-1">
                        <CardTitle className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                            Processando
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        <div className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-300 tabular-nums">
                            {loading ? '-' : stats.statusCounts.processando}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Aguardando separação</p>
                    </CardContent>
                </Card>

                <Card className="border border-blue-200/80 bg-blue-500/5 dark:bg-blue-950/20 dark:border-blue-900/50 shadow-xs">
                    <CardHeader className="p-4 pb-1">
                        <CardTitle className="text-xs font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
                            Separando
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        <div className="text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-300 tabular-nums">
                            {loading ? '-' : stats.statusCounts.separando}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Em montagem</p>
                    </CardContent>
                </Card>

                <Card className="border border-purple-200/80 bg-purple-500/5 dark:bg-purple-950/20 dark:border-purple-900/50 shadow-xs">
                    <CardHeader className="p-4 pb-1">
                        <CardTitle className="text-xs font-semibold text-purple-800 dark:text-purple-400 uppercase tracking-wider">
                            Em Rota
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        <div className="text-2xl font-bold tracking-tight text-purple-900 dark:text-purple-300 tabular-nums">
                            {loading ? '-' : stats.statusCounts.em_rota}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Com entregador</p>
                    </CardContent>
                </Card>

                <Card className="border border-emerald-200/80 bg-emerald-500/5 dark:bg-emerald-950/20 dark:border-emerald-900/50 shadow-xs">
                    <CardHeader className="p-4 pb-1">
                        <CardTitle className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                            Entregue
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        <div className="text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-300 tabular-nums">
                            {loading ? '-' : stats.statusCounts.entregue}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Finalizados</p>
                    </CardContent>
                </Card>

                <Card className="border border-red-200/80 bg-red-500/5 dark:bg-red-950/20 dark:border-red-900/50 shadow-xs">
                    <CardHeader className="p-4 pb-1">
                        <CardTitle className="text-xs font-semibold text-red-800 dark:text-red-400 uppercase tracking-wider">
                            Cancelado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        <div className="text-2xl font-bold tracking-tight text-red-900 dark:text-red-300 tabular-nums">
                            {loading ? '-' : stats.statusCounts.cancelado}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Descartados</p>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : stats.totalOrders}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.pendingOrders} em andamento
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : `R$ ${stats.totalRevenue.toFixed(2).replace('.', ',')}`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Média: R$ {stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2).replace('.', ',') : '0,00'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : stats.pendingOrders}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Processando, separando ou em rota
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : stats.totalProducts}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalProducts > 0 ? 'Produtos ativos' : 'Nenhum produto cadastrado'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Categorias Ativas</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : stats.activeCategories}
                        </div>
                        <p className="text-xs text-muted-foreground">Todas visíveis</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : `R$ ${stats.averagePrice.toFixed(2).replace('.', ',')}`}
                        </div>
                        <p className="text-xs text-muted-foreground">Por produto</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                <SalesChart data={salesData} title="Vendas Diárias" description="Últimos 30 dias" />
                <TopProductsChart data={topProducts} title="Top 5 Produtos" description="Mais vendidos" />
            </div>
        </div>
    );
};

export default Dashboard;

