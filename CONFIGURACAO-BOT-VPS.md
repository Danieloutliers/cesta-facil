# 🔧 Guia de Configuração do Bot WhatsApp na VPS Amazon

## ✅ Problema Resolvido

Configuramos o aplicativo Cesta Fácil para conectar ao bot WhatsApp rodando na VPS da Amazon.

## 📝 Alterações Feitas

### 1. Variável de Ambiente (`.env`)
Adicionamos a configuração do URL da API do bot:
```bash
VITE_BOT_API_URL=http://18.218.95.248:3001
```

### 2. Arquivo de Configuração (`src/config/bot.ts`)
Centralizamos a URL da API em um único lugar:
```typescript
const BOT_API_URL = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';
```

### 3. Arquivos Atualizados
- ✅ `src/pages/admin/Whatsapp.tsx` - Todas as chamadas à API do bot
- ✅ `src/pages/admin/Orders.tsx` - Envio automático de mensagens

## 🚀 Configuração AWS (IMPORTANTE!)

### ⚠️ Verificar Security Group da EC2

Para que o aplicativo consiga conectar ao bot, você precisa configurar o **Security Group** da sua instância EC2:

1. **Acessar console da AWS**
   - Vá em EC2 → Instances
   - Clique na sua instância
   - Aba "Security" → Clique no Security Group

2. **Adicionar Regra de Entrada (Inbound Rule)**
   - Clique em "Edit inbound rules"
   - Clique em "Add rule"
   - **Type:** Custom TCP
   - **Port range:** 3001
   - **Source:** `0.0.0.0/0` (permite acesso de qualquer lugar)
   - Clique em "Save rules"

### 🛡️ Verificar Firewall da VPS (Ubuntu)

Se estiver usando Ubuntu, configure o UFW (firewall):

```bash
# Permitir porta 3001
sudo ufw allow 3001/tcp

# Verificar status
sudo ufw status
```

### 🔍 Verificar se o Bot está Rodando

```bash
# Ver status do bot com PM2
pm2 status

# Ver logs do bot
pm2 logs cesta-facil-bot

# Testar se a porta está aberta
curl http://localhost:3001/status
```

### 📡 Testar Conexão Externamente

Do seu computador local, teste a conexão:

```bash
# Windows (PowerShell)
curl http://18.218.95.248:3001/status

# Ou abra no navegador:
# http://18.218.95.248:3001/status
```

**Resposta esperada:**
```json
{
  "ready": false,
  "qr": "2@2lx9DrIA9dA17..."
}
```

## 🎯 Para Desenvolvimento Local

Quando quiser rodar o bot localmente ao invés da VPS:

1. **Opção 1:** Alterar `.env`
```bash
VITE_BOT_API_URL=http://localhost:3001
```

2. **Opção 2:** Remover a linha do `.env` (vai usar o fallback `localhost:3001`)

## ⚡ Próximos Passos

1. ✅ Reiniciar o aplicativo local:
   ```bash
   # Pressione Ctrl+C no terminal do npm run dev
   # Depois execute novamente:
   npm run dev
   ```

2. ✅ Acessar: http://localhost:8081/admin/whatsapp

3. ✅ Verificar se está conectando ao bot na VPS

## 🔒 Segurança Adicional (Opcional)

Para maior segurança, você pode restringir o acesso à porta 3001 apenas ao seu IP ou ao IP da Vercel:

### Permitir apenas seu IP:
```
Source: MEU.IP.AQUI/32
```

### Para Vercel (produção):
Você precisará usar um proxy ou configurar CORS adequadamente, pois o Vercel não tem IPs fixos.

**Solução recomendada:** Configurar HTTPS com certificado SSL usando nginx como proxy reverso.

## 📞 Troubleshooting

### Erro: "Connection refused" ou "Network error"
- ✅ Verificar se o bot está rodando: `pm2 status`
- ✅ Verificar Security Group da AWS
- ✅ Verificar firewall: `sudo ufw status`
- ✅ Testar localmente na VPS: `curl localhost:3001/status`

### QR Code não aparece
- ✅ Ver logs do bot: `pm2 logs cesta-facil-bot`
- ✅ Reiniciar o bot: `pm2 restart cesta-facil-bot`

### Bot desconecta constantemente
- ✅ Verificar memória da VPS: `free -h`
- ✅ Aumentar recursos da instância EC2 se necessário

## 🌐 Para Deploy na Vercel

Quando fizer deploy na Vercel, adicione a variável de ambiente lá:

1. Vercel Dashboard → Seu Projeto → Settings → Environment Variables
2. Adicionar:
   - **Key:** `VITE_BOT_API_URL`
   - **Value:** `http://18.218.95.248:3001`
   - **Environments:** Production, Preview, Development

3. Redeploy o projeto

---

**IP da VPS:** 18.218.95.248  
**Porta do Bot:** 3001  
**URL da API:** http://18.218.95.248:3001
