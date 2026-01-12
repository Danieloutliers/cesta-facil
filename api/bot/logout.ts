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
        const response = await fetch(`${BOT_API_URL}/logout`, {
            method: 'POST'
        });

        const data = await response.json();

        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST');

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error proxying logout to bot:', error);
        return res.status(503).json({
            success: false,
            error: 'Bot unavailable'
        });
    }
}
