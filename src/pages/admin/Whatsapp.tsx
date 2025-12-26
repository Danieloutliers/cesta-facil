import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, XCircle, Smartphone, LogOut } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function WhatsappConnect() {
    const [status, setStatus] = useState<{ ready: boolean; qr: string | null } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const checkStatus = async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch('http://localhost:3001/status');
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            console.error('Error fetching bot status:', err);
            // If fetch fails, the bot server is likely down
            setStatus(null);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Tem certeza que deseja desconectar o WhatsApp?')) return;

        setLoading(true);
        try {
            await fetch('http://localhost:3001/logout', { method: 'POST' });
            // Delay to allow reset
            setTimeout(checkStatus, 2000);
        } catch (err) {
            console.error('Erro ao desconectar:', err);
            alert('Erro ao desconectar. Verifique se o robô está rodando.');
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
        // Poll every 5 seconds
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Conexão WhatsApp</h1>
                <p className="text-muted-foreground">Gerencie a conexão do seu robô de automação</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Status Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Status da Conexão</CardTitle>
                        <CardDescription>Verifique se o robô está online e pronto para enviar mensagens.</CardDescription>
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
                                    O servidor do robô não está rodando. Abra o terminal e rode <code>npm start</code> na pasta <code>bot</code>.
                                </AlertDescription>
                            </Alert>
                        ) : status?.ready ? (
                            <Alert className="bg-green-50 border-green-200 text-green-900">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertTitle>Conectado!</AlertTitle>
                                <AlertDescription>
                                    O WhatsApp está conectado e pronto para enviar mensagens automáticas.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-900">
                                <Smartphone className="h-4 w-4 text-yellow-600" />
                                <AlertTitle>Aguardando Conexão</AlertTitle>
                                <AlertDescription>
                                    Escaneie o QR Code ao lado para conectar seu WhatsApp.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={checkStatus} disabled={loading} className="flex-1">
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Atualizar Status
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

                {/* QR Code Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>QR Code</CardTitle>
                        <CardDescription>Use seu celular para escanear.</CardDescription>
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
        </div>
    );
}
