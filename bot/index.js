const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

// Enable CORS/JSON
app.use(cors());
app.use(express.json());

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
    }
});

let isReady = false;

client.on('qr', (qr) => {
    console.log('🔗 QR CODE RECEBIDO!');
    console.log('Escaneie com seu WhatsApp para conectar:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Tudo pronto! O Robô do Zap está conectado e rodando.');
    isReady = true;
});

client.on('authenticated', () => {
    console.log('🔑 Autenticado com sucesso!');
});

client.on('auth_failure', msg => {
    console.error('❌ Falha na autenticação:', msg);
});

// API Endpoint to send messages
app.post('/send', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ success: false, error: 'Bot not ready' });
    }

    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'Missing phone or message' });
    }

    try {
        // Format phone number: remove non-digits, ensure 55 prefix, add @c.us suffix
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55')) {
            formattedPhone = '55' + formattedPhone;
        }
        const chatId = formattedPhone + '@c.us';

        await client.sendMessage(chatId, message);
        console.log(`📨 Mensagem enviada para ${formattedPhone}`);
        res.json({ success: true });

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`🤖 Servidor do Robô rodando em http://localhost:${port}`);
    console.log('Iniciando cliente WhatsApp...');
    client.initialize();
});
