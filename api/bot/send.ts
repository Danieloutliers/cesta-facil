import type { VercelRequest, VercelResponse } from '@vercel/node';

const BOT_API_URL = process.env.BOT_API_URL || 'http://52.14.197.217:3001';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ error: 'Missing phone or message' });
        }

        const response = await fetch(`${BOT_API_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, message })
        });

        const data = await response.json();

        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Error proxying send to bot:', error);
        return res.status(503).json({
            success: false,
            error: 'Bot unavailable'
        });
    }
}
