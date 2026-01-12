// Bot API Configuration
// In production (Vercel HTTPS), use serverless proxy to avoid Mixed Content errors
// In development (localhost HTTP), connect directly to bot VPS

const isDevelopment = import.meta.env.DEV;
const directBotUrl = import.meta.env.VITE_BOT_API_URL || 'http://52.14.197.217:3001';

// Use proxy in development (to avoid CORS), direct connection in production
const BOT_API_URL = isDevelopment ? '/api/bot' : directBotUrl;

export { BOT_API_URL };

