const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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

            // Log message
            const log = readLogFile();
            log.push({
                timestamp: new Date().toISOString(),
                phone: formattedPhone,
                message: message,
                status: 'sent',
                chatId: chatId
            });
            writeLogFile(log);

            console.log(`📨 Mensagem enviada para ${formattedPhone} (${chatId})`);
            res.json({ success: true });

        } catch (waError) {
            console.error('Erro interno do WA ao verificar/enviar:', waError);
            // Fallback: try sending to the manually constructed ID if built-in check fails
            const fallbackId = formattedPhone + '@c.us';
            await client.sendMessage(fallbackId, message);

            // Log message (fallback)
            const log = readLogFile();
            log.push({
                timestamp: new Date().toISOString(),
                phone: formattedPhone,
                message: message,
                status: 'sent_fallback',
                chatId: fallbackId
            });
            writeLogFile(log);

            console.log(`⚠️ Mensagem enviada (fallback) para ${fallbackId}`);
            res.json({ success: true, warning: 'Sent via fallback' });
        }

    } catch (error) {
        console.error('Erro geral ao enviar mensagem:', error);

        // Log failed message
        const log = readLogFile();
        log.push({
            timestamp: new Date().toISOString(),
            phone: req.body.phone,
            message: req.body.message,
            status: 'failed',
            error: error.message
        });
        writeLogFile(log);

        res.status(500).json({ success: false, error: error.message });
    }
});

// API Endpoint to logout
app.post('/logout', async (req, res) => {
    try {
        console.log('Solicitação de logout recebida...');

        try {
            // Try graceful logout first
            await client.logout();
            console.log('🚪 Logout realizado no WhatsApp');
        } catch (err) {
            console.log('⚠️ Erro no logout (prosseguindo para limpeza forçada):', err.message);
        }

        // Destroy client
        await client.destroy();

        // FORCE DELETE Session Data (to ensure it doesn't remember the old number)
        const authPath = path.join(__dirname, '.wwebjs_auth');
        if (fs.existsSync(authPath)) {
            console.log('🧹 Limpando dados da sessão antiga...');
            fs.rmSync(authPath, { recursive: true, force: true });
        }

        // Initialize new session
        console.log('♻️ Reiniciando navegador para gerar novo QR...');
        client.initialize();

        isReady = false;
        qrCodeData = null;

        res.json({ success: true });
    } catch (error) {
        console.error('Erro crítico ao resetar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Paths for data files
const LOG_FILE = path.join(__dirname, 'message-log.json');
const TEMPLATES_FILE = path.join(__dirname, 'message-templates.json');

// Helper functions
const readLogFile = () => {
    try {
        if (fs.existsSync(LOG_FILE)) {
            return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('Erro ao ler log:', err);
    }
    return [];
};

const writeLogFile = (data) => {
    try {
        fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Erro ao salvar log:', err);
    }
};

const readTemplatesFile = () => {
    try {
        if (fs.existsSync(TEMPLATES_FILE)) {
            return JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('Erro ao ler templates:', err);
    }
    // Default templates
    return {
        processing: "Olá {nome}! 🛒\n\nSeu pedido #{pedido} foi recebido e está sendo processado.\n\n*Itens:*\n{itens}\n\n*Total:* R$ {total}\n*Endereço:* {endereco}\n\nEm breve atualizaremos você!",
        separating: "Oi {nome}! 📦\n\nSeu pedido #{pedido} está sendo separado.\nLogo estará a caminho!",
        out_for_delivery: "Oba {nome}! 🚚\n\nSeu pedido #{pedido} saiu para entrega!\nEm breve chegará no endereço:\n{endereco}",
        delivered: "Pedido entregue! ✅\n\nObrigado pela preferência, {nome}!\nPedido #{pedido} foi entregue com sucesso."
    };
};

const writeTemplatesFile = (data) => {
    try {
        fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Erro ao salvar templates:', err);
    }
};

// API Endpoint to get message log
app.get('/message-log', (req, res) => {
    const log = readLogFile();
    // Return last 50 messages
    res.json(log.slice(-50).reverse());
});

// API Endpoint to get templates
app.get('/templates', (req, res) => {
    const templates = readTemplatesFile();
    res.json(templates);
});

// API Endpoint to update templates
app.put('/templates', (req, res) => {
    try {
        const templates = req.body;
        writeTemplatesFile(templates);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`🤖 Servidor do Robô rodando em http://localhost:${port}`);
    console.log('Iniciando cliente WhatsApp...');
    client.initialize();
});
