# Variáveis de Ambiente - Vercel

Configure estas variáveis no Vercel Dashboard:

**Settings → Environment Variables → Add New**

## Variáveis Necessárias

### BOT_API_URL (para funções serverless)
```
Key: BOT_API_URL
Value: http://18.218.95.248:3001
Environments: ✓ Production ✓ Preview ✓ Development
```

> ⚠️ **IMPORTANTE:** Esta variável é usada pelas funções API serverless (`api/bot/*.ts`) para se conectar ao bot na VPS. NÃO adicione o prefixe `VITE_` porque ela é usada no backend, não no frontend.

## Variáveis Existentes (Supabase)

Certifique-se de que estas já estão configuradas:

```
VITE_SUPABASE_URL=https://vbtyvdotydiwuownbsaf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Como o Sistema Funciona

### Desenvolvimento (localhost)
```
Frontend → http://18.218.95.248:3001 (direto)
```
Usa `VITE_BOT_API_URL` do `.env` local

### Produção (Vercel)
```
Frontend (HTTPS) → /api/bot (proxy HTTPS) → Bot VPS (HTTP)
```
Proxy usa `BOT_API_URL` (sem VITE_) configurada na Vercel

---

## Deploy

Após configurar as variáveis:

```bash
git add .
git commit -m "Adiciona proxy API para resolver Mixed Content"
git push
```

O deploy automático da Vercel vai usar as variáveis configuradas! 🚀
