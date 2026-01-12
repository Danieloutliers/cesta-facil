import { useState, useEffect } from 'react';
import { MessageCircle, Send, CheckCheck, ShoppingBag, Package, Clock, Truck, CheckCircle, XCircle, FileText, User, Tag, MapPin, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BOT_API_URL } from '@/config/bot';
import { supabase } from '@/lib/supabase';

interface Message {
    id: string;
    fromMe: boolean;
    body: string;
    timestamp: string;
}

interface Chat {
    chatId: string;
    name: string;
    phone: string;
    profilePic: string | null;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

interface OrderStats {
    orderCount: number;
    totalValue: number;
    lastOrderDate: string | null;
    lastOrderStatus: string | null;
    userId: string | null;
    crmStatus?: string;
    crmNotes?: string;
    consumerId?: string;
}

interface OrderHistoryItem {
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    items: any[];
}

export default function ChatPage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [orderStats, setOrderStats] = useState<Record<string, OrderStats>>({});

    // Estado do Modal de Histórico
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);

    // CRM States
    const [crmOpen, setCrmOpen] = useState(false);
    const [crmNotes, setCrmNotes] = useState('');
    const [crmStatus, setCrmStatus] = useState('novo');
    const [savingCrm, setSavingCrm] = useState(false);

    // Update CRM local state when selecting a chat
    useEffect(() => {
        if (selectedChat && orderStats[selectedChat.chatId]) {
            setCrmNotes(orderStats[selectedChat.chatId].crmNotes || '');
            setCrmStatus(orderStats[selectedChat.chatId].crmStatus || 'novo');
        } else {
            setCrmNotes('');
            setCrmStatus('novo');
        }
    }, [selectedChat, orderStats]);

    const saveCrmData = async () => {
        if (!selectedChat || !orderStats[selectedChat.chatId]?.consumerId) {
            // Se não tem consumerId, tenta achar ou criar? Por enquanto só alerta
            alert("Este contato ainda não está vinculado a um consumer no banco de dados.");
            return;
        }

        setSavingCrm(true);
        try {
            const { error } = await supabase
                .from('consumers')
                .update({
                    crm_notes: crmNotes,
                    crm_status: crmStatus
                })
                .eq('id', orderStats[selectedChat.chatId].consumerId);

            if (error) throw error;

            // Update local state
            setOrderStats(prev => ({
                ...prev,
                [selectedChat.chatId]: {
                    ...prev[selectedChat.chatId],
                    crmNotes,
                    crmStatus
                }
            }));

            // alert('Salvo com sucesso!'); (Opcional, melhor usar toast se tivesse)
        } catch (error) {
            console.error('Erro ao salvar CRM:', error);
            alert('Erro ao salvar dados.');
        } finally {
            setSavingCrm(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'entregue': return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelado': return 'bg-red-100 text-red-700 border-red-200';
            case 'processando': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'separando': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'entregue': return <CheckCircle className="h-3 w-3 mr-1" />;
            case 'cancelado': return <XCircle className="h-3 w-3 mr-1" />;
            case 'processando': return <Clock className="h-3 w-3 mr-1" />;
            case 'separando': return <Package className="h-3 w-3 mr-1" />;
            default: return <ShoppingBag className="h-3 w-3 mr-1" />;
        }
    };

    const fetchOrderHistory = async (userId: string) => {
        setHistoryLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (data) setOrderHistory(data);
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Buscar estatísticas de pedidos (Busca em USERS e PROTEGE contra user_id nulo)
    const getOrderStats = async (phone: string): Promise<OrderStats> => {
        try {
            // 1. Limpar o número
            let cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.length < 8) return { orderCount: 0, totalValue: 0, lastOrderDate: null, lastOrderStatus: null, userId: null };

            // 2. Preparar busca Fuzzy (últimos 8 dígitos)
            const suffix = cleanPhone.slice(-8);
            const part1 = suffix.slice(0, 4);
            const part2 = suffix.slice(4);
            const fuzzySearch = `%${part1}%${part2}%`;



            let targetUserId: string | null = null;
            let targetConsumerId: string | null = null;
            let crmNotes = '';
            let crmStatus = 'novo';

            // TENTATIVA 1: Buscar na tabela 'users' (prioridade máxima)
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('id, phone')
                .ilike('phone', fuzzySearch)
                .limit(1);

            if (!userError && users && users.length > 0) {
                targetUserId = users[0].id;

            }

            // Busca Consumer para pegar dados CRM (mesmo se achou user ou nao)
            const { data: consumers, error: consumerError } = await supabase
                .from('consumers')
                .select('id, user_id, phone, crm_notes, crm_status')
                .ilike('phone', fuzzySearch)
                .limit(1);

            if (!consumerError && consumers && consumers.length > 0) {
                targetConsumerId = consumers[0].id;
                crmNotes = consumers[0].crm_notes;
                crmStatus = consumers[0].crm_status || 'novo';

                // Se ainda não tinha user_id mas achou no consumer
                if (!targetUserId && consumers[0].user_id) {
                    targetUserId = consumers[0].user_id;
                }

            }


            if (!targetUserId) {

                // Retorna dados CRM mesmo sem pedidos
                return {
                    orderCount: 0, totalValue: 0, lastOrderDate: null, lastOrderStatus: null, userId: null,
                    consumerId: targetConsumerId || undefined, crmNotes, crmStatus
                };
            }

            // BUSCAR PEDIDOS DO USER_ID ENCONTRADO
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('total, created_at, status')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false });

            if (ordersError) {
                console.error('Erro ao buscar orders:', ordersError);
                return {
                    orderCount: 0, totalValue: 0, lastOrderDate: null, lastOrderStatus: null, userId: targetUserId,
                    consumerId: targetConsumerId || undefined, crmNotes, crmStatus
                };
            }

            if (!orders || orders.length === 0) {

                return {
                    orderCount: 0, totalValue: 0, lastOrderDate: null, lastOrderStatus: null, userId: targetUserId,
                    consumerId: targetConsumerId || undefined, crmNotes, crmStatus
                };
            }

            const orderCount = orders.length;
            const totalValue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
            const lastOrderDate = orders[0]?.created_at || null;
            const lastOrderStatus = orders[0]?.status || null;



            return {
                orderCount, totalValue, lastOrderDate, lastOrderStatus, userId: targetUserId,
                consumerId: targetConsumerId || undefined, crmNotes, crmStatus
            };
        } catch (error) {
            console.error('Erro geral ao buscar pedidos:', error);
            return { orderCount: 0, totalValue: 0, lastOrderDate: null, lastOrderStatus: null, userId: null };
        }
    };

    // Buscar conversas
    const loadChats = async () => {
        try {
            const res = await fetch(`${BOT_API_URL}/chats`);
            const data = await res.json();
            const chatsList = data.chats || [];
            setChats(chatsList);

            // Buscar stats de pedidos para cada chat
            const statsPromises = chatsList.map(async (chat: Chat) => {
                const stats = await getOrderStats(chat.phone);
                return { chatId: chat.chatId, stats };
            });

            const statsResults = await Promise.all(statsPromises);
            const statsMap: Record<string, OrderStats> = {};
            statsResults.forEach(({ chatId, stats }) => {
                statsMap[chatId] = stats;
            });
            setOrderStats(statsMap);
        } catch (error) {
            console.error('Erro ao carregar chats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Buscar mensagens de uma conversa
    const loadMessages = async (chatId: string) => {
        try {
            const res = await fetch(`${BOT_API_URL}/chats/${chatId}/messages`);
            const data = await res.json();
            setMessages(data.messages || []);

            // Marcar como lido
            await fetch(`${BOT_API_URL}/chats/${chatId}/mark-read`, {
                method: 'POST'
            });

            // Atualizar a lista de chats
            loadChats();
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
        }
    };

    // Enviar mensagem
    const sendMessage = async (text: string = newMessage) => {
        if (!text.trim() || !selectedChat) return;

        const tempId = Date.now().toString();
        const tempMessage: Message = {
            id: tempId,
            fromMe: true,
            body: text,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, tempMessage]);
        if (text === newMessage) { // Only clear input if it's the typed message
            setNewMessage('');
        }

        try {
            await fetch(`${BOT_API_URL}/chats/${selectedChat.chatId}/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: tempMessage.body
                })
            });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    };

    // Polling para atualizar chats
    useEffect(() => {
        loadChats();
        const interval = setInterval(loadChats, 5000);
        return () => clearInterval(interval);
    }, []);

    // Atualizar mensagens da conversa ativa
    useEffect(() => {
        if (selectedChat) {
            const interval = setInterval(() => loadMessages(selectedChat.chatId), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedChat]);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();

        if (date.toDateString() === today.toDateString()) {
            return formatTime(timestamp);
        }

        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const quickReplies = [
        { label: "📍 Local", text: "Olá! Nossa loja fica na Rua Exemplo, 123. Venha nos visitar!" },
        { label: "📦 Entrega", text: "Seu pedido já saiu para entrega! Em breve chega aí. 🛵" },
        { label: "💰 Pix", text: "Nossa chave Pix é: cnpj@cestafacil.com.br" },
        { label: "👋 Boas-vindas", text: "Olá! Tudo bem? Como posso ajudar você hoje com sua cesta básica?" },
    ];

    const getFunnelStatusColor = (status: string) => {
        switch (status) {
            case 'novo': return 'bg-blue-500';
            case 'negociacao': return 'bg-yellow-500';
            case 'vip': return 'bg-purple-500';
            case 'inativo': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            // 1. Atualizar Status no Banco
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // 2. Atualizar UI Localmente
            setOrderHistory(prev => prev.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));

            if (selectedChat && orderStats[selectedChat.chatId]?.orderCount > 0) {
                loadChats();
            }

            // 3. Preparar e Enviar Mensagem Automática
            if (!selectedChat) return;

            // Mapear status para chave do template
            const statusToTemplateKey: Record<string, string> = {
                'processando': 'processing',
                'separando': 'separating',
                'saiu_para_entrega': 'out_for_delivery',
                'entregue': 'delivered',
                'cancelado': 'cancelled'
            };

            const templateKey = statusToTemplateKey[newStatus];
            if (!templateKey) return; // Se não tiver template (ex: cancelado), não envia nada (ou poderia ter um específico)

            // Buscar Templates do Bot
            const templatesRes = await fetch(`${BOT_API_URL}/templates`);
            const templates = await templatesRes.json();
            const template = templates[templateKey];

            if (!template) return;

            // Buscar dados completos do pedido para preencher variáveis
            // Precisamos de: nome, pedido (numero), itens, total, endereco
            const { data: fullOrder } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (!fullOrder) return;

            // Formatar Itens
            const itemsList = fullOrder.items
                ? fullOrder.items.map((i: any) => `- ${i.quantity}x ${i.name}`).join('\n')
                : '';

            // Formatar Endereço (Agora vindo do JSONB 'address' da tabela orders)
            let addressStr = 'Endereço não informado';
            if (fullOrder.address) {
                const addr = fullOrder.address;
                // Verifica se é objeto (formato novo) ou string (formato antigo/legado)
                if (typeof addr === 'object') {
                    addressStr = `${addr.street || ''}, ${addr.number || ''} - ${addr.neighborhood || ''}`;
                } else if (typeof addr === 'string') {
                    addressStr = addr;
                }
            }

            // Substituir variáveis
            let message = template
                .replace(/{nome}/g, selectedChat.name)
                .replace(/{pedido}/g, fullOrder.order_number)
                .replace(/{itens}/g, itemsList)
                .replace(/{total}/g, fullOrder.total?.toFixed(2))
                .replace(/{endereco}/g, addressStr);

            // Enviar Mensagem
            await fetch(`${BOT_API_URL}/chats/${selectedChat.chatId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });



        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status do pedido.');
        }
    };

    return (
        <div className="h-screen flex flex-col">
            <div className="p-6 border-b">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <MessageCircle className="h-8 w-8" />
                    Chat WhatsApp
                </h1>
                <p className="text-muted-foreground">Converse com seus clientes em tempo real</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Lista de Conversas */}
                <div className="w-96 border-r flex flex-col">
                    <div className="p-4 border-b bg-muted/20">
                        <h2 className="font-semibold">Conversas</h2>
                    </div>

                    <ScrollArea className="flex-1">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Carregando conversas...
                            </div>
                        ) : chats.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Nenhuma conversa ainda
                            </div>
                        ) : (
                            <div>
                                {chats.map((chat) => (
                                    <button
                                        key={chat.chatId}
                                        onClick={() => {
                                            setSelectedChat(chat);
                                            loadMessages(chat.chatId);
                                        }}
                                        className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b relative overflow-hidden group ${selectedChat?.chatId === chat.chatId ? 'bg-muted' : ''
                                            }`}
                                    >
                                        {/* Indicador CRM Status */}
                                        {orderStats[chat.chatId]?.crmStatus && (
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getFunnelStatusColor(orderStats[chat.chatId].crmStatus!)}`} />
                                        )}

                                        <Avatar className="h-12 w-12 border-2 border-muted">
                                            <AvatarImage src={chat.profilePic || undefined} />
                                            <AvatarFallback className="bg-primary text-white font-bold">
                                                {chat.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex flex-col gap-0.5 mb-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold truncate">{chat.name}</span>
                                                    <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                                                        {formatDate(chat.lastMessageTime)}
                                                    </span>
                                                </div>

                                                {/* Badges de Pedidos */}
                                                {orderStats[chat.chatId]?.orderCount > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-green-50 text-green-700 border-green-200">
                                                            <Package className="h-3 w-3 mr-1" />
                                                            {orderStats[chat.chatId].orderCount} {orderStats[chat.chatId].orderCount === 1 ? 'pedido' : 'pedidos'}
                                                        </Badge>
                                                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-green-50 text-green-700 border-green-200">
                                                            R$ {orderStats[chat.chatId].totalValue.toFixed(2)}
                                                        </Badge>
                                                        {orderStats[chat.chatId].lastOrderStatus && (
                                                            <Badge variant="outline" className={`h-5 px-1.5 text-[10px] ${getStatusColor(orderStats[chat.chatId].lastOrderStatus!)}`}>
                                                                {getStatusIcon(orderStats[chat.chatId].lastOrderStatus!)}
                                                                {orderStats[chat.chatId].lastOrderStatus}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Mini badge CRM */}
                                                {orderStats[chat.chatId]?.crmStatus && orderStats[chat.chatId]?.crmStatus !== 'novo' && (
                                                    <div className="mt-1">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${getFunnelStatusColor(orderStats[chat.chatId].crmStatus!)}`}>
                                                            {orderStats[chat.chatId].crmStatus?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                                                    {chat.lastMessage}
                                                </p>
                                                {chat.unreadCount > 0 && (
                                                    <span className="ml-2 bg-green-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.5rem] text-center font-bold shadow-sm">
                                                        {chat.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Janela de Chat */}
                <div className="flex-1 flex flex-col bg-[#e5ddd5]">
                    {selectedChat ? (
                        <>
                            {/* Header do Chat */}
                            <div className="bg-white p-4 flex items-center justify-between border-b shadow-sm z-10 transition-all">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedChat.profilePic || undefined} />
                                        <AvatarFallback className="bg-primary text-white">
                                            {selectedChat.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">{selectedChat.name}</h3>
                                        {/* Status Text no Header */}
                                        <div className="flex items-center gap-2">
                                            {orderStats[selectedChat.chatId]?.orderCount > 0 ? (
                                                <p className="text-xs text-green-600 font-medium flex items-center">
                                                    <CheckCheck className="h-3 w-3 mr-1" />
                                                    {orderStats[selectedChat.chatId].orderCount} pedidos
                                                </p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">{selectedChat.phone}</p>
                                            )}
                                            {orderStats[selectedChat.chatId]?.crmStatus && (
                                                <Badge className={`h-4 text-[10px] px-1 ${getFunnelStatusColor(orderStats[selectedChat.chatId].crmStatus!)}`}>
                                                    {orderStats[selectedChat.chatId].crmStatus?.toUpperCase()}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {/* Botão Ver Histórico */}
                                    {orderStats[selectedChat.chatId]?.userId && (
                                        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 border-green-200 hover:bg-green-50 text-green-700"
                                                    onClick={() => {
                                                        if (orderStats[selectedChat.chatId]?.userId) {
                                                            fetchOrderHistory(orderStats[selectedChat.chatId].userId!);
                                                        }
                                                    }}
                                                >
                                                    <Clock className="h-4 w-4" />
                                                    Histórico
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                                                <DialogHeader>
                                                    <DialogTitle>Histórico de Pedidos - {selectedChat.name}</DialogTitle>
                                                </DialogHeader>

                                                <ScrollArea className="flex-1 pr-4 mt-4">
                                                    {historyLoading ? (
                                                        <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>
                                                    ) : orderHistory.length === 0 ? (
                                                        <div className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado.</div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {orderHistory.map((order) => (
                                                                <Card key={order.id} className="p-4 border-l-4 border-l-primary">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div>
                                                                            <span className="text-xs font-mono text-muted-foreground">{order.order_number}</span>
                                                                            <p className="font-bold text-lg">R$ {Number(order.total).toFixed(2)}</p>
                                                                        </div>
                                                                        <Select
                                                                            defaultValue={order.status}
                                                                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                                                                        >
                                                                            <SelectTrigger className={`h-6 text-xs w-[140px] ${getStatusColor(order.status)}`}>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="processando">🟡 Processando</SelectItem>
                                                                                <SelectItem value="separando">🔵 Separando</SelectItem>
                                                                                <SelectItem value="saiu_para_entrega">🚚 Saiu p/ Entrega</SelectItem>
                                                                                <SelectItem value="entregue">🟢 Entregue</SelectItem>
                                                                                <SelectItem value="cancelado">🔴 Cancelado</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {new Date(order.created_at).toLocaleDateString('pt-BR')} às {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                    {order.items && order.items.length > 0 && (
                                                                        <div className="bg-muted/30 p-2 rounded text-xs space-y-1">
                                                                            {order.items.map((item: any, idx: number) => (
                                                                                <div key={idx} className="flex justify-between">
                                                                                    <span>{item.quantity}x {item.name}</span>
                                                                                    <span className="text-muted-foreground">R$ {item.price?.toFixed(2)}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    )}
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    )}

                                    {/* Botão CRM (Sheet) */}
                                    <Sheet open={crmOpen} onOpenChange={setCrmOpen}>
                                        <SheetTrigger asChild>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <User className="h-4 w-4" />
                                                CRM
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent>
                                            <SheetHeader>
                                                <SheetTitle>Detalhes do Cliente</SheetTitle>
                                                <SheetDescription>
                                                    Gerencie notas e status do funil de vendas para {selectedChat.name}.
                                                </SheetDescription>
                                            </SheetHeader>

                                            <div className="mt-8 space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium flex items-center gap-2">
                                                        <Tag className="h-4 w-4" />
                                                        Status do Funil
                                                    </label>
                                                    <Select value={crmStatus} onValueChange={setCrmStatus}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione o status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="novo">🟢 Novo Lead</SelectItem>
                                                            <SelectItem value="negociacao">🟡 Em Negociação</SelectItem>
                                                            <SelectItem value="vip">🟣 Cliente VIP</SelectItem>
                                                            <SelectItem value="inativo">🔴 Inativo</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium flex items-center gap-2">
                                                        <FileText className="h-4 w-4" />
                                                        Notas Internas
                                                    </label>
                                                    <Textarea
                                                        placeholder="Ex: Cliente prefere entrega à tarde..."
                                                        className="min-h-[150px]"
                                                        value={crmNotes}
                                                        onChange={(e) => setCrmNotes(e.target.value)}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Essas notas são visíveis apenas para sua equipe.
                                                    </p>
                                                </div>

                                                <Button className="w-full" onClick={saveCrmData} disabled={savingCrm}>
                                                    {savingCrm ? 'Salvando...' : 'Salvar Alterações'}
                                                </Button>

                                                {orderStats[selectedChat.chatId]?.lastOrderDate && (
                                                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                                                        <h4 className="font-semibold flex items-center gap-2">
                                                            <ShoppingBag className="h-4 w-4" /> Resumo
                                                        </h4>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="text-muted-foreground">Total Gasto:</div>
                                                            <div className="font-mono">R$ {orderStats[selectedChat.chatId].totalValue.toFixed(2)}</div>
                                                            <div className="text-muted-foreground">Pedidos:</div>
                                                            <div>{orderStats[selectedChat.chatId].orderCount}</div>
                                                            <div className="text-muted-foreground">Último:</div>
                                                            <div>{new Date(orderStats[selectedChat.chatId].lastOrderDate!).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            </div>

                            {/* Mensagens */}
                            <ScrollArea className="flex-1 p-4 bg-[#e5ddd5]">
                                <div className="space-y-3">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-lg p-3 shadow-sm ${msg.fromMe
                                                    ? 'bg-[#dcf8c6]'
                                                    : 'bg-white'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(msg.timestamp)}
                                                    </span>
                                                    {msg.fromMe && (
                                                        <CheckCheck className="h-4 w-4 text-blue-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            {/* Área de Input e Respostas Rápidas */}
                            <div className="bg-white border-t">
                                {/* Respostas Rápidas */}
                                <div className="flex gap-2 p-2 overflow-x-auto border-b bg-gray-50">
                                    {quickReplies.map((reply, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            size="sm"
                                            className="whitespace-nowrap h-7 text-xs bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                                            onClick={() => sendMessage(reply.text)}
                                        >
                                            {reply.label}
                                        </Button>
                                    ))}
                                </div>

                                {/* Campo de Texto */}
                                <div className="p-4 flex gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                sendMessage();
                                            }
                                        }}
                                    />
                                    <Button onClick={() => sendMessage()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-[#f0f2f5]">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <MessageCircle className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">WhatsApp Web CRM</h2>
                            <p className="max-w-md">
                                Selecione uma conversa para ver o histórico de pedidos, notas do cliente e gerenciar o atendimento.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
