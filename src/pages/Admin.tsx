import { useState } from 'react';
import { Package, DollarSign, Clock, Check, TrendingUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { Order } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig = {
  processando: { label: 'Processando', color: 'bg-warning text-warning-foreground' },
  separando: { label: 'Separando', color: 'bg-primary text-primary-foreground' },
  em_rota: { label: 'Em Rota', color: 'bg-blue-500 text-white' },
  entregue: { label: 'Entregue', color: 'bg-success text-success-foreground' },
};

const statusOrder: Order['status'][] = ['processando', 'separando', 'em_rota', 'entregue'];

const Admin = () => {
  const { orders } = useCart();
  const [ordersState, setOrdersState] = useState(orders);

  // Simulated metrics
  const totalOrders = ordersState.length;
  const pendingOrders = ordersState.filter((o) => o.status !== 'entregue').length;
  const totalRevenue = ordersState.reduce((sum, o) => sum + o.total, 0);
  const deliveredToday = ordersState.filter((o) => o.status === 'entregue').length;

  const updateOrderStatus = (orderId: string) => {
    setOrdersState((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const currentIndex = statusOrder.indexOf(order.status);
          const nextStatus = statusOrder[Math.min(currentIndex + 1, statusOrder.length - 1)];
          return { ...order, status: nextStatus };
        }
        return order;
      })
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie pedidos e acompanhe métricas</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total de Pedidos', value: totalOrders, icon: Package, color: 'text-primary' },
            { label: 'Pedidos Pendentes', value: pendingOrders, icon: Clock, color: 'text-warning' },
            { label: 'Faturamento', value: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, icon: DollarSign, color: 'text-success' },
            { label: 'Entregues Hoje', value: deliveredToday, icon: Check, color: 'text-blue-500' },
          ].map((metric, index) => (
            <div key={index} className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <metric.icon className={cn("h-6 w-6", metric.color)} />
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mb-1">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="font-semibold text-lg">Pedidos Recentes</h2>
          </div>

          {ordersState.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Nenhum pedido encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pedido</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Itens</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersState.map((order) => {
                    const status = statusConfig[order.status];
                    const isDelivered = order.status === 'entregue';

                    return (
                      <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{order.address.city}, {order.address.state}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{order.items.reduce((sum, i) => sum + i.quantity, 0)} itens</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                            status.color
                          )}>
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isDelivered}
                            onClick={() => updateOrderStatus(order.id)}
                          >
                            {isDelivered ? 'Concluído' : 'Avançar'}
                            {!isDelivered && <ChevronDown className="h-3 w-3 rotate-[-90deg]" />}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
