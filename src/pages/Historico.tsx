import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Truck, Check, RefreshCw, ArrowRight, ShoppingCart, XCircle, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNavBar } from '@/components/MobileNavBar';
import { useCart } from '@/contexts/CartContext';
import { Order } from '@/types';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const statusConfig = {
  processando: { label: 'Processando', icon: Clock, color: 'text-warning bg-warning/10' },
  separando: { label: 'Separando', icon: Package, color: 'text-primary bg-primary/10' },
  saiu_para_entrega: { label: 'Saiu p/ Entrega', icon: Truck, color: 'text-blue-500 bg-blue-500/10' },
  em_rota: { label: 'Em Rota', icon: Truck, color: 'text-blue-500 bg-blue-500/10' },
  entregue: { label: 'Entregue', icon: Check, color: 'text-success bg-success/10' },
  cancelado: { label: 'Cancelado', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
};

const Historico = () => {
  const navigate = useNavigate();
  const { orders, repeatOrder, refreshOrders, startEditingOrder } = useCart();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleRepeatOrder = (order: Order) => {
    repeatOrder(order);
    navigate('/montar-cesta');
  };

  const handleEditOrder = (order: Order) => {
    startEditingOrder(order);
    navigate('/montar-cesta');
  };

  const handleCancelOrder = async (orderId: string) => {
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelado' })
        .eq('order_number', orderId); // Assuming order.id is mapped to order_number in CartContext loading

      if (error) throw error;

      await refreshOrders();

      toast({
        title: "Pedido cancelado",
        description: "Seu pedido foi cancelado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
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
              const status = statusConfig[order.status] || statusConfig['processando'];
              const StatusIcon = status.icon;
              const canCancel = order.status === 'processando';

              return (
                <div
                  key={order.id}
                  className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all group"
                >
                  {/* Header Row: Info + Price */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base md:text-lg">{order.id}</h3>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
                          status.color
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</p>
                      <p className="font-bold text-lg text-primary">
                        R$ {order.total.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>

                  {/* Items Scroll */}
                  <div className="flex items-center gap-3 overflow-x-auto pb-4 -mx-5 px-5 md:mx-0 md:px-0 scrollbar-hide">
                    {order.items.map((item, index) => (
                      <div key={index} className="relative shrink-0 group/item">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-14 w-14 rounded-xl object-cover ring-1 ring-border/50 shadow-sm"
                        />
                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm ring-2 ring-background">
                          {item.quantity}
                        </span>
                      </div>
                    ))}
                    <div className="flex flex-col justify-center h-14 px-2">
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {order.items.length} itens
                      </span>
                    </div>
                  </div>

                  {/* Footer: Address + Actions */}
                  <div className="mt-2 pt-4 border-t border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {order.address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg md:bg-transparent md:p-0">
                        <Truck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="line-clamp-2 md:line-clamp-1">
                          <span className="font-semibold text-foreground mr-1">Entrega:</span>
                          {typeof order.address === 'string'
                            ? order.address
                            : `${order.address.street}, ${order.address.number} - ${order.address.neighborhood}, ${order.address.city}/${order.address.state}`
                          }
                        </span>
                      </div>
                    )}

                    {/* Action Buttons Grid */}
                    <div className="grid grid-cols-2 md:flex items-center gap-3 w-full md:w-auto">
                      {canCancel && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full md:w-auto text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                              disabled={isCancelling}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar Pedido?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja cancelar o pedido {order.id}?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Voltar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelOrder(order.id)}
                                className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                              >
                                Sim, Cancelar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {canCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full md:w-auto text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          onClick={() => handleEditOrder(order)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      )}

                      <Button
                        variant="default" // Primary style for 'buy again'
                        size="sm"
                        className={cn(
                          "w-full md:w-auto shadow-sm",
                          canCancel ? "col-span-2 md:col-span-1" : "col-span-2 md:col-span-1"
                        )}
                        onClick={() => handleRepeatOrder(order)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Repetir
                      </Button>
                    </div>
                  </div>
                </div>);
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
