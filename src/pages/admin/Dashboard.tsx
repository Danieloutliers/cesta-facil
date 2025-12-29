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
        pendingOrders: 0
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
            const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
            const pendingOrders = orders?.filter(o => ['processando', 'separando', 'em_rota'].includes(o.status)).length || 0;

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
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            setStats({
                totalProducts: productsCount || 0,
                activeCategories: categoriesCount || 0,
                averagePrice: avgPrice,
                totalOrders,
                totalRevenue,
                pendingOrders
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
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">Visão geral do seu negócio</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <div className="grid gap-4 md:grid-cols-2">
                <SalesChart data={salesData} title="Vendas Diárias" description="Últimos 30 dias" />
                <TopProductsChart data={topProducts} title="Top 5 Produtos" description="Mais vendidos" />
            </div>
        </div>
    );
};

export default Dashboard;
