import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, User, Phone, CheckCircle2, List, Map as MapIcon, RotateCw, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateDistance, getCoordinates, getStoreLocation } from "@/lib/location";
import { BOT_API_URL } from "@/config/bot";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

// Lazy load Map to prevent Leaflet issues blocking main thread or bundling
const DeliveryMap = lazy(() => import("@/components/delivery/DeliveryMap").then(module => ({ default: module.DeliveryMap })));

interface OrderWithUser extends Order {
    user: {
        phone: string;
        name?: string;
    };
    distance?: number; // Distance from store in km
}

type SortOption = 'newest' | 'optimized' | 'neighborhood';

const RouteList = () => {
    const [orders, setOrders] = useState<OrderWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const navigate = useNavigate();

    useEffect(() => {
        loadRouteOrders();
    }, []);

    const loadRouteOrders = async () => {
        setLoading(true);


        // Safety timeout
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.error("Load timeout reached");
                setLoading(false);
                toast.error("Tempo excedido ao carregar. Tente novamente.");
            }
        }, 8000);

        try {

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    user:users!user_id (
                        phone,
                        name
                    )
                `)
                .in('status', ['separando', 'em_rota'])
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }



            let transformedOrders: OrderWithUser[] = data.map((row: any) => ({
                id: row.order_number || row.id,
                items: row.items,
                budget: Number(row.budget),
                total: Number(row.total),
                savings: Number(row.savings),
                status: row.status,
                address: row.address,
                missingItemPreference: row.missing_item_preference,
                createdAt: row.created_at,
                estimatedDelivery: row.estimated_delivery,
                paymentMethod: row.payment_method,
                installments: row.installments,
                user: {
                    phone: row.user?.phone || 'N/A',
                    name: row.user?.name,
                },
            }));

            // Calc distances (Optimist logic - can be refined to be triggered manually for performance)
            // For now, we just load them. Sort happens locally.
            setOrders(transformedOrders);
        } catch (error) {
            console.error("Error loading route:", error);
            toast.error("Erro ao carregar rota. Verifique o console.");
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    };

    const handleSort = async (option: SortOption) => {
        setSortBy(option);
        if (option === 'optimized') {
            toast.info("Otimizando rota por proximidade...");
            const storeLoc = getStoreLocation();
            const ordersWithDist = await Promise.all(orders.map(async (o) => {
                const addressStr = `${o.address.street}, ${o.address.number}, ${o.address.neighborhood}`;
                const coords = await getCoordinates(addressStr);
                const dist = coords ? calculateDistance(storeLoc, coords) : 9999;
                return { ...o, distance: dist };
            }));

            setOrders(ordersWithDist.sort((a, b) => (a.distance || 0) - (b.distance || 0)));
            toast.success("Rota otimizada!");
        } else if (option === 'neighborhood') {
            setOrders([...orders].sort((a, b) => a.address.neighborhood.localeCompare(b.address.neighborhood)));
            toast.success("Agrupado por bairro!");
        } else {
            // Default: Newest first (actually the query returns oldest first usually for FIFO, but let's stick to created_at)
            // Re-fetch to reset order properly or just sort by date
            setOrders([...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        }
    };

    const handleStartDelivery = async (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation();

        // Find order details for message
        const orderIndex = orders.findIndex(o => o.id === orderId);
        const order = orders[orderIndex];

        if (!order) return;

        try {
            // 1. Update DB Status
            const { error } = await supabase
                .from('orders')
                .update({ status: 'em_rota' })
                .eq('order_number', orderId);

            if (error) throw error;

            // 2. Local State Update
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'em_rota' } : o));
            toast.success("Pedido em rota!");

            // 3. Send WhatsApp Notification (Non-blocking)
            if (order.user?.phone) {
                // Fetch templates first
                fetch(`${BOT_API_URL}/templates`)
                    .then(res => res.json())
                    .then(templates => {
                        let message = templates?.out_for_delivery ||
                            "Oba {nome}! 🚚\n\nSeu pedido #{pedido} saiu para entrega!\nEm breve chegará no endereço:\n{endereco}";

                        // Replace variables
                        const addressStr = `${order.address.street}, ${order.address.number} - ${order.address.neighborhood}`;
                        message = message
                            .replace('{nome}', order.user.name || 'Cliente')
                            .replace('{pedido}', order.id.slice(-4))
                            .replace('{endereco}', addressStr);

                        // Send
                        return fetch(`${BOT_API_URL}/send`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                phone: order.user.phone,
                                message
                            })
                        });
                    })
                    .then(res => {
                        if (res && res.ok) { } // Success silently
                        else console.warn("Falha ao enviar mensagem de rota");
                    })
                    .catch(err => console.error("Erro no envio mensagens:", err));
            }

        } catch (error) {
            console.error("Error starting delivery:", error);
            toast.error("Erro ao iniciar entrega");
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 p-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    const pickupOrders = orders.filter(o => o.status === 'separando');
    const activeRouteOrders = orders.filter(o => o.status === 'em_rota');

    return (
        <div className="flex flex-col h-[calc(100vh-60px)]">
            <div className="px-4 py-2 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-xl font-bold text-gray-800">Minha Rota</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => loadRouteOrders()}>
                            <RotateCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2 items-center justify-between">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'map')} className="w-full max-w-[200px]">
                        <TabsList className="grid w-full grid-cols-2 h-9">
                            <TabsTrigger value="list" className="text-xs"><List className="h-3 w-3 mr-1" /> Lista</TabsTrigger>
                            <TabsTrigger value="map" className="text-xs"><MapIcon className="h-3 w-3 mr-1" /> Mapa</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {viewMode === 'list' && (
                        <div className="flex gap-1">
                            <Button
                                variant={sortBy === 'optimized' ? 'default' : 'ghost'}
                                size="sm"
                                className="h-9 px-2 text-xs"
                                onClick={() => handleSort('optimized')}
                            >
                                <Settings2 className="h-3 w-3 mr-1" /> Otimizar
                            </Button>
                            <Button
                                variant={sortBy === 'neighborhood' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-9 px-2 text-xs"
                                onClick={() => handleSort('neighborhood')}
                            >
                                Bairro
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1 p-4 bg-slate-50">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                        <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
                            <MapPin className="h-8 w-8 text-gray-300" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-700">Tudo entregue!</h2>
                        <p className="text-gray-400 text-sm mt-1">Nenhum pedido pendente.</p>
                        <Button variant="outline" className="mt-4" onClick={() => loadRouteOrders()}>
                            Atualizar
                        </Button>
                    </div>
                ) : (
                    <>
                        {viewMode === 'list' ? (
                            <div className="space-y-6 pb-20">
                                {/* Active Route Section */}
                                {activeRouteOrders.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                Em Rota ({activeRouteOrders.length})
                                            </h2>
                                        </div>
                                        {activeRouteOrders.map((order) => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                                isActive={true}
                                                onNavigate={() => navigate(`/delivery/order/${order.id}`)}
                                                onAction={() => navigate(`/delivery/order/${order.id}`)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Pickup Section */}
                                {pickupOrders.length > 0 && (
                                    <div className="space-y-3">
                                        <h2 className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                            Aguardando ({pickupOrders.length})
                                        </h2>
                                        {pickupOrders.map((order) => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                                isActive={false}
                                                onNavigate={() => navigate(`/delivery/order/${order.id}`)}
                                                onAction={(e) => handleStartDelivery(e, order.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Suspense fallback={<div className="h-60 w-full flex items-center justify-center bg-gray-100 rounded-xl">Carregando mapa...</div>}>
                                <DeliveryMap orders={orders} />
                            </Suspense>
                        )}
                    </>
                )}
            </ScrollArea>
        </div>
    );
};

// Extracted Component for cleaner code
const OrderCard = ({ order, isActive, onNavigate, onAction }: { order: OrderWithUser, isActive: boolean, onNavigate: () => void, onAction: (e: any) => void }) => (
    <Card
        className={`border-l-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer overflow-hidden ${isActive ? 'border-l-green-500 border-y-green-100 border-r-green-100 bg-green-50/20' : 'border-l-orange-400 border-gray-100'
            }`}
        onClick={onNavigate}
    >
        <CardContent className="p-0">
            <div className="p-4 flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Badge variant={isActive ? "default" : "outline"} className={`${isActive ? "bg-green-600" : "text-gray-500 border-gray-300"} text-[10px] px-1.5 h-5`}>
                            #{order.id.slice(-4)}
                        </Badge>
                        <h3 className="font-bold text-gray-800 text-sm line-clamp-1">
                            {order.user.name || "Cliente"}
                        </h3>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-gray-600 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">
                            {order.address.neighborhood}<br />
                            <span className="text-gray-400">{order.address.street}, {order.address.number}</span>
                        </span>
                    </div>
                    {order.distance && (
                        <div className="text-[10px] text-blue-600 font-medium ml-5">
                            Approx. {order.distance.toFixed(1)} km
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-gray-900 text-sm">
                        R$ {order.total.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[10px] text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Action Bar */}
            <div className={`p-2 flex gap-2 ${isActive ? 'bg-green-100/50' : 'bg-gray-50'}`}>
                <Button
                    className={`w-full h-8 text-xs font-medium shadow-none ${isActive
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-white hover:bg-gray-50 text-orange-600 border border-orange-200 hover:border-orange-300'
                        }`}
                    onClick={onAction}
                >
                    {isActive ? (
                        <>Finalizar <ArrowRight className="ml-1.5 h-3 w-3" /></>
                    ) : (
                        "Iniciar Entrega"
                    )}
                </Button>
            </div>
        </CardContent>
    </Card>
);

export default RouteList;
