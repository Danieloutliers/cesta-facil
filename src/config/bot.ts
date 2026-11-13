// Bot API Configuration
// In production (Vercel HTTPS), use serverless proxy to avoid Mixed Content errors
// In development (localhost HTTP), connect directly to bot VPS

const isDevelopment = import.meta.env.DEV;
const directBotUrl = import.meta.env.VITE_BOT_API_URL || 'http://52.14.197.217:3001';

// The storefront is served over HTTPS in production, so calling the bot's
// plain-HTTP VPS directly would be blocked as mixed content. Production always
// goes through the serverless proxy; only local development talks to the VPS.
const BOT_API_URL = isDevelopment ? directBotUrl : '/api/bot';

export { BOT_API_URL };

