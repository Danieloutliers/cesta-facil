import { BOT_API_URL } from '@/config/bot';
import { Order, CartItem, Address } from '@/types';

interface OrderWithUser {
    id: string;
    items: CartItem[];
    budget: number;
    total: number;
    savings: number;
    status: Order['status'];
    address: Address;
    missingItemPreference: 'substituir' | 'credito';
    createdAt: string;
    estimatedDelivery?: string;
    user?: {
        phone: string;
        name?: string;
    };
}

/**
 * Send a message via the WhatsApp bot
 * @param phone Phone number (with or without country code)
 * @param message Message to send
 * @returns true if sent successfully, false otherwise
 */
export const sendWhatsAppMessage = async (phone: string, message: string): Promise<boolean> => {
    try {
        const response = await fetch(`${BOT_API_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, message })
        });
        const data = await response.json();
        return data.success;
    } catch (err) {
        console.error('Failed to send WhatsApp message:', err);
        return false;
    }
};

/**
 * Get the WhatsApp message template for a given order status
 * @param status Order status
 * @param order Order object with user info
 * @returns Formatted message string
 */
export const getWhatsAppMessage = async (
    status: Order['status'],
    order: OrderWithUser
): Promise<string> => {
    const firstName = (order.user?.name || 'Cliente').split(' ')[0];
    const shortId = order.id.slice(-6);

    try {
        // Try to load templates from backend
        const res = await fetch(`${BOT_API_URL}/templates`);
        const templates = await res.json();

        // Map status to template key
        const templateKey = status === 'processando' ? 'processing' :
            status === 'separando' ? 'separating' :
                status === 'em_rota' ? 'out_for_delivery' :
                    status === 'entregue' ? 'delivered' : null;

        if (templateKey && templates[templateKey]) {
            let message = templates[templateKey];

            // Build items list for message
            const itemsList = order.items.map(item => `- ${item.quantity}x ${item.name}`).join('\n');
            const fullAddress = `${order.address.street}, ${order.address.number}${order.address.complement ? ` - ${order.address.complement}` : ''}, ${order.address.neighborhood}, ${order.address.city}`;

            // Replace variables
            message = message
                .replace(/{nome}/g, firstName)
                .replace(/{pedido}/g, shortId)
                .replace(/{itens}/g, itemsList)
                .replace(/{total}/g, order.total.toFixed(2).replace('.', ','))
                .replace(/{endereco}/g, fullAddress);

            return message;
        }
    } catch (err) {
        console.log('Failed to load templates, using fallback:', err);
    }

    // Fallback messages if templates not available
    switch (status) {
        case 'processando':
            const itemsList = order.items.map(item => `- ${item.quantity}x ${item.name}`).join('\n');
            return `Olá ${firstName}! 🛒\n\nSeu pedido *#${shortId}* foi recebido e está sendo processado.\n\n*Itens:*\n${itemsList}\n\n*Total:* R$ ${order.total.toFixed(2).replace('.', ',')}\n*Endereço:* ${order.address.street}, ${order.address.number}, ${order.address.neighborhood}\n\nEm breve atualizaremos você!`;
        case 'separando':
            return `Olá ${firstName}! Já estamos separando os itens do seu pedido *#${shortId}*. Em breve sairá para entrega! 📦`;
        case 'em_rota':
            return `Olá ${firstName}! Seu pedido *#${shortId}* acabou de sair para entrega. Fique atento(a) à campainha! 🚚`;
        case 'entregue':
            return `Pedido *#${shortId}* entregue! Muito obrigado por comprar conosco. ⭐`;
        default:
            return `Olá ${firstName}! Status do seu pedido *#${shortId}* atualizado para: ${status}`;
    }
};
