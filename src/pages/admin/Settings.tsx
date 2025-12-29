import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save, Clock, DollarSign, MapPin, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface SystemSettings {
    deliveryFee: number;
    deliveryRadius: number;
    estimatedDeliveryTime: number;
    workingHours: {
        start: string;
        end: string;
    };
    isOpen: boolean;
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
        isOpen: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                const settingsObj: any = {};
                data.forEach(item => {
                    settingsObj[item.key] = item.value;
                });

                setSettings({
                    deliveryFee: settingsObj.deliveryFee || 5.0,
                    deliveryRadius: settingsObj.deliveryRadius || 10,
                    estimatedDeliveryTime: settingsObj.estimatedDeliveryTime || 60,
                    workingHours: settingsObj.workingHours || { start: '08:00', end: '18:00' },
                    isOpen: settingsObj.isOpen ?? true
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            // Upsert each setting
            const settingsArray = [
                { key: 'deliveryFee', value: settings.deliveryFee },
                { key: 'deliveryRadius', value: settings.deliveryRadius },
                { key: 'estimatedDeliveryTime', value: settings.estimatedDeliveryTime },
                { key: 'workingHours', value: settings.workingHours },
                { key: 'isOpen', value: settings.isOpen }
            ];

            for (const setting of settingsArray) {
                const { error } = await supabase
                    .from('settings')
                    .upsert({ key: setting.key, value: setting.value }, { onConflict: 'key' });

                if (error) throw error;
            }

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

                    <Separator />

                    {/* Delivery Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <Label>Configurações de Entrega</Label>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="delivery-fee">Taxa de Entrega (R$)</Label>
                                <Input
                                    id="delivery-fee"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={settings.deliveryFee}
                                    onChange={(e) => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="delivery-radius">Raio de Entrega (km)</Label>
                                <Input
                                    id="delivery-radius"
                                    type="number"
                                    min="1"
                                    value={settings.deliveryRadius}
                                    onChange={(e) => setSettings({ ...settings, deliveryRadius: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="delivery-time">Tempo Estimado (min)</Label>
                                <Input
                                    id="delivery-time"
                                    type="number"
                                    min="10"
                                    value={settings.estimatedDeliveryTime}
                                    onChange={(e) => setSettings({ ...settings, estimatedDeliveryTime: parseInt(e.target.value) })}
                                />
                            </div>
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
                        <a href="/admin/whatsapp" className="text-primary hover:underline">WhatsApp</a>.
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
        </div>
    );
}
