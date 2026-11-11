const { Client, LocalAuth, MessageMedia, Location } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = 3001;

// Enable CORS/JSON
app.use(cors());
app.use(express.json());

// Configurar multer para upload de arquivos
const upload = multer({ storage: multer.memoryStorage() });

// Configurar Gemini AI
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
let aiEnabled = process.env.AI_ENABLED === 'true';

// Carregar base de conhecimento
const knowledgeBasePath = path.join(__dirname, 'knowledge-base.json');
let knowledgeBase = {};
try {
    knowledgeBase = JSON.parse(fs.readFileSync(knowledgeBasePath, 'utf8'));
    console.log('📚 Base de conhecimento carregada');
} catch (error) {
    console.warn('⚠️ Base de conhecimento não encontrada');
}

const chatsFilePath = path.join(__dirname, 'chats.json');
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


// ========== FUNÇÃO DE IA ==========
// Configurar cliente Supabase
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Função para buscar contexto do cliente no Supabase
async function fetchCustomerContext(phone) {
    if (!supabase) {
        console.warn('⚠️ Supabase client não inicializado (verifique .env)');
        return null;
    }

    try {
        // Limpar telefone (apenas números)
        const cleanPhone = phone.replace(/\D/g, '');
        // Tentar formatos: 5511.., 11..
        // Tentar formatos: 5511.., 11..
        const phoneVariations = [
            cleanPhone,
            cleanPhone.substring(2),
            `+${cleanPhone}`,
            cleanPhone.replace(/^55(\d{2})(\d{8,9})$/, '$1$2') // Apenas DDD + numero
        ];

        // Tentar adicionar nono dígito se não tiver (assumindo celular BR)
        if (cleanPhone.length === 12 && cleanPhone.startsWith('55')) {
            const ddd = cleanPhone.substring(2, 4);
            const num = cleanPhone.substring(4);
            if (num.length === 8) {
                phoneVariations.push(`55${ddd}9${num}`);
                phoneVariations.push(`${ddd}9${num}`);
            }
        }

        console.log(`🔍 [Supabase] Buscando cliente com variações: ${phoneVariations.join(', ')}`);

        // 1. Buscar Cliente (Tabela users)
        const { data: customers, error: customerError } = await supabase
            .from('users')
            .select('*')
            // Usar 'in' para buscar qualquer uma das variações
            .in('phone', phoneVariations)
            .limit(1);

        if (customerError) {
            console.error('❌ [Supabase] Erro ao buscar cliente:', customerError.message);
            return null;
        }

        const customer = customers?.[0];

        if (!customer) {
            console.log('⚠️ [Supabase] Cliente não encontrado para este telefone.');
            return null;
        }

        console.log(`✅ [Supabase] Cliente encontrado: ${customer.full_name || customer.name} (ID: ${customer.id})`);

        // 2. Buscar Últimos Pedidos
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', customer.id) // Corrigido de customer_id para user_id
            .order('created_at', { ascending: false })
            .limit(3);

        if (ordersError) {
            console.error('❌ [Supabase] Erro ao buscar pedidos:', ordersError.message);
        } else {
            console.log(`📦 [Supabase] ${orders.length} pedidos recentes encontrados.`);
        }

        return {
            customer: {
                ...customer,
                name: customer.full_name || customer.name // Normalizar nome
            },
            orders
        };
    } catch (error) {
        console.error('Erro ao buscar contexto Supabase:', error);
        return null;
    }
}

async function analyzeWithAI(message, contactName, contactPhone) {
    if (!genAI || !aiEnabled) {
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: process.env.AI_MODEL || 'gemini-1.5-flash' });

        // Buscar dados reais do Supabase
        const dbContext = await fetchCustomerContext(contactPhone);
        let contextData = "";

        if (dbContext) {
            contextData = `
DADOS DO CLIENTE IDENTIFICADO:
Nome: ${dbContext.customer.name}
Telefone: ${dbContext.customer.phone}
Endereço: ${dbContext.customer.address || 'Não cadastrado'}

ÚLTIMOS PEDIDOS:
${dbContext.orders?.map(o =>
                `- Pedido #${o.display_id || o.id.substring(0, 6)}: Status ${o.status}, Total R$ ${o.total_amount}. Data: ${new Date(o.created_at).toLocaleDateString()}`
            ).join('\n') || 'Nenhum pedido recente.'}
