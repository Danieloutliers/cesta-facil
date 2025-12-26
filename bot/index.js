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

// ... imports

let isReady = false;
let qrCodeData = null;

client.on('qr', (qr) => {
    console.log('🔗 QR CODE RECEBIDO!');
    qrCodeData = qr; // Store QR for frontend
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Tudo pronto! O Robô do Zap está conectado e rodando.');
    isReady = true;
    qrCodeData = null; // Clear QR when connected
});

// ... auth events

// API Endpoint to check status and get QR
app.get('/status', (req, res) => {
    res.json({
        ready: isReady,
        qr: qrCodeData
    });
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
        // Format phone number: remove non-digits, ensure 55 prefix
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55')) {
            formattedPhone = '55' + formattedPhone;
        }

        // Append suffix for query
        const checkId = formattedPhone + '@c.us';

        try {
            // Verify if number is registered on WhatsApp
            const numberDetails = await client.getNumberId(checkId);

            if (!numberDetails) {
                console.log(`❌ Número não registrado no WhatsApp: ${formattedPhone}`);
                return res.status(404).json({ success: false, error: 'Number not registered' });
            }

            const chatId = numberDetails._serialized; // Use the correct internal ID (handles 9th digit)
            await client.sendMessage(chatId, message);

            console.log(`📨 Mensagem enviada para ${formattedPhone} (${chatId})`);
            res.json({ success: true });

        } catch (waError) {
            console.error('Erro interno do WA ao verificar/enviar:', waError);
            // Fallback: try sending to the manually constructed ID if built-in check fails
            const fallbackId = formattedPhone + '@c.us';
            await client.sendMessage(fallbackId, message);
            console.log(`⚠️ Mensagem enviada (fallback) para ${fallbackId}`);
            res.json({ success: true, warning: 'Sent via fallback' });
        }

    } catch (error) {
        console.error('Erro geral ao enviar mensagem:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API Endpoint to logout
app.post('/logout', async (req, res) => {
    try {
        await client.logout();
        console.log('🚪 Cliente desconectado via API');
        isReady = false;
        qrCodeData = null;
        // Re-initialize to allow new connection
        client.initialize();
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao desconectar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`🤖 Servidor do Robô rodando em http://localhost:${port}`);
    console.log('Iniciando cliente WhatsApp...');
    client.initialize();
});
