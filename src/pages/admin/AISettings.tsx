
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Save, Power, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BOT_API_URL } from '@/config/bot';

export default function AISettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [aiStatus, setAiStatus] = useState<any>(null);
    const [knowledgeBase, setKnowledgeBase] = useState<any>({
        loja: {},
        produtos: {},
        entrega: {},
        pagamento: {},
        politicas: {}
    });
    const { toast } = useToast();

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${BOT_API_URL}/ai/status`);
            const data = await res.json();
            setAiStatus(data);
        } catch (error) {
            console.error('Erro ao buscar status:', error);
        }
    };

    const fetchKnowledge = async () => {
        try {
            const res = await fetch(`${BOT_API_URL}/ai/knowledge`);
            const data = await res.json();
            setKnowledgeBase(data);
        } catch (error) {
            console.error('Erro ao buscar base de conhecimento:', error);
            toast({
                title: "Erro ao carregar dados",
                description: "Verifique se o bot está conectado.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleAI = async (enabled: boolean) => {
        try {
            const res = await fetch(`${BOT_API_URL}/ai/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });
            const data = await res.json();
            if (data.success) {
                setAiStatus((prev: any) => ({ ...prev, enabled: data.aiEnabled }));
                toast({
                    title: `IA ${data.aiEnabled ? 'Ativada' : 'Desativada'}`,
                    description: "Configuração atualizada com sucesso."
                });
            }
        } catch (error) {
            toast({
                title: "Erro ao alterar status",
                variant: "destructive"
            });
        }
    };

    const saveKnowledge = async () => {
        setSaving(true);
        try {
            // Processar arrays de string (produtos, formas de pagamento)
            const processedKnowledge = { ...knowledgeBase };

            // Garantir que arrays sejam salvos corretamente se editados como texto
            if (typeof processedKnowledge.produtos.em_destaque === 'string') {
                processedKnowledge.produtos.em_destaque = processedKnowledge.produtos.em_destaque.split(',').map((i: string) => i.trim());
            }
            if (typeof processedKnowledge.pagamento.formas === 'string') {
                processedKnowledge.pagamento.formas = processedKnowledge.pagamento.formas.split(',').map((i: string) => i.trim());
            }

            const res = await fetch(`${BOT_API_URL}/ai/knowledge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(processedKnowledge)
            });

            if (res.ok) {
                toast({
                    title: "Alterações salvas!",
                    description: "O cérebro do bot foi atualizado."
                });
                fetchKnowledge(); // Recarregar para garantir consistência
            }
        } catch (error) {
            toast({
                title: "Erro ao salvar",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchKnowledge();
    }, []);

    const handleChange = (section: string, field: string, value: string) => {
        setKnowledgeBase((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    if (loading) {
        return <div className="flex justify-center p-8"><RefreshCw className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Bot className="h-8 w-8 text-primary" />
                        Inteligência Artificial
                    </h1>
                    <p className="text-muted-foreground">Configure como o bot responde aos seus clientes</p>
                </div>

                <div className="flex items-center gap-4 bg-card border rounded-lg p-3 shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">Status da IA</span>
                        <span className="text-xs text-muted-foreground">
                            {aiStatus?.enabled ? 'Respondendo automaticamente' : 'Desligada'}
                        </span>
                    </div>
                    <Switch
                        checked={aiStatus?.enabled}
                        onCheckedChange={toggleAI}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                {/* Status Card */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span>Conexão Bot</span>
                                {aiStatus?.available ? (
                                    <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Online</span>
                                ) : (
                                    <span className="text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Offline</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>Modelo</span>
                                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{aiStatus?.model}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>API Key</span>
                                {aiStatus?.hasApiKey ? (
                                    <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Configurada</span>
                                ) : (
                                    <span className="text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Ausente</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <h3 className="font-medium mb-2 flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                Dica
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Mantenha as informações atualizadas. A IA usa exatamente o que está escrito aqui para responder aos clientes.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>Base de Conhecimento</CardTitle>
                        <CardDescription>Edite as informações que a IA usa para responder</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="store">
                            <TabsList className="grid w-full grid-cols-4 mb-6">
                                <TabsTrigger value="store">Loja</TabsTrigger>
                                <TabsTrigger value="products">Produtos</TabsTrigger>
                                <TabsTrigger value="delivery">Entrega</TabsTrigger>
                                <TabsTrigger value="payments">Pagamentos</TabsTrigger>
                            </TabsList>

                            {/* LOJA */}
                            <TabsContent value="store" className="space-y-4">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Nome da Loja</Label>
                                        <Input
                                            value={knowledgeBase.loja?.nome || ''}
                                            onChange={(e) => handleChange('loja', 'nome', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descrição</Label>
                                        <Textarea
                                            value={knowledgeBase.loja?.descricao || ''}
                                            onChange={(e) => handleChange('loja', 'descricao', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Horário de Funcionamento</Label>
                                        <Textarea
                                            value={knowledgeBase.loja?.horario || ''}
                                            onChange={(e) => handleChange('loja', 'horario', e.target.value)}
                                            rows={3}
                                            placeholder="Ex: Seg-Sex 8h às 18h..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Telefone</Label>
                                            <Input
                                                value={knowledgeBase.loja?.telefone || ''}
                                                onChange={(e) => handleChange('loja', 'telefone', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Endereço</Label>
                                            <Input
                                                value={knowledgeBase.loja?.endereco || ''}
                                                onChange={(e) => handleChange('loja', 'endereco', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* PRODUTOS */}
                            <TabsContent value="products" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Produtos em Destaque (separe por vírgula)</Label>
                                    <Textarea
                                        value={Array.isArray(knowledgeBase.produtos?.em_destaque)
                                            ? knowledgeBase.produtos.em_destaque.join(', ')
                                            : knowledgeBase.produtos?.em_destaque || ''}
                                        onChange={(e) => handleChange('produtos', 'em_destaque', e.target.value)}
                                        rows={4}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Texto de Disponibilidade</Label>
                                    <Input
                                        value={knowledgeBase.produtos?.disponibilidade || ''}
                                        onChange={(e) => handleChange('produtos', 'disponibilidade', e.target.value)}
                                        placeholder="Ex: Consulte catálogo completo no site"
                                    />
                                </div>
                            </TabsContent>

                            {/* ENTREGA */}
                            <TabsContent value="delivery" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Prazo de Entrega</Label>
                                    <Input
                                        value={knowledgeBase.entrega?.prazo || ''}
                                        onChange={(e) => handleChange('entrega', 'prazo', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Áreas Atendidas</Label>
                                    <Input
                                        value={knowledgeBase.entrega?.areas_atendidas || ''}
                                        onChange={(e) => handleChange('entrega', 'areas_atendidas', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Política de Frete</Label>
                                    <Input
                                        value={knowledgeBase.entrega?.frete || ''}
                                        onChange={(e) => handleChange('entrega', 'frete', e.target.value)}
                                    />
                                </div>
                            </TabsContent>

                            {/* PAGAMENTO */}
                            <TabsContent value="payments" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Formas de Pagamento (separe por vírgula)</Label>
                                    <Textarea
                                        value={Array.isArray(knowledgeBase.pagamento?.formas)
                                            ? knowledgeBase.pagamento.formas.join(', ')
                                            : knowledgeBase.pagamento?.formas || ''}
                                        onChange={(e) => handleChange('pagamento', 'formas', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Condições de Parcelamento</Label>
                                    <Input
                                        value={knowledgeBase.pagamento?.parcelamento || ''}
                                        onChange={(e) => handleChange('pagamento', 'parcelamento', e.target.value)}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="mt-8 flex justify-end">
                            <Button onClick={saveKnowledge} disabled={saving} className="min-w-[150px]">
                                {saving ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Salvar Alterações
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