`;
        }

        const context = `Você é o assistente virtual da ${knowledgeBase.loja?.nome || 'Cesta Fácil'}, uma ${knowledgeBase.loja?.descricao || 'loja de cestas básicas'}.
        
CONTEXTO DO CLIENTE (Use se relevante):
${contextData}

INFORMAÇÕES DA LOJA:
Cliente ${contactName} perguntou: "${message}"

Sua resposta:`;

        const result = await model.generateContent(context);
        const response = await result.response;
        const text = response.text();

        console.log(`🤖 IA respondeu para ${contactName}: ${text.substring(0, 50)}...`);
        return text;
    } catch (error) {
        console.error('❌ Erro ao analisar com IA:', error.message);
        return null;
    }
}

// ========== SISTEMA DE CHAT - RECEPÇÃO DE MENSAGENS ==========
client.on('message_create', async (msg) => {
    try {
        // Ignorar status de broadcast
        if (msg.from === 'status@broadcast') return;

        const contact = await msg.getContact();
        const chat = await msg.getChat();

        // ⚠️ FILTRAR GRUPOS - Apenas conversas individuais
        if (chat.isGroup) {
            console.log(`🚫 Ignorando mensagem de grupo: ${chat.name}`);
            return;
        }

        // Obter informações do contato (se for grupo, precisa de ajuste, mas aqui focamos em privado)
        // Se for enviada por MIM, o 'from' sou eu, mas o chat deve ser registrado no 'to'.
        // Mas o chatId do WWebJS para mensagens enviadas por mim é o 'to'.
        const isFromMe = msg.fromMe;
        const remoteId = isFromMe ? msg.to : msg.from;

        // Se for grupo, ignorar
        if (chat.isGroup) {
            return;
        }

        const contactInfo = {
            chatId: remoteId,
            name: chat.name || remoteId.split('@')[0], // Tenta usar nome do chat
            phone: remoteId.split('@')[0],
            profilePic: null,
            lastMessage: msg.body,
            lastMessageTime: new Date(msg.timestamp * 1000).toISOString(),
            unreadCount: isFromMe ? 0 : (chat.unreadCount || 0)
        };

        // Tentar obter foto de perfil do REMOTE
        try {
            // Se sou eu, quero a foto do destinatário, não a minha
            // O objeto 'chat' já tem informações do contato remoto em conversas privadas
            const contactOps = await client.getContactById(remoteId);
            const profilePicUrl = await contactOps.getProfilePicUrl();
            contactInfo.profilePic = profilePicUrl;
        } catch (err) {
            // console.log(`⚠️ Sem foto de perfil`);
        }

        // Criar objeto de mensagem
        const messageObj = {
            id: msg.id.id,
            from: msg.from,
            fromMe: isFromMe,
            body: msg.body,
            timestamp: new Date(msg.timestamp * 1000).toISOString(),
            type: msg.type
        };

        // Salvar no arquivo de chats
        const chats = readChatsFile();

        // Usar remoteId como chave (o cliente com quem falo)
        if (!chats[remoteId]) {
            chats[remoteId] = {
                ...contactInfo,
                messages: []
            };
        } else {
            // Atualizar informações do contato
            chats[remoteId] = {
                ...chats[remoteId],
                name: contactInfo.name || chats[remoteId].name, // Preservar nome se falhar
                profilePic: contactInfo.profilePic || chats[remoteId].profilePic,
                lastMessage: contactInfo.lastMessage,
                lastMessageTime: contactInfo.lastMessageTime,
                unreadCount: isFromMe ? chats[remoteId].unreadCount : ((chats[remoteId].unreadCount || 0) + 1)
            };
        }

        chats[remoteId].messages.push(messageObj);
        writeChatsFile(chats);

        console.log(`💬 Mensagem ${isFromMe ? 'ENVIADA para' : 'RECEBIDA de'} ${contactInfo.name}: ${msg.body}`);

        // ========== RESPOSTA AUTOMÁTICA COM IA ==========
        console.log(`🤖 Analisando IA: Enabled=${aiEnabled}, FromMe=${msg.fromMe}, Type=${msg.type}, Body="${msg.body}"`);

        if (aiEnabled && !msg.fromMe && msg.body && msg.type === 'chat') {
            const aiResponse = await analyzeWithAI(msg.body, contactInfo.name, contactInfo.phone);

            if (aiResponse) {
                // Simular digitação
                await chat.sendStateTyping();

                // Delay baseado no tamanho da resposta
                const typingDelay = Math.min(5000, Math.max(2000, aiResponse.length * 30));
                await new Promise(resolve => setTimeout(resolve, typingDelay));

                // Enviar resposta
                await client.sendMessage(msg.from, aiResponse, { sendSeen: false });
                await chat.clearState();

                console.log(`✅ IA respondeu automaticamente para ${contactInfo.name}`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao processar mensagem recebida:', error);
    }
});
// ========== FIM DO SISTEMA DE CHAT ==========


// API Endpoint to check status and get QR
let lastStateCheck = 0;
const STATE_CHECK_INTERVAL = 30000; // Check state only every 30 seconds

app.get('/status', async (req, res) => {
    // Force check state always for debugging
    const now = Date.now();
    if ((now - lastStateCheck) > 5000) { // Check every 5s for now
        lastStateCheck = now;
        try {
            const state = await client.getState();
            console.log(`🔍 Debug Status Check: State=${state}, isReady=${isReady}`);

            if (state === 'CONNECTED') {
                // NÃO definir isReady = true aqui!
                // Devemos esperar o evento 'ready' do cliente para garantir que o WWebJS foi injetado.
                // isReady = true; 
                qrCodeData = null;
            } else if (state !== 'CONNECTED' && isReady) {
                console.log(`⚠️ Estado incorreto detectado: ${state}. Resetando...`);
                isReady = false;
                qrCodeData = null;
            }
        } catch (err) {
            console.log('⚠️ Erro ao verificar estado:', err.message);
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

                // Simular Digitação
                const chat = await client.getChatById(chatId);

                // Calcular delay: 50ms por char, min 3s, max 10s
                const typingDelay = Math.min(10000, Math.max(3000, message.length * 50));

                console.log(`✍️ Digitando para ${formattedPhone} por ${typingDelay}ms...`);
                await chat.sendStateTyping();

                await new Promise(resolve => setTimeout(resolve, typingDelay));

                // Parar digitação (opcional, o envio já remove o status, mas garante)
                await chat.clearState();

                await client.sendMessage(chatId, message, { sendSeen: false });

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
                        await client.sendMessage(fallbackId, message, { sendSeen: false });

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
            // Simular Digitação
            const chatObj = await client.getChatById(chatId);

            // Calcular delay: 50ms por char, min 3s, max 10s
            const typingDelay = Math.min(10000, Math.max(3000, message.length * 50));

            console.log(`✍️ Digitando para ${chatId} por ${typingDelay}ms...`);
            await chatObj.sendStateTyping();

            await new Promise(resolve => setTimeout(resolve, typingDelay));
            await chatObj.clearState();

            await client.sendMessage(chatId, message, { sendSeen: false });

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

// ========== ENDPOINTS DE MÍDIA ==========

// POST /send-media - Enviar imagem ou documento
app.post('/send-media', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ success: false, error: 'Bot not ready' });
    }

    try {
        const { phone, mediaUrl, mediaType, caption } = req.body;

        if (!phone || !mediaUrl) {
            return res.status(400).json({ error: 'Missing phone or mediaUrl' });
        }

        // Formatar número
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55')) {
            formattedPhone = '55' + formattedPhone;
        }

        const sendTask = async () => {
            const checkId = formattedPhone + '@c.us';
            const numberDetails = await client.getNumberId(checkId);

            if (!numberDetails) {
                throw new Error('Number not registered');
            }

            const chatId = numberDetails._serialized;

            // Simular digitação
            const chatObj = await client.getChatById(chatId);
            await chatObj.sendStateTyping();
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Fazer download da mídia
            console.log(`📥 Baixando mídia de: ${mediaUrl}`);
            const media = await MessageMedia.fromUrl(mediaUrl);

            // Enviar mídia
            await client.sendMessage(chatId, media, {
                caption: caption || '',
                sendSeen: false
            });

            await chatObj.clearState();

            console.log(`📤 Mídia enviada para ${formattedPhone}`);
            return { success: true };
        };

        const result = await messageQueue.add(sendTask);
        res.json(result);
    } catch (error) {
        console.error('Erro ao enviar mídia:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /send-location - Enviar localização
app.post('/send-location', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ success: false, error: 'Bot not ready' });
    }

    try {
        const { phone, latitude, longitude, description } = req.body;

        if (!phone || !latitude || !longitude) {
            return res.status(400).json({ error: 'Missing phone, latitude or longitude' });
        }

        // Formatar número
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55')) {
            formattedPhone = '55' + formattedPhone;
        }

        const sendTask = async () => {
            const checkId = formattedPhone + '@c.us';
            const numberDetails = await client.getNumberId(checkId);

            if (!numberDetails) {
                throw new Error('Number not registered');
            }

            const chatId = numberDetails._serialized;

            // Simular digitação
            const chatObj = await client.getChatById(chatId);
            await chatObj.sendStateTyping();
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Criar localização
            const location = new Location(latitude, longitude, description || '');

            // Enviar localização
            await client.sendMessage(chatId, location, { sendSeen: false });

            await chatObj.clearState();

            console.log(`📍 Localização enviada para ${formattedPhone}`);
            return { success: true };
        };

        const result = await messageQueue.add(sendTask);
        res.json(result);
    } catch (error) {
        console.error('Erro ao enviar localização:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /chats/:chatId/send-media - Enviar mídia para um chat específico
// POST /chats/:chatId/send-media - Enviar mídia para um chat específico
app.post('/chats/:chatId/send-media', upload.single('file'), async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ success: false, error: 'Bot not ready' });
    }

    try {
        const { chatId } = req.params;
        const { caption } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Missing file' });
        }

        const sendTask = async () => {
            // Simular digitação
            const chatObj = await client.getChatById(chatId);
            await chatObj.sendStateTyping();
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Criar MessageMedia a partir do buffer
            console.log(`📥 Processando arquivo: ${file.originalname}`);
            const media = new MessageMedia(
                file.mimetype,
                file.buffer.toString('base64'),
                file.originalname
            );

            // Enviar mídia
            await client.sendMessage(chatId, media, {
                caption: caption || '',
                sendSeen: false
            });

            await chatObj.clearState();

            // Adicionar mensagem ao histórico
            const chats = readChatsFile();
            if (chats[chatId]) {
                const messageObj = {
                    id: `msg_${Date.now()}`,
                    from: chatId,
                    fromMe: true,
                    body: caption || '📷 Imagem enviada',
                    timestamp: new Date().toISOString(),
                    type: 'image',
                    hasMedia: true
                };

                chats[chatId].messages.push(messageObj);
                chats[chatId].lastMessage = caption || '📷 Imagem';
                chats[chatId].lastMessageTime = new Date().toISOString();
                writeChatsFile(chats);
            }

            console.log(`📤 Mídia enviada para ${chatId}`);
            return { success: true };
        };

        const result = await messageQueue.add(sendTask);
        res.json(result);
    } catch (error) {
        console.error('Erro ao enviar mídia:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== FIM DOS ENDPOINTS DE MÍDIA ==========

// ========== ENDPOINTS DE IA ==========

// POST /ai/toggle - Ativar/desativar IA
app.post('/ai/toggle', (req, res) => {
    try {
        const { enabled } = req.body;
        aiEnabled = enabled;
        console.log(`🤖 IA ${aiEnabled ? 'ATIVADA' : 'DESATIVADA'}`);
        res.json({ success: true, aiEnabled });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /ai/status - Status da IA
app.get('/ai/status', (req, res) => {
    res.json({
        enabled: aiEnabled,
        available: !!genAI,
        model: process.env.AI_MODEL || 'gemini-1.5-flash',
        hasApiKey: !!process.env.GEMINI_API_KEY
    });
});

// GET /ai/knowledge - Obter base de conhecimento atual
app.get('/ai/knowledge', (req, res) => {
    try {
        res.json(knowledgeBase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /ai/knowledge - Atualizar base de conhecimento
app.post('/ai/knowledge', (req, res) => {
    try {
        const newKnowledge = req.body;

        // Salvar em arquivo
        fs.writeFileSync(knowledgeBasePath, JSON.stringify(newKnowledge, null, 2));

        // Atualizar em memória
        knowledgeBase = newKnowledge;

        console.log('📚 Base de conhecimento atualizada via API');
        res.json({ success: true, knowledgeBase });
    } catch (error) {
        console.error('Erro ao atualizar base de conhecimento:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== FIM DOS ENDPOINTS DE IA ==========



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
