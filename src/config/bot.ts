// Bot API Configuration
// In production (Vercel HTTPS), use serverless proxy to avoid Mixed Content errors
// In development (localhost HTTP), connect directly to bot VPS

const isDevelopment = import.meta.env.DEV;
const directBotUrl = import.meta.env.VITE_BOT_API_URL || 'http://18.218.95.248:3001';

// Use proxy in production, direct connection in development
const BOT_API_URL = isDevelopment ? directBotUrl : '/api/bot';

export { BOT_API_URL };

