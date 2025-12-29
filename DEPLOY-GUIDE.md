# 🚀 Guia de Deploy - Bot WhatsApp com Proxy

## ✅ O que foi implementado

Criamos uma solução de **proxy serverless** para resolver o erro de Mixed Content na Vercel.

### 📁 Arquivos Criados

**Funções API Serverless:**
- `api/bot/status.ts` - Proxy para status do bot
- `api/bot/send.ts` - Proxy para envio de mensagens
- `api/bot/logout.ts` - Proxy para logout
- `api/bot/message-log.ts` - Proxy para histórico
- `api/bot/templates.ts` - Proxy para templates

**Configuração:**
- `src/config/bot.ts` - Detecção automática de ambiente
- `vercel.json` - Configuração de funções serverless
- `VERCEL-ENV-SETUP.md` - Guia de variáveis de ambiente

## 🔧 Configuração na Vercel

### 1. Adicionar Variável de Ambiente

No **Vercel Dashboard:**

1. Vá em **Settings → Environment Variables**
2. Clique em **Add New**
3. Configure:
   ```
   Key: BOT_API_URL
   Value: http://18.218.95.248:3001
   Environments: ✓ Production ✓ Preview ✓ Development
   ```
4. Clique em **Save**

> ⚠️ **NÃO** use o prefixo `VITE_` nesta variável! Ela é usada pelas funções serverless no backend.

### 2. Deploy

```bash
# Adicionar arquivos ao Git
git add .

# Fazer commit
git commit -m "Adiciona proxy API para resolver Mixed Content no bot WhatsApp"

# Fazer push (deploy automático)
git push
```

### 3. Verificar Deploy

Após o deploy, teste:

1. **API Status:**
   - Abra: `https://cesta-facil.vercel.app/api/bot/status`
   - Deve retornar: `{"ready": false/true, "qr": "..."}`

2. **Interface WhatsApp:**
   - Abra: `https://cesta-facil.vercel.app/admin/whatsapp`
   - Não deve ter erros de Mixed Content
   - QR code deve aparecer (se bot estiver aguardando conexão)

## 🔍 Como Funciona

### Desenvolvimento (localhost)
```
Frontend → http://18.218.95.248:3001 (conexão direta)
```
- Usa `VITE_BOT_API_URL` do arquivo `.env` local
- Sem problemas de Mixed Content (HTTP → HTTP)

### Produção (Vercel)
```
Frontend HTTPS → /api/bot HTTPS → Bot VPS HTTP
   (Vercel)        (Proxy)         (18.218.95.248)
```
- Frontend chama `/api/bot/*` (HTTPS)
- Funções serverless fazem proxy para VPS (HTTP)
- Sem Mixed Content (HTTPS → HTTPS no navegador)

## 🐛 Troubleshooting

### Erro 503 "Bot unavailable"
- Verificar se bot está rodando na VPS
- Verificar firewall da VPS (porta 3001 aberta)
- Verificar Security Group AWS

### Variável não encontrada
- **Frontend:** Use `VITE_BOT_API_URL` (com prefixo)
- **Backend:** Use `BOT_API_URL` (sem prefixo)
- Certifique-se de configurar `BOT_API_URL` na Vercel

### QR code não aparece
- Abrir console do navegador (F12)
- Verificar se há erros de rede
- Testar endpoint direto: `/api/bot/status`

## 📊 Estrutura do Projeto

```
cesta-facil-main/
├── api/
│   └── bot/
│       ├── status.ts         # GET /api/bot/status
│       ├── send.ts           # POST /api/bot/send
│       ├── logout.ts         # POST /api/bot/logout
│       ├── message-log.ts    # GET /api/bot/message-log
│       └── templates.ts      # GET/PUT /api/bot/templates
├── src/
│   ├── config/
│   │   └── bot.ts           # Configuração com detecção de ambiente
│   └── pages/admin/
│       ├── Whatsapp.tsx     # Interface de gestão do bot
│       └── Orders.tsx       # Envio automático de mensagens
├── vercel.json              # Configuração Vercel
└── .env                     # Variáveis locais (não commitar!)
```

---

**Feito!** Agora o bot funciona tanto local quanto na Vercel! 🎉
