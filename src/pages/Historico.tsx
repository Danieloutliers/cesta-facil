import { useNavigate } from 'react-router-dom';
import { Package, Clock, Truck, Check, RefreshCw, ArrowRight, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNavBar } from '@/components/MobileNavBar';
import { useCart } from '@/contexts/CartContext';
import { Order } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig = {
  processando: { label: 'Processando', icon: Clock, color: 'text-warning bg-warning/10' },
  separando: { label: 'Separando', icon: Package, color: 'text-primary bg-primary/10' },
  em_rota: { label: 'Em Rota', icon: Truck, color: 'text-blue-500 bg-blue-500/10' },
  entregue: { label: 'Entregue', icon: Check, color: 'text-success bg-success/10' },
};

const Historico = () => {
  const navigate = useNavigate();
  const { orders, repeatOrder } = useCart();

  const handleRepeatOrder = (order: Order) => {
    repeatOrder(order);
    navigate('/montar-cesta');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 pb-24 md:pb-8">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-4 py-1 text-sm font-medium mb-4">
            📦 Meus Pedidos
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Histórico de Pedidos
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seus pedidos e repita suas cestas favoritas
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto mb-6">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Nenhum pedido ainda</h2>
            <p className="text-muted-foreground mb-6">
              Você ainda não fez nenhum pedido. Que tal montar sua primeira cesta?
            </p>
            <Button onClick={() => navigate('/montar-cesta')}>
              Montar Minha Cesta
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={order.id}
                  className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{order.id}</h3>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          status.color
                        )}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-semibold text-primary">
                          R$ {order.total.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRepeatOrder(order)}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Repetir
                      </Button>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {order.items.slice(0, 6).map((item) => (
                      <div key={item.id} className="relative shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        {item.quantity > 1 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                    ))}
                    {order.items.length > 6 && (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                        +{order.items.length - 6}
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground ml-2">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} itens
                    </span>
                  </div>

                  {/* Delivery Info */}
                  <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Entrega:</span>{' '}
                      {order.address.street}, {order.address.number}
                      {order.address.complement && `, ${order.address.complement}`} -{' '}
                      {order.address.neighborhood}, {order.address.city}/{order.address.state}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <MobileNavBar />
      <Footer />
    </div>
  );
};

export default Historico;
