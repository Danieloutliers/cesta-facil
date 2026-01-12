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

// ========== SISTEMA DE FILA DE MENSAGENS ==========
class MessageQueue {
    constructor(maxConcurrent = 3, minDelay = 1000) {
        this.queue = [];
        this.processing = 0;
        this.maxConcurrent = maxConcurrent; // Máximo 3 mensagens simultâneas
        this.minDelay = minDelay; // Mínimo 1s entre mensagens (evita bloqueio)
        this.lastSent = 0;
    }

    async add(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }

        // Respeitar rate limit
        const now = Date.now();
        const timeSinceLastSent = now - this.lastSent;
        if (timeSinceLastSent < this.minDelay) {
            setTimeout(() => this.process(), this.minDelay - timeSinceLastSent);
            return;
        }

        const { task, resolve, reject } = this.queue.shift();
        this.processing++;
        this.lastSent = Date.now();

        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.processing--;
            this.process(); // Processar próxima mensagem
        }
    }
}

const messageQueue = new MessageQueue(3, 1000);
// ========== FIM DO SISTEMA DE FILA ==========


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

client.on('authenticated', () => {
    console.log('🔐 Cliente autenticado!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
    isReady = false;
    qrCodeData = null;
});

client.on('disconnected', (reason) => {
    console.log('🔌 Cliente desconectado:', reason);
    isReady = false;
    qrCodeData = null;
});

client.on('loading_screen', (percent, message) => {
    console.log('⏳ Carregando...', percent, message);
});

// ========== SISTEMA DE CHAT - RECEPÇÃO DE MENSAGENS ==========
client.on('message', async (msg) => {
    try {
        // Ignorar mensagens enviadas por nós
        if (msg.fromMe) return;

        const contact = await msg.getContact();
        const chat = await msg.getChat();

        // ⚠️ FILTRAR GRUPOS - Apenas conversas individuais
        if (chat.isGroup) {
            console.log(`🚫 Ignorando mensagem de grupo: ${chat.name}`);
            return;
        }

        // Obter informações do contato
        const contactInfo = {
            chatId: msg.from,
            name: contact.pushname || contact.name || msg.from.split('@')[0],
            phone: msg.from.split('@')[0],
            profilePic: null,
            lastMessage: msg.body,
            lastMessageTime: new Date(msg.timestamp * 1000).toISOString(),
            unreadCount: chat.unreadCount || 0
        };

        // Tentar obter foto de perfil
        try {
            const profilePicUrl = await contact.getProfilePicUrl();
            contactInfo.profilePic = profilePicUrl;
        } catch (err) {
            console.log(`⚠️ Sem foto de perfil para ${contactInfo.name}`);
        }

        // Criar objeto de mensagem
        const messageObj = {
            id: msg.id.id,
            from: msg.from,
            fromMe: false,
            body: msg.body,
            timestamp: new Date(msg.timestamp * 1000).toISOString(),
            type: msg.type
        };

        // Salvar no arquivo de chats
        const chats = readChatsFile();

        if (!chats[msg.from]) {
            chats[msg.from] = {
                ...contactInfo,
                messages: []
            };
        } else {
            // Atualizar informações do contato
            chats[msg.from] = {
                ...chats[msg.from],
                name: contactInfo.name,
                profilePic: contactInfo.profilePic || chats[msg.from].profilePic,
                lastMessage: contactInfo.lastMessage,
                lastMessageTime: contactInfo.lastMessageTime,
                unreadCount: (chats[msg.from].unreadCount || 0) + 1
            };
        }

        chats[msg.from].messages.push(messageObj);
        writeChatsFile(chats);

        console.log(`💬 Mensagem recebida de ${contactInfo.name}: ${msg.body}`);
    } catch (error) {
        console.error('❌ Erro ao processar mensagem recebida:', error);
    }
});
// ========== FIM DO SISTEMA DE CHAT ==========


// API Endpoint to check status and get QR
let lastStateCheck = 0;
const STATE_CHECK_INTERVAL = 30000; // Check state only every 30 seconds

app.get('/status', async (req, res) => {
    // If we think we're ready, verify the connection occasionally (not every request)
    const now = Date.now();
    if (isReady && (now - lastStateCheck) > STATE_CHECK_INTERVAL) {
        lastStateCheck = now;
        try {
            const state = await client.getState();
            if (state !== 'CONNECTED') {
                console.log(`⚠️ Estado incorreto detectado: ${state}. Resetando...`);
                isReady = false;
                qrCodeData = null;
            }
        } catch (err) {
            console.log('⚠️ Erro ao verificar estado. Cliente pode estar desconectado:', err.message);
            isReady = false;
            qrCodeData = null;
        }
    }

    res.json({
        ready: isReady,
        qr: qrCodeData
    });
});

// Debug endpoint to verify connection
app.get('/verify-connection', async (req, res) => {
    try {
        const state = await client.getState();
        const info = await client.info;
        res.json({
            state,
            isReady,
            info: info ? {
                pushname: info.pushname,
                platform: info.platform
            } : null
        });
    } catch (err) {
        res.json({
            state: 'ERROR',
            isReady,
            error: err.message
        });
    }
});


// API Endpoint to send messages (COM FILA E RETRY)
app.post('/send', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ success: false, error: 'Bot not ready' });
    }

    // Validate request body exists
    if (!req.body) {
        return res.status(400).json({ success: false, error: 'Missing request body' });
    }

    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'Missing phone or message' });
    }

    // Format phone number
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
    }

    // Adicionar à fila com retry automático
    const sendTask = async () => {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                attempts++;
                const checkId = formattedPhone + '@c.us';

                // Verify if number is registered on WhatsApp
                const numberDetails = await client.getNumberId(checkId);

                if (!numberDetails) {
                    console.log(`❌ Número não registrado no WhatsApp: ${formattedPhone}`);
                    throw new Error('Number not registered');
                }

                const chatId = numberDetails._serialized;
                await client.sendMessage(chatId, message);

                // Log message
                const log = readLogFile();
                log.push({
                    timestamp: new Date().toISOString(),
                    phone: formattedPhone,
                    message: message,
                    status: 'sent',
                    chatId: chatId,
                    attempts: attempts
                });
                writeLogFile(log);

                console.log(`📨 Mensagem enviada para ${formattedPhone} (tentativa ${attempts}/${maxAttempts})`);
                return { success: true };

            } catch (waError) {
                console.error(`⚠️ Erro na tentativa ${attempts}/${maxAttempts}:`, waError.message);

                if (attempts >= maxAttempts) {
                    // Última tentativa: usar fallback
                    try {
                        const fallbackId = formattedPhone + '@c.us';
                        await client.sendMessage(fallbackId, message);

                        const log = readLogFile();
                        log.push({
                            timestamp: new Date().toISOString(),
                            phone: formattedPhone,
                            message: message,
                            status: 'sent_fallback',
                            chatId: fallbackId,
                            attempts: attempts
                        });
                        writeLogFile(log);

                        console.log(`⚠️ Mensagem enviada (fallback) para ${fallbackId}`);
                        return { success: true, warning: 'Sent via fallback after retries' };
                    } catch (fallbackError) {
                        throw fallbackError; // Falhou mesmo com fallback
                    }
                }

                // Aguardar antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
        }
    };

    try {
        // Adicionar à fila
        const result = await messageQueue.add(sendTask);
        res.json(result);
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

// ========== ENDPOINTS DO SISTEMA DE CHAT ==========

// Helper functions for chats file
const CHATS_FILE = path.join(__dirname, 'chats.json');

const readChatsFile = () => {
    try {
        if (fs.existsSync(CHATS_FILE)) {
            return JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('Erro ao ler chats:', err);
    }
    return {};
};

const writeChatsFile = (data) => {
    try {
        fs.writeFileSync(CHATS_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Erro ao salvar chats:', err);
    }
};

// GET /chats - Listar todas as conversas
app.get('/chats', (req, res) => {
    try {
        const chats = readChatsFile();

        // Converter objeto em array e ordenar por última mensagem
        const chatsList = Object.values(chats)
            // ⚠️ FILTRAR GRUPOS - Apenas conversas individuais (chatId termina com @c.us, não @g.us)
            .filter(chat => !chat.chatId.endsWith('@g.us'))
            .map(chat => ({
                chatId: chat.chatId,
                name: chat.name,
                phone: chat.phone,
                profilePic: chat.profilePic,
                lastMessage: chat.lastMessage,
                lastMessageTime: chat.lastMessageTime,
                unreadCount: chat.unreadCount || 0
            }))
            .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

        res.json({ chats: chatsList });
    } catch (error) {
        console.error('Erro ao listar chats:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /chats/:chatId/messages - Obter mensagens de um chat
app.get('/chats/:chatId/messages', (req, res) => {
    try {
        const { chatId } = req.params;
        const chats = readChatsFile();

        if (!chats[chatId]) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.json({
            chat: {
                chatId: chats[chatId].chatId,
                name: chats[chatId].name,
                phone: chats[chatId].phone,
                profilePic: chats[chatId].profilePic
            },
            messages: chats[chatId].messages || []
        });
    } catch (error) {
        console.error('Erro ao obter mensagens:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /chats/:chatId/send - Enviar mensagem para um chat
app.post('/chats/:chatId/send', async (req, res) => {
    try {
        if (!isReady) {
            return res.status(503).json({ success: false, error: 'Bot not ready' });
        }

        const { chatId } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Adicionar à fila
        const sendTask = async () => {
            await client.sendMessage(chatId, message);

            // Adicionar mensagem ao histórico
            const chats = readChatsFile();
            if (chats[chatId]) {
                const messageObj = {
                    id: `msg_${Date.now()}`,
                    from: chatId,
                    fromMe: true,
                    body: message,
                    timestamp: new Date().toISOString(),
                    type: 'chat'
                };

                chats[chatId].messages.push(messageObj);
                chats[chatId].lastMessage = message;
                chats[chatId].lastMessageTime = new Date().toISOString();
                writeChatsFile(chats);
            }

            return { success: true };
        };

        const result = await messageQueue.add(sendTask);
        res.json(result);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /chats/:chatId/mark-read - Marcar mensagens como lidas
app.post('/chats/:chatId/mark-read', (req, res) => {
    try {
        const { chatId } = req.params;
        const chats = readChatsFile();

        if (chats[chatId]) {
            chats[chatId].unreadCount = 0;
            writeChatsFile(chats);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao marcar como lido:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== FIM DOS ENDPOINTS DE CHAT ==========


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
        delivered: "Pedido entregue! ✅\n\nObrigado pela preferência, {nome}!\nPedido #{pedido} foi entregue com sucesso.",
        cancelled: "Olá {nome}. 🛑\n\nO pedido #{pedido} foi cancelado.\nCaso tenha dúvidas, entre em contato conosco."
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
