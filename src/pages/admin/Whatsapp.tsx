import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RefreshCw, CheckCircle2, XCircle, Smartphone, LogOut, Send, History, Settings2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BOT_API_URL } from '@/config/bot';

interface MessageLog {
    timestamp: string;
    phone: string;
    message: string;
    status: string;
    chatId?: string;
    error?: string;
}

interface Templates {
    processing: string;
    separating: string;
    out_for_delivery: string;
    delivered: string;
}

export default function WhatsappConnect() {
    const [status, setStatus] = useState<{ ready: boolean; qr: string | null } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [messageLog, setMessageLog] = useState<MessageLog[]>([]);
    const [templates, setTemplates] = useState<Templates | null>(null);
    const [editingTemplates, setEditingTemplates] = useState<Templates | null>(null);

    // Manual send state
    const [manualPhone, setManualPhone] = useState('');
    const [manualMessage, setManualMessage] = useState('');
    const [sending, setSending] = useState(false);

    const { toast } = useToast();

    const checkStatus = async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch(`${BOT_API_URL}/status`);
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            console.error('Error fetching bot status:', err);
            setStatus(null);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const loadMessageLog = async () => {
        try {
            const res = await fetch(`${BOT_API_URL}/message-log`);
            const data = await res.json();
            setMessageLog(data);
        } catch (err) {
            console.error('Error loading message log:', err);
        }
    };

    const loadTemplates = async () => {
        try {
            const res = await fetch(`${BOT_API_URL}/templates`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            } else {
                throw new Error('Failed to fetch');
            }
        } catch (err) {
            console.error('Error loading templates:', err);
            // Fallback templates so the UI isn't empty even if bot is offline
            setTemplates({
                processing: "Olá {nome}! 🛒\n\nSeu pedido #{pedido} foi recebido e está sendo processado.\n\n*Itens:*\n{itens}\n\n*Total:* R$ {total}\n*Endereço:* {endereco}\n\nEm breve atualizaremos você!",
                separating: "Oi {nome}! 📦\n\nSeu pedido #{pedido} está sendo separado.\nLogo estará a caminho!",
                out_for_delivery: "Oba {nome}! 🚚\n\nSeu pedido #{pedido} saiu para entrega!\nEm breve chegará no endereço:\n{endereco}",
                delivered: "Pedido entregue! ✅\n\nObrigado pela preferência, {nome}!\nPedido #{pedido} foi entregue com sucesso."
            });
        }
    };

    const saveTemplates = async () => {
        if (!editingTemplates) return;

        try {
            const res = await fetch(`${BOT_API_URL}/templates`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingTemplates)
            });

            if (res.ok) {
                setTemplates(editingTemplates);
                toast({ title: "Templates salvos com sucesso!" });
            } else {
                throw new Error('Failed to save');
            }
        } catch (err) {
            toast({ title: "Erro ao salvar templates", description: "Verifique se o robô está ligado.", variant: "destructive" });
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Tem certeza que deseja desconectar o WhatsApp?')) return;

        setLoading(true);
        try {
            await fetch(`${BOT_API_URL}/logout`, { method: 'POST' });
            setTimeout(checkStatus, 2000);
        } catch (err) {
            console.error('Erro ao desconectar:', err);
            alert('Erro ao desconectar. Verifique se o robô está rodando.');
            setLoading(false);
        }
    };

    const handleManualSend = async () => {
        if (!manualPhone || !manualMessage) {
            toast({ title: "Preencha o número e a mensagem", variant: "destructive" });
            return;
        }

        setSending(true);
        try {
            const res = await fetch(`${BOT_API_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: manualPhone, message: manualMessage })
            });

            if (res.ok) {
                toast({ title: "✅ Mensagem enviada com sucesso!" });
                setManualPhone('');
                setManualMessage('');
                loadMessageLog(); // Refresh log
            } else {
                const data = await res.json();
                toast({ title: "Erro ao enviar", description: data.error, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Erro de conexão", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        checkStatus();
        loadMessageLog();
        loadTemplates();

        const interval = setInterval(checkStatus, 5000);
        const logInterval = setInterval(loadMessageLog, 10000);

        return () => {
            clearInterval(interval);
            clearInterval(logInterval);
        };
    }, []);

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gerenciamento WhatsApp</h1>
                <p className="text-muted-foreground">Gerencie mensagens e conexão com o WhatsApp</p>
            </div>

            <Tabs defaultValue="connection" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="connection">
                        <Smartphone className="h-4 w-4 mr-2" />
                        Conexão
                    </TabsTrigger>
                    <TabsTrigger value="manual">
                        <Send className="h-4 w-4 mr-2" />
                        Envio Manual
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <History className="h-4 w-4 mr-2" />
                        Histórico
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <Settings2 className="h-4 w-4 mr-2" />
                        Templates
                    </TabsTrigger>
                </TabsList>

                {/* Connection Tab */}
                <TabsContent value="connection" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status da Conexão</CardTitle>
                                <CardDescription>Verifique se o robô está online</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {loading && !status && !error ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Verificando...
                                    </div>
                                ) : error ? (
                                    <Alert variant="destructive">
                                        <XCircle className="h-4 w-4" />
                                        <AlertTitle>Robô Offline</AlertTitle>
                                        <AlertDescription>
                                            Inicie o robô com <code>npm run bot</code>
                                        </AlertDescription>
                                    </Alert>
                                ) : status?.ready ? (
                                    <Alert className="bg-green-50 border-green-200 text-green-900">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertTitle>Conectado!</AlertTitle>
                                        <AlertDescription>
                                            WhatsApp conectado e pronto
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert className="bg-yellow-50 border-yellow-200 text-yellow-900">
                                        <Smartphone className="h-4 w-4 text-yellow-600" />
                                        <AlertTitle>Aguardando Conexão</AlertTitle>
                                        <AlertDescription>
                                            Escaneie o QR Code
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={checkStatus} disabled={loading} className="flex-1">
                                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                        Atualizar
                                    </Button>

                                    {status?.ready && (
                                        <Button variant="destructive" onClick={handleDisconnect} disabled={loading} className="flex-1">
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Desconectar
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>QR Code</CardTitle>
                                <CardDescription>Escaneie com seu celular</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-6 min-h-[300px]">
                                {status?.qr ? (
                                    <div className="p-4 bg-white rounded-lg shadow-sm border">
                                        <QRCodeSVG value={status.qr} size={256} />
                                    </div>
                                ) : status?.ready ? (
                                    <div className="flex flex-col items-center gap-4 text-green-600">
                                        <CheckCircle2 className="h-16 w-16" />
                                        <p className="font-semibold">Sincronizado</p>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                        <XCircle className="h-16 w-16" />
                                        <p>Servidor desligado</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                        <RefreshCw className="h-16 w-16 animate-spin" />
                                        <p>Aguardando QR Code...</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Manual Send Tab */}
                <TabsContent value="manual" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Enviar Mensagem Manualmente</CardTitle>
                            <CardDescription>Envie uma mensagem personalizada para qualquer número</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Número do WhatsApp</Label>
                                <Input
                                    id="phone"
                                    placeholder="11999999999"
                                    value={manualPhone}
                                    onChange={(e) => setManualPhone(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Mensagem</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Digite sua mensagem..."
                                    rows={6}
                                    value={manualMessage}
                                    onChange={(e) => setManualMessage(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleManualSend} disabled={sending || !status?.ready} className="w-full">
                                <Send className="h-4 w-4 mr-2" />
                                {sending ? 'Enviando...' : 'Enviar Mensagem'}
                            </Button>
                            {!status?.ready && (
                                <p className="text-sm text-muted-foreground text-center">
                                    ⚠️ Conecte o WhatsApp primeiro
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Mensagens</CardTitle>
                            <CardDescription>Últimas 50 mensagens enviadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {messageLog.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        Nenhuma mensagem enviada ainda
                                    </p>
                                ) : (
                                    messageLog.map((log, index) => (
                                        <div key={index} className="border rounded-lg p-3 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{log.phone}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatTimestamp(log.timestamp)}
                                                    </p>
                                                </div>
                                                <div className={`text-xs px-2 py-1 rounded ${log.status === 'sent' ? 'bg-green-100 text-green-800' :
                                                    log.status === 'sent_fallback' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {log.status === 'sent' ? '✓ Enviada' :
                                                        log.status === 'sent_fallback' ? '⚠ Enviada (fallback)' :
                                                            '✗ Falhou'}
                                                </div>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{log.message}</p>
                                            {log.error && (
                                                <p className="text-xs text-red-600">Erro: {log.error}</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Editar Templates de Mensagens</CardTitle>
                            <CardDescription>
                                Personalize as mensagens automáticas. Use: {'{'}nome{'}'}, {'{'}pedido{'}'}, {'{'}itens{'}'}, {'{'}total{'}'}, {'{'}endereco{'}'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {templates && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" onClick={() => setEditingTemplates(templates)}>
                                            <Settings2 className="h-4 w-4 mr-2" />
                                            Editar Templates
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Editar Mensagens Automáticas</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Processando</Label>
                                                <Textarea
                                                    rows={6}
                                                    value={editingTemplates?.processing || ''}
                                                    onChange={(e) => setEditingTemplates(prev => prev ? { ...prev, processing: e.target.value } : null)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Separando</Label>
                                                <Textarea
                                                    rows={4}
                                                    value={editingTemplates?.separating || ''}
                                                    onChange={(e) => setEditingTemplates(prev => prev ? { ...prev, separating: e.target.value } : null)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Em Rota de Entrega</Label>
                                                <Textarea
                                                    rows={4}
                                                    value={editingTemplates?.out_for_delivery || ''}
                                                    onChange={(e) => setEditingTemplates(prev => prev ? { ...prev, out_for_delivery: e.target.value } : null)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Entregue</Label>
                                                <Textarea
                                                    rows={4}
                                                    value={editingTemplates?.delivered || ''}
                                                    onChange={(e) => setEditingTemplates(prev => prev ? { ...prev, delivered: e.target.value } : null)}
                                                />
                                            </div>
                                            <Button onClick={saveTemplates} className="w-full">
                                                Salvar Templates
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}

                            <div className="space-y-4 mt-4">
                                <h3 className="font-medium">Preview dos Templates Atuais:</h3>
                                {templates && Object.entries(templates).map(([key, value]) => (
                                    <div key={key} className="border rounded-lg p-3">
                                        <p className="font-medium text-sm mb-2 capitalize">
                                            {key === 'processing' ? 'Processando' :
                                                key === 'separating' ? 'Separando' :
                                                    key === 'out_for_delivery' ? 'Em Rota' :
                                                        'Entregue'}
                                        </p>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
