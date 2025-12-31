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

        console.log("Iniciando desconexão...");
        setLoading(true);

        try {
            // Timeout de 5 segundos para não travar
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            console.log(`Chamando ${BOT_API_URL}/logout`);
            const res = await fetch(`${BOT_API_URL}/logout`, {
                method: 'POST',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                setStatus(null);
                toast({ title: "Desconectado", description: "Sessão encerrada com sucesso." });
                setTimeout(checkStatus, 1500);
            } else {
                throw new Error(`Erro do servidor: ${res.status}`);
            }
        } catch (err: any) {
            console.error('Erro ao desconectar:', err);

            // Mesmo com erro, forçamos o reset da interface para o usuário não ficar travado
            setStatus(null);

            const message = err.name === 'AbortError'
                ? "Tempo limite excedido. Reiniciando interface..."
                : "Erro ao comunicar com o bot. Interface reiniciada.";

            toast({
                title: "Desconexão Forçada",
                description: message,
                variant: "destructive"
            });

            // Tenta verificar status novamente em breve
            setTimeout(checkStatus, 3000);
        } finally {
            // Opcionalmente podemos deixar o checkStatus lidar com o loading, 
            // mas aqui garantimos que não fica travado
            if (!status) setLoading(false);
        }
    };

    const handleReset = async () => {
        setLoading(true);
        toast({ title: "Reiniciando...", description: "Tentando gerar novo QR Code." });

        try {
            // Tenta desconectar sem confirmar
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            await fetch(`${BOT_API_URL}/logout`, {
                method: 'POST',
                signal: controller.signal
            }).catch(() => { }); // Ignora erros de logout no reset

            clearTimeout(timeoutId);
        } finally {
            // Sempre limpa e tenta pegar novo status
            setStatus(null);
            setTimeout(() => {
                checkStatus();
                // Se ainda falhar, tenta de novo em 3s
                setTimeout(checkStatus, 3000);
            }, 1000);

            // Loading fica false quando checkStatus terminar
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">WhatsApp para Clientes</h1>
                    <p className="text-muted-foreground">Envie mensagens diretamente aos seus clientes pelo seu WhatsApp</p>
                </div>
                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${status?.ready
                    ? 'bg-green-100 border-green-200 text-green-700'
                    : 'bg-muted border-border text-muted-foreground'
                    }`}>
                    {status?.ready ? (
                        <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-medium">Conectado</span>
                        </>
                    ) : (
                        <>
                            <Smartphone className="h-4 w-4" />
                            <span className="font-medium">Não Conectado</span>
                        </>
                    )}
                </div>
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
                {/* Connection Tab */}
                <TabsContent value="connection" className="space-y-6">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 space-y-8">
                            {/* QR Code Area */}
                            <div className="relative">
                                {status?.qr ? (
                                    <div className="p-4 bg-white rounded-xl shadow-sm border">
                                        <QRCodeSVG value={status.qr} size={200} />
                                    </div>
                                ) : status?.ready ? (
                                    <div className="h-48 w-48 rounded-xl bg-green-50 border-2 border-green-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-20 w-20 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="h-48 w-48 rounded-xl bg-muted/50 border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                                        <RefreshCw className="h-12 w-12 text-muted-foreground animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="text-center space-y-2 max-w-md">
                                <h2 className="text-2xl font-semibold">
                                    {status?.ready ? 'WhatsApp Conectado' : 'Conecte seu WhatsApp'}
                                </h2>
                                <p className="text-muted-foreground">
                                    {status?.ready
                                        ? 'Seu WhatsApp está conectado e pronto para enviar mensagens.'
                                        : 'Escaneie o QR Code para conectar seu WhatsApp e enviar mensagens diretamente aos seus clientes.'}
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 w-full max-w-md">
                                {!status?.ready && (
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white min-w-[180px] h-11"
                                        onClick={checkStatus}
                                        disabled={loading}
                                    >
                                        <Smartphone className="h-4 w-4 mr-2" />
                                        Conectar WhatsApp
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    className="min-w-[180px] h-11"
                                    onClick={checkStatus}
                                    disabled={loading}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    {status?.ready ? 'Verificar Status' : 'Tentar Reconectar'}
                                </Button>

                                {status?.ready && (
                                    <Button
                                        variant="destructive"
                                        className="min-w-[180px] h-11"
                                        onClick={handleDisconnect}
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Desconectar
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Connection Lost Alert - Show if error or explicitly disconnected */}
                    {(error || (!status?.ready && !loading && !status?.qr)) && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 flex gap-3 items-start">
                            <AlertTitle className="mt-0.5">
                                <XCircle className="h-5 w-5 text-yellow-600" />
                            </AlertTitle>
                            <div className="space-y-1">
                                <h4 className="font-medium leading-none text-yellow-900">Conexão perdida</h4>
                                <p className="text-sm text-yellow-700">
                                    Sua conexão anterior foi desconectada. Tente reconectar ou escaneie o QR Code novamente.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Footer Action */}
                    <div className="flex justify-center">
                        <Button
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={handleReset}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reiniciar e Gerar Novo QR
                        </Button>
                    </div>

                    <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
                        Com o WhatsApp conectado, você poderá enviar notificações de cobrança e comprovantes diretamente para os telefones dos seus clientes.
                    </p>
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
