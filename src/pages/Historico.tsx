import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Truck, Check, RefreshCw, ArrowRight, ShoppingCart, XCircle, AlertCircle, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
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
import { calculatePaymentSchedule } from '@/lib/financial';

const statusConfig = {
  processando: { label: 'Processando', icon: Clock, color: 'text-warning bg-warning/10' },
  separando: { label: 'Separando', icon: Package, color: 'text-primary bg-primary/10' },
  saiu_para_entrega: { label: 'Saiu p/ Entrega', icon: Truck, color: 'text-blue-500 bg-blue-500/10' },
  em_rota: { label: 'Em Rota', icon: Truck, color: 'text-blue-500 bg-blue-500/10' },
  entregue: { label: 'Entregue', icon: Check, color: 'text-success bg-success/10' },
  cancelado: { label: 'Cancelado', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
};

const OrderCard = ({
  order,
  onRepeat,
  onEdit,
  onCancel,
  isCancelling
}: {
  order: Order;
  onRepeat: (order: Order) => void;
  onEdit: (order: Order) => void;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}) => {
  const [showItems, setShowItems] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const status = statusConfig[order.status] || statusConfig['processando'];
  const StatusIcon = status.icon;
  const canCancel = order.status === 'processando';
  const schedule = calculatePaymentSchedule(order, null);

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
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all group">
      {/* Header Row: Info + Price */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
        <div className="space-y-2 w-full md:w-auto">
          <div className="flex items-center justify-between md:justify-start gap-2 flex-wrap">
            <h3 className="font-bold text-base md:text-lg">{order.id}</h3>
            <div className="flex gap-2 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
                status.color
              )}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
              {order.paymentMethod && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                  {order.paymentMethod === 'credit_card' ? '💳 Crédito' :
                    order.paymentMethod === 'debit_card' ? '💳 Débito' :
                      order.paymentMethod === 'money' ? '💵 Dinheiro' :
                        order.paymentMethod === 'carnet' ? '📋 Carnê' :
                          order.paymentMethod === 'pix' ? '📱 PIX' : order.paymentMethod}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="font-medium">Pedido:</span> {formatDate(order.createdAt)}
            </p>
            {order.estimatedDelivery && (
              <p className="text-xs md:text-sm text-blue-600 font-medium flex items-center gap-1">
                <Truck className="h-3 w-3" />
                <span>Entrega: {new Date(order.estimatedDelivery).toLocaleDateString('pt-BR')}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-row md:flex-col justify-between md:justify-end items-center md:items-end w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 mt-1 md:mt-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider md:hidden">Total do Pedido</p>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider hidden md:block">Total</p>
            <p className="font-bold text-lg md:text-xl text-primary">
              R$ {order.total.toFixed(2).replace('.', ',')}
            </p>
            {order.installments && order.installments > 1 && (
              <p className="text-xs text-muted-foreground">
                {order.installments}x de R$ {(order.total / order.installments).toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* View Items Toggle Button */}
      {/* View Toggles */}
      <div className="flex gap-3 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowItems(!showItems)}
          className="flex-1 border border-dashed border-border hover:bg-secondary/50"
        >
          {showItems ? (
            <>Esconder Itens <ChevronUp className="h-4 w-4 ml-2" /></>
          ) : (
            <>Ver {order.items.length} Itens <ChevronDown className="h-4 w-4 ml-2" /></>
          )}
        </Button>

        {schedule.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSchedule(!showSchedule)}
            className="flex-1 border border-dashed border-border hover:bg-secondary/50"
          >
            {showSchedule ? (
              <>Esconder Parcelas <ChevronUp className="h-4 w-4 ml-2" /></>
            ) : (
              <>Ver Parcelas <ChevronDown className="h-4 w-4 ml-2" /></>
            )}
          </Button>
        )}
      </div>

      {/* Items Scroll */}
      {showItems && (
        <div className="animate-in slide-in-from-top-2 duration-200 mb-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0 scrollbar-hide">
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
                <p className="text-[10px] text-center mt-1 w-14 truncate">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule List */}
      {showSchedule && schedule.length > 0 && (
        <div className="animate-in slide-in-from-top-2 duration-200 mb-4">
          <div className="px-0 pt-2 pb-2 border-t border-border/50">
            <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              Cronograma de Parcelas
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {schedule.map(inst => (
                <div key={inst.number} className="bg-muted/30 border border-border/50 rounded-lg p-2.5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{inst.number}ª Parcela</span>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-xs font-medium text-foreground">{inst.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                    <span className="text-xs font-bold text-primary">R$ {inst.value.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                    onClick={() => onCancel(order.id)}
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
              onClick={() => onEdit(order)}
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
            onClick={() => onRepeat(order)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Repetir
          </Button>
        </div>
      </div>
    </div>
  );
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
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onRepeat={handleRepeatOrder}
                onEdit={handleEditOrder}
                onCancel={handleCancelOrder}
                isCancelling={isCancelling}
              />
            ))}
          </div>
        )}
      </main>

      <MobileNavBar />
      <Footer />
    </div>
  );
};

export default Historico;
