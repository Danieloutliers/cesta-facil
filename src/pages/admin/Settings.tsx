import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save, Clock, DollarSign, MapPin, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const toNumber = (value: unknown, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

interface SystemSettings {
    deliveryFee: number;
    deliveryRadius: number;
    estimatedDeliveryTime: number;
    workingHours: {
        start: string;
        end: string;
    };
    isOpen: boolean;
    profitMargin: number;
    installmentRate1to2: number;
    installmentRate3to5: number;
}

export default function Settings() {
    const [settings, setSettings] = useState<SystemSettings>({
        deliveryFee: 5.0,
        deliveryRadius: 10,
        estimatedDeliveryTime: 60,
        workingHours: {
            start: '08:00',
            end: '18:00'
        },
        isOpen: true,
        profitMargin: 30, // Default 30%
        installmentRate1to2: 0,
        installmentRate3to5: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        void loadSettings();
        // Load once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                const settingsObj: Record<string, unknown> = {};
                data.forEach(item => {
                    settingsObj[item.key] = item.value;
                });

                const workingHours = settingsObj.workingHours as SystemSettings['workingHours'] | undefined;

                setSettings({
                    deliveryFee: toNumber(settingsObj.deliveryFee, 5.0),
                    deliveryRadius: toNumber(settingsObj.deliveryRadius, 10),
                    estimatedDeliveryTime: toNumber(settingsObj.estimatedDeliveryTime, 60),
                    workingHours: workingHours ?? { start: '08:00', end: '18:00' },
                    isOpen: typeof settingsObj.isOpen === 'boolean' ? settingsObj.isOpen : true,
                    profitMargin: toNumber(settingsObj.profitMargin, 30),
                    installmentRate1to2: toNumber(settingsObj.installmentRate1to2, 0),
                    installmentRate3to5: toNumber(settingsObj.installmentRate3to5, 0)
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            toast({
                title: 'Erro ao carregar configurações',
                description: 'Os valores padrão foram aplicados.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            // Upsert each setting
            // Never persist NaN/undefined (e.g. an emptied number input).
            const settingsArray = [
                { key: 'deliveryFee', value: Number.isFinite(settings.deliveryFee) ? settings.deliveryFee : 0 },
                { key: 'deliveryRadius', value: Number.isFinite(settings.deliveryRadius) ? settings.deliveryRadius : 0 },
                { key: 'estimatedDeliveryTime', value: Number.isFinite(settings.estimatedDeliveryTime) ? settings.estimatedDeliveryTime : 0 },
                { key: 'workingHours', value: settings.workingHours },
                { key: 'isOpen', value: settings.isOpen },
                { key: 'profitMargin', value: Number.isFinite(settings.profitMargin) ? settings.profitMargin : 0 },
                { key: 'installmentRate1to2', value: Number.isFinite(settings.installmentRate1to2) ? settings.installmentRate1to2 : 0 },
                { key: 'installmentRate3to5', value: Number.isFinite(settings.installmentRate3to5) ? settings.installmentRate3to5 : 0 }
            ];

            const results = await Promise.all(
                settingsArray.map((setting) =>
                    supabase
                        .from('settings')
                        .upsert({ key: setting.key, value: setting.value }, { onConflict: 'key' })
                )
            );

            const failed = results.find((result) => result.error);
            if (failed?.error) throw failed.error;

            toast({ title: 'Configurações salvas!', description: 'As alterações foram salvas com sucesso' });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({ title: 'Erro', description: 'Falha ao salvar configurações', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
                <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
            </div>

            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Configurações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Store Status */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="isOpen">Loja Aberta</Label>
                            <p className="text-sm text-muted-foreground">
                                Permitir novos pedidos
                            </p>
                        </div>
                        <Switch
                            id="isOpen"
                            checked={settings.isOpen}
                            onCheckedChange={(checked) => setSettings({ ...settings, isOpen: checked })}
                        />
                    </div>

                    <Separator />

                    {/* Working Hours */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Label>Horário de Funcionamento</Label>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="start-time">Abertura</Label>
                                <Input
                                    id="start-time"
                                    type="time"
                                    value={settings.workingHours.start}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        workingHours: { ...settings.workingHours, start: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-time">Fechamento</Label>
                                <Input
                                    id="end-time"
                                    type="time"
                                    value={settings.workingHours.end}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        workingHours: { ...settings.workingHours, end: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Financial Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                        Configurações Financeiras
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <p className="text-sm">Defina os parâmetros para cálculo de preços e lucros.</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="profit-margin">Margem de Lucro Padrão (%)</Label>
                                <div className="relative">
                                    <Input
                                        id="profit-margin"
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        className="pl-3 pr-8"
                                        value={settings.profitMargin}
                                        onChange={(e) => setSettings({ ...settings, profitMargin: parseFloat(e.target.value) || 0 })}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Valor sugerido ao cadastrar novos produtos.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <Label>Taxas de Parcelamento (Carnê Digital)</Label>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="rate-1-2">Taxa 1-2 Parcelas (%)</Label>
                                <div className="relative">
                                    <Input
                                        id="rate-1-2"
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        className="pl-3 pr-8"
                                        value={settings.installmentRate1to2}
                                        onChange={(e) => setSettings({ ...settings, installmentRate1to2: parseFloat(e.target.value) || 0 })}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rate-3-5">Taxa 3-5 Parcelas (%)</Label>
                                <div className="relative">
                                    <Input
                                        id="rate-3-5"
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        className="pl-3 pr-8"
                                        value={settings.installmentRate3to5}
                                        onChange={(e) => setSettings({ ...settings, installmentRate3to5: parseFloat(e.target.value) || 0 })}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>

            {/* Delivery Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Configurações de Entrega
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="delivery-fee">Taxa de Entrega (R$)</Label>
                            <Input
                                id="delivery-fee"
                                type="number"
                                step="0.01"
                                min="0"
                                value={settings.deliveryFee}
                                onChange={(e) => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="delivery-radius">Raio de Entrega (km)</Label>
                            <Input
                                id="delivery-radius"
                                type="number"
                                min="1"
                                value={settings.deliveryRadius}
                                onChange={(e) => setSettings({ ...settings, deliveryRadius: parseInt(e.target.value, 10) || 0 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="delivery-time">Tempo Estimado (min)</Label>
                            <Input
                                id="delivery-time"
                                type="number"
                                min="10"
                                value={settings.estimatedDeliveryTime}
                                onChange={(e) => setSettings({ ...settings, estimatedDeliveryTime: parseInt(e.target.value, 10) || 0 })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* WhatsApp Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Configurações do WhatsApp
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        As configurações de templates e bot WhatsApp estão na página{' '}
                        <Link to="/admin/whatsapp" className="text-primary hover:underline">WhatsApp</Link>.
                    </p>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={saving} size="lg">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
            </div>
        </div >
    );
}
