import type { VercelRequest, VercelResponse } from '@vercel/node';

const BOT_API_URL = process.env.BOT_API_URL || 'http://52.14.197.217:3001';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const response = await fetch(`${BOT_API_URL}/status`);
        const data = await response.json();

        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error proxying to bot:', error);
        return res.status(503).json({
            error: 'Bot unavailable',
            ready: false,
            qr: null
        });
    }
}
