import type { VercelRequest, VercelResponse } from '@vercel/node';

const BOT_API_URL = process.env.BOT_API_URL || 'http://52.14.197.217:3001';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { phone, message } = req.body ?? {};
        const phoneDigits = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';

        if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 15) {
            return res.status(400).json({ error: 'Invalid phone' });
        }
        if (typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: 'Missing message' });
        }
        if (message.length > 4096) {
            return res.status(413).json({ error: 'Message too long' });
        }

        const response = await fetch(`${BOT_API_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneDigits, message })
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Error proxying send to bot:', error);
        return res.status(503).json({
            success: false,
            error: 'Bot unavailable'
        });
    }
}
