import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Order, CartItem } from "@/types";
import { generateReceiptMessage } from "@/utils/receipt";
import { BOT_API_URL } from "@/config/bot";
import { Button } from "@/components/ui/button";
import { CustomerRegistrationForm } from "@/components/delivery/CustomerRegistrationForm";
import { ChevronLeft, Package, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface OrderWithUser extends Order {
    user: {
        phone: string;
        name?: string;
    };
}

const DeliveryOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderWithUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            // Handle both full UUID or partial ID if possible, but for now strict match on ID or order_number
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    user:users!user_id (
                        phone,
                        name
                    )
                `)
                .eq('order_number', id)
                .single();

            if (error) throw error;

            const transformedOrder: OrderWithUser = {
                id: data.order_number,
                items: data.items,
                budget: Number(data.budget),
                total: Number(data.total),
                savings: Number(data.savings),
                status: data.status,
                address: data.address,
                missingItemPreference: data.missing_item_preference,
                createdAt: data.created_at,
                paymentMethod: data.payment_method,
                installments: data.installments,
                user: {
                    phone: data.user?.phone || 'N/A',
                    name: data.user?.name,
                },
            };

            setOrder(transformedOrder);
        } catch (error) {
            console.error("Error loading order:", error);
            toast.error("Pedido não encontrado");
            navigate("/delivery");
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrationSubmit = async (values: any) => {
        if (!order) return;
        setSubmitting(true);

        try {
            // 1. Update Order Status and Payment Info
            const { error: orderError } = await supabase
                .from('orders')
                .update({
                    status: 'entregue',
                    payment_method: values.paymentMethod,
                    installments: values.installments,
                    delivery_date: new Date().toISOString(),
                    // Save both day (for simple compatibility) and full date (as requested)
                    payment_day: values.paymentDate ? values.paymentDate.getDate() : null,
                    payment_date: values.paymentDate ? values.paymentDate.toISOString() : null
                })
                .eq('order_number', order.id);

            if (orderError) throw orderError;

            // 2. Upsert Customer/Consumer Data


            const { error: consumerError } = await supabase
                .from('consumers')
                .upsert({
                    phone: values.phone,
                    full_name: values.fullName,
                    cpf: values.cpf,
                    rg: values.rg,
                    address: {
                        street: values.street,
                        number: values.number,
                        neighborhood: values.neighborhood,
                        city: values.city,
                        complement: values.complement
                    },
                    payment_preference: values.paymentMethod,
                    last_order_total: order.total,
                    last_order_number: order.id,
                    payment_day: values.paymentDate ? values.paymentDate.getDate() : null,
                    payment_date: values.paymentDate ? values.paymentDate.toISOString() : null,
                    last_delivery_date: new Date().toISOString(),
                    last_installments: values.installments
                }, {
                    onConflict: 'phone'
                });

            if (consumerError) {
                console.error('❌ Erro ao salvar consumidor:', consumerError);
            } else {


                // 2b. Generate Receivables (Financial System)
                if (values.installments && values.installments > 0) {
                    // Start from next month usually, or based on logic.
                    // If method is 'carnet' or just general installment tracking
                    try {
                        // Need the consumer ID. If upsert returned data? 
                        // Supabase upsert doesn't return ID by default unless select() is called.
                        // Let's refetch or assume we can get it from the phone query if needed, 
                        // BUT upsert SHOULD return it if we chain .select().
                        // Optimizing: Let's chain .select() to the upsert above.

                        // Wait, I can't edit the upsert call easily in this single block replacement if it's outside.
                        // I will fetch the consumer ID by phone to be safe.
                        const { data: consumerData } = await supabase
                            .from('consumers')
                            .select('id')
                            .eq('phone', values.phone)
                            .single();

                        if (consumerData) {
                            const { generateReceivablesData } = await import("@/utils/financial");
                            const receivables = generateReceivablesData(
                                order.id,
                                consumerData.id,
                                order.total,
                                values.installments,
                                values.paymentDate
                            );

                            const { error: finError } = await supabase
                                .from('receivables')
                                .insert(receivables);

                            if (finError) console.error("❌ Erro ao gerar contas a receber:", finError);
                            else { }
                        }
                    } catch (finErr) {
                        console.error("Erro processamento financeiro:", finErr);
                    }
                }
            }

            // 3. Send WhatsApp Messages (Delivered Template + Receipt)
            try {
                if (values.phone) {


                    // 3.1 Generate Receipt Content
                    const receiptMessage = generateReceiptMessage({
                        orderId: order.id,
                        customerName: values.fullName,
                        deliveryDate: new Date(),
                        total: order.total,
                        paymentMethod: values.paymentMethod,
                        installments: values.installments,
                        paymentDate: values.paymentDate
                    });

                    // 3.2 Fetch Templates & Send
                    fetch(`${BOT_API_URL}/templates`)
                        .then(res => res.json())
                        .then(async (templates) => {
                            // A. Send "Delivered" Template Message
                            const defaultDelivered = "Pedido entregue! ✅\n\nObrigado pela preferência, {nome}!\nPedido #{pedido} foi entregue com sucesso.";
                            let deliveredMsg = templates?.delivered || defaultDelivered;

                            deliveredMsg = deliveredMsg
                                .replace('{nome}', values.fullName || order.user.name || 'Cliente')
                                .replace('{pedido}', order.id.slice(-4));

                            await fetch(`${BOT_API_URL}/send`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    phone: values.phone,
                                    message: deliveredMsg
                                })
                            });

                            // Short delay to ensure ordering
                            await new Promise(r => setTimeout(r, 800));

                            // B. Send Detailed Receipt
                            return fetch(`${BOT_API_URL}/send`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    phone: values.phone,
                                    message: receiptMessage
                                })
                            });
                        })
                        .then(async (res) => {
                            if (res && res.ok) {
                                toast.success("Mensagens de confirmação enviadas!");
                            } else {
                                console.warn("Falha no segundo envio WP:", await res?.text());
                                toast.warning("Entrega registrada. Verifique o envio do comprovante.");
                            }
                        })
                        .catch(err => {
                            console.error("Erro rede WP:", err);
                        });
                }
            } catch (wpError) {
                console.error("Erro ao preparar envio WP:", wpError);
            }

            toast.success("Entrega finalizada com sucesso!");
            navigate("/delivery");

        } catch (error) {
            console.error("Error completing delivery:", error);
            toast.error("Erro ao finalizar entrega. Tente novamente.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando pedido...</div>;
    if (!order) return null;

    return (
        <div className="space-y-4">
            {/* Header nav */}
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/delivery")}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-bold">Pedido #{order.id.slice(-4)}</h2>
            </div>

            <Tabs defaultValue="registration" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="info">Itens e Detalhes</TabsTrigger>
                    <TabsTrigger value="registration">Finalizar Entrega</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-gray-500" />
                                    Itens do Pedido ({order.items.length})
                                </h3>
                                <div className="space-y-2">
                                    {order.items.map((item: CartItem, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm py-2 border-b last:border-0 border-dashed">
                                            <span className="text-gray-700">
                                                <span className="font-bold mr-2">{item.quantity}x</span>
                                                {item.name}
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                R$ {(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center text-lg font-bold text-green-700">
                                <span>Total</span>
                                <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="registration" className="mt-4">
                    <Card>
                        <CardContent className="p-4">
                            <CustomerRegistrationForm
                                order={order}
                                onSubmit={handleRegistrationSubmit}
                                isLoading={submitting}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default DeliveryOrderDetail;
