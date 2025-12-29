# 🤖 Bot WhatsApp - Cesta Fácil

Bot WhatsApp para envio automático de notificações de pedidos do sistema Cesta Fácil.

## 🚀 Quick Start (Local)

### Pré-requisitos
- Node.js 18+ instalado
- WhatsApp no celular

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar o bot
npm start
```

### Escanear QR Code

Quando o bot iniciar, um QR Code aparecerá no terminal. Escaneie com seu WhatsApp:

1. Abra o WhatsApp no celular
2. Vá em **Configurações → Aparelhos Conectados**
3. Toque em **"Conectar um aparelho"**
4. Escaneie o QR Code

Quando conectar, você verá:
```
✅ Tudo pronto! O Robô do Zap está conectado e rodando.
```

## 📡 API Endpoints

O bot expõe uma API REST na porta **3001**:

### `GET /status`
Verifica status do bot e obtém QR Code

**Resposta:**
```json
{
  "ready": true,
  "qr": null
}
```

### `POST /send`
Envia mensagem via WhatsApp

**Body:**
```json
{
  "phone": "5511999999999",
  "message": "Sua mensagem aqui"
}
```

### `POST /logout`
Desconecta o bot e limpa a sessão

### `GET /message-log`
Retorna histórico das últimas 50 mensagens enviadas

### `GET /templates`
Retorna templates de mensagens configurados

### `PUT /templates`
Atualiza os templates de mensagens

## 🌐 Instalação em VPS (Ubuntu Server 24.04 LTS)

Para instalar o bot em um servidor VPS, siga o **[Guia Completo de Instalação VPS](guia-instalacao-vps.md)**.

### Resumo rápido:

```bash
# 1. Instalar dependências do sistema
chmod +x install-dependencies.sh
./install-dependencies.sh

# 2. Instalar dependências do projeto
npm install

# 3. Iniciar com PM2 (mantém rodando 24/7)
pm2 start ecosystem.config.js

# 4. Configurar auto-start no boot
pm2 startup
pm2 save

# 5. Configurar firewall
sudo ufw allow 3001/tcp
sudo ufw enable
```

Ver QR Code nos logs:
```bash
pm2 logs cesta-facil-bot
```

## 🔧 Comandos PM2 (VPS)

```bash
pm2 status                 # Ver status
pm2 logs cesta-facil-bot   # Ver logs em tempo real
pm2 restart cesta-facil-bot # Reiniciar bot
pm2 stop cesta-facil-bot   # Parar bot
pm2 monit                  # Dashboard de monitoramento
```

## 📁 Estrutura de Arquivos

```
bot/
├── index.js                    # Código principal do bot
├── package.json                # Dependências do projeto
├── ecosystem.config.js         # Configuração do PM2
├── install-dependencies.sh     # Script de instalação (VPS)
├── message-log.json            # Log de mensagens enviadas
├── message-templates.json      # Templates de mensagens
├── .wwebjs_auth/               # Sessão do WhatsApp (não versionar!)
├── .wwebjs_cache/              # Cache do WhatsApp Web
└── logs/                       # Logs do PM2
```

## 🔒 Segurança

> **⚠️ IMPORTANTE:** Nunca versione a pasta `.wwebjs_auth` no Git! Ela contém dados sensíveis da sessão do WhatsApp.

```bash
# Fazer backup da sessão
tar -czf backup-whatsapp.tar.gz .wwebjs_auth

# Restaurar backup
tar -xzf backup-whatsapp.tar.gz
```

## 📝 Templates de Mensagens

O bot suporta templates dinâmicos com variáveis:

```javascript
{
  "processing": "Olá {nome}! Pedido #{pedido} recebido...",
  "separating": "Oi {nome}! Pedido #{pedido} sendo separado...",
  "out_for_delivery": "Oba {nome}! Pedido #{pedido} saiu para entrega!",
  "delivered": "Pedido entregue! Obrigado {nome}!"
}
```

Edite via API ou diretamente no arquivo `message-templates.json`.

## 🛠️ Troubleshooting

### Bot não conecta
```bash
# Limpar sessão e gerar novo QR
curl -X POST http://localhost:3001/logout
```

### Ver logs de erro
```bash
# Local
node index.js

# VPS (PM2)
pm2 logs cesta-facil-bot --err
```

### Porta 3001 já em uso
```bash
# Encontrar processo
sudo lsof -i :3001

# Matar processo
sudo kill -9 <PID>
```

## 📚 Documentação Adicional

- [Guia Completo de Instalação VPS](guia-instalacao-vps.md) - Instruções detalhadas para Ubuntu Server
- [WhatsApp Web.js](https://wwebjs.dev/) - Documentação da biblioteca
- [PM2 Documentation](https://pm2.keymetrics.io/) - Gerenciador de processos

## 🎯 Integração com Frontend

O frontend do Cesta Fácil pode consumir a API do bot:

```javascript
// Verificar status do bot
const response = await fetch('http://localhost:3001/status');
const { ready, qr } = await response.json();

// Enviar mensagem
await fetch('http://localhost:3001/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '5511999999999',
    message: 'Seu pedido está a caminho!'
  })
});
```

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs
2. Consulte a seção de Troubleshooting
3. Veja o [Guia de Instalação VPS](guia-instalacao-vps.md) para mais detalhes
