import { useState, useEffect } from "react";
import { Bell, Package, CheckCircle, Clock, Truck, XCircle, ShoppingBag, User } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface OrderNotification {
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    total: number;
}

export function Notifications() {
    const [orders, setOrders] = useState<OrderNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchOrders = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('orders')
            .select('id, order_number, status, created_at, total')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setOrders(data);
            const active = data.filter(o => !['entregue', 'cancelado'].includes(o.status)).length;
            setUnreadCount(active);
        }
    };

    useEffect(() => {
        if (open) fetchOrders();
    }, [open, user]);

    useEffect(() => {
        fetchOrders();

        if (!user) return;

        const channel = supabase
            .channel('public:orders')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            // Safely remove channel
            supabase.removeChannel(channel).catch(err => console.error("Error removing channel:", err));
        };
    }, [user]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'entregue': return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
            case 'cancelado': return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
            case 'processando': return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
            case 'separando': return <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
            case 'em_rota': return <Truck className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
            default: return <ShoppingBag className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'processando': return 'Processando';
            case 'separando': return 'Separando';
            case 'em_rota': return 'Em Rota';
            case 'entregue': return 'Entregue';
            case 'cancelado': return 'Cancelado';
            default: return status;
        }
    };

    const handleClickOrder = (orderId: string) => {
        setOpen(false);
        navigate(`/meus-pedidos?highlight=${orderId}`);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary-foreground/10 transition-colors">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-primary animate-pulse" />
                    )}
                    <span className="sr-only">Notificações</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0 shadow-2xl border-0 ring-1 ring-black/5" align="end" sideOffset={8}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-transparent border-b">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm">Notificações</h4>
                            <p className="text-xs text-muted-foreground">Suas atualizações recentes</p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                            {unreadCount} novas
                        </Badge>
                    )}
                </div>

                {/* Content */}
                {!user ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">Faça login</p>
                        <p className="text-xs text-muted-foreground max-w-[200px]">
                            Acesse sua conta para ver o status dos seus pedidos.
                        </p>
                        <Button size="sm" variant="outline" onClick={() => navigate('/login')}>
                            Entrar agora
                        </Button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
                        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Tudo limpo por aqui</p>
                        <p className="text-xs text-muted-foreground">
                            Nenhum pedido recente encontrado.
                        </p>
                    </div>
                ) : (
                    <div className="h-[350px] overflow-y-auto custom-scrollbar">
                        <div className="p-2 space-y-1">
                            {orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="w-full flex items-start gap-3 p-3 text-left rounded-lg hover:bg-muted/50 transition-all duration-200 group border border-transparent hover:border-border/50 cursor-pointer"
                                    onClick={() => handleClickOrder(order.order_number)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            handleClickOrder(order.order_number);
                                        }
                                    }}
                                >
                                    <div className={cn(
                                        "mt-0.5 p-2 rounded-full shrink-0 transition-colors",
                                        order.status === 'entregue' ? "bg-green-100 dark:bg-green-900/30" :
                                            order.status === 'cancelado' ? "bg-red-100 dark:bg-red-900/30" :
                                                "bg-blue-100 dark:bg-blue-900/30"
                                    )}>
                                        {getStatusIcon(order.status)}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                                Pedido #{order.order_number}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground tabular-nums">
                                                {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs">
                                            <span className={cn(
                                                "font-medium",
                                                order.status === 'entregue' ? "text-green-600 dark:text-green-400" :
                                                    order.status === 'cancelado' ? "text-red-600 dark:text-red-400" :
                                                        "text-muted-foreground"
                                            )}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                R$ {Number(order.total).toFixed(2)}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50 mt-2 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {user && orders.length > 0 && (
                    <div className="p-2 border-t bg-muted/10 text-center">
                        <Button variant="link" size="sm" className="text-xs h-auto py-1" onClick={() => navigate('/historico')}>
                            Ver histórico completo
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
