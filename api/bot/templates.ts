import type { VercelRequest, VercelResponse } from '@vercel/node';

const BOT_API_URL = process.env.BOT_API_URL || 'http://18.218.95.248:3001';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    // Allow GET and PUT
    if (req.method === 'GET') {
        try {
            const response = await fetch(`${BOT_API_URL}/templates`);
            const data = await response.json();

            // Add CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, PUT');

            return res.status(200).json(data);
        } catch (error) {
            console.error('Error proxying GET templates to bot:', error);
            return res.status(503).json({
                processing: "Olá {nome}! 🛒\n\nSeu pedido #{pedido} foi recebido.",
                separating: "Oi {nome}! 📦\n\nSeu pedido #{pedido} está sendo separado.",
                out_for_delivery: "Oba {nome}! 🚚\n\nSeu pedido #{pedido} saiu para entrega!",
                delivered: "Pedido entregue! ✅\n\nObrigado {nome}!"
            });
        }
    } else if (req.method === 'PUT') {
        try {
            const templates = req.body;

            const response = await fetch(`${BOT_API_URL}/templates`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(templates)
            });

            const data = await response.json();

            // Add CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, PUT');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            return res.status(200).json(data);
        } catch (error) {
            console.error('Error proxying PUT templates to bot:', error);
            return res.status(503).json({
                success: false,
                error: 'Bot unavailable'
            });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}
