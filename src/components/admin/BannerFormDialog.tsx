import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { uploadBannerImage, useBannerMutations } from '@/hooks/useBanners';
import { Banner } from '@/types';
import { Loader2, Upload } from 'lucide-react';

interface BannerFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    banner?: Banner;
    onSuccess: () => void;
}

const gradientOptions = [
    { value: 'from-violet-600 to-indigo-600', label: 'Roxo → Índigo' },
    { value: 'from-red-600 to-rose-600', label: 'Vermelho → Rosa' },
    { value: 'from-green-600 to-emerald-600', label: 'Verde → Esmeralda' },
    { value: 'from-blue-600 to-cyan-600', label: 'Azul → Ciano' },
    { value: 'from-orange-500 to-amber-500', label: 'Laranja → Âmbar' },
    { value: 'from-pink-600 to-purple-600', label: 'Rosa → Roxo' },
    { value: 'from-yellow-500 to-orange-500', label: 'Amarelo → Laranja' },
];

const iconOptions = [
    { value: 'Percent', label: 'Porcentagem (Promoção)' },
    { value: 'Beef', label: 'Carne' },
    { value: 'Apple', label: 'Maçã (Hortifruti)' },
    { value: 'CreditCard', label: 'Cartão de Crédito' },
    { value: 'Truck', label: 'Caminhão (Entrega)' },
    { value: 'ShoppingBag', label: 'Sacola de Compras' },
    { value: 'Gift', label: 'Presente' },
    { value: 'Star', label: 'Estrela' },
];

export function BannerFormDialog({ open, onOpenChange, banner, onSuccess }: BannerFormDialogProps) {
    const { createBanner, updateBanner } = useBannerMutations();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: banner?.title || '',
        description: banner?.description || '',
        image_url: banner?.image_url || '',
        gradient: banner?.gradient !== undefined ? banner.gradient : 'from-violet-600 to-indigo-600',
        icon: banner?.icon || 'ShoppingBag',
        button_text: banner?.button_text || '',
        link: banner?.link || '/montar-cesta',
        display_order: banner?.display_order || 1,
        active: banner?.active ?? true,
        use_blur: banner?.use_blur ?? false,
        blur_amount: banner?.blur_amount ?? 4,
    });

    useEffect(() => {
        if (open) {
            if (banner) {
                setFormData({
                    title: banner.title || '',
                    description: banner.description || '',
                    image_url: banner.image_url || '',
                    gradient: banner.gradient !== undefined ? banner.gradient : 'from-violet-600 to-indigo-600',
                    icon: banner.icon || 'ShoppingBag',
                    button_text: banner.button_text || '',
                    link: banner.link || '/montar-cesta',
                    display_order: banner.display_order || 1,
                    active: banner.active ?? true,
                    use_blur: banner.use_blur ?? false,
                    blur_amount: banner.blur_amount ?? 4,
                });
            } else {
                // Reset form when opening for new banner
                setFormData({
                    title: '',
                    description: '',
                    image_url: '',
                    gradient: 'from-violet-600 to-indigo-600',
                    icon: 'ShoppingBag',
                    button_text: '',
                    link: '/montar-cesta',
                    display_order: 1,
                    active: true,
                    use_blur: false,
                    blur_amount: 4,
                });
            }
        }
    }, [banner, open]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB');
            return;
        }

        try {
            setUploading(true);
            const url = await uploadBannerImage(file);
            setFormData(prev => ({ ...prev, image_url: url }));
        } catch (error: any) {
            alert('Erro ao fazer upload da imagem: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.description || !formData.image_url) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        try {
            setLoading(true);

            if (banner) {
                await updateBanner(banner.id, formData);
            } else {
                await createBanner(formData);
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving banner:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{banner ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Ex: Ofertas da Semana"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição *</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Descrição curta do banner"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Imagem *</Label>
                        <div className="flex gap-2">
                            <Input
                                id="image"
                                value={formData.image_url}
                                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                                placeholder="URL da imagem ou faça upload"
                                required
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                            </Button>
                            <input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>
                        {formData.image_url && (
                            <img
                                src={formData.image_url}
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-lg mt-2"
                            />
                        )}
                    </div>

                    <div className="flex items-center space-x-2 border p-3 rounded-md">
                        <Switch
                            id="use-gradient"
                            checked={!!formData.gradient && formData.gradient !== 'none'}
                            onCheckedChange={(checked) => {
                                setFormData(prev => ({
                                    ...prev,
                                    gradient: checked ? 'from-violet-600 to-indigo-600' : ''
                                }));
                            }}
                        />
                        <Label htmlFor="use-gradient">Aplicar Gradiente Colorido sobre a Imagem</Label>
                    </div>

                    <div className="space-y-4 border p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="use-blur"
                                checked={formData.use_blur}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_blur: checked }))}
                            />
                            <Label htmlFor="use-blur">Aplicar Desfoque (Blur) na Imagem</Label>
                        </div>
                        {formData.use_blur && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="blur-amount" className="text-sm">Intensidade do Desfoque</Label>
                                    <span className="text-sm font-medium">{formData.blur_amount}px</span>
                                </div>
                                <Slider
                                    id="blur-amount"
                                    value={[formData.blur_amount || 4]}
                                    onValueChange={([value]) => setFormData(prev => ({ ...prev, blur_amount: value }))}
                                    min={0}
                                    max={12}
                                    step={1}
                                    className="w-full"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {!!formData.gradient && formData.gradient !== 'none' && (
                            <div className="space-y-2">
                                <Label htmlFor="gradient">Cor do Gradiente</Label>
                                <Select
                                    value={formData.gradient}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, gradient: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {gradientOptions.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="icon">Ícone</Label>
                            <Select
                                value={formData.icon}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {iconOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="button_text">Texto do Botão</Label>
                            <Input
                                id="button_text"
                                value={formData.button_text}
                                onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                                placeholder="Ex: Ver Ofertas"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="link">Link do Botão</Label>
                            <Input
                                id="link"
                                value={formData.link}
                                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                placeholder="Ex: /montar-cesta ou https://..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="order">Ordem</Label>
                        <Input
                            id="order"
                            type="number"
                            min="1"
                            value={formData.display_order}
                            onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="active">Banner Ativo</Label>
                            <p className="text-sm text-muted-foreground">
                                Desative para ocultar temporariamente
                            </p>
                        </div>
                        <Switch
                            id="active"
                            checked={formData.active}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar Banner'
                            )}
                        </Button>
                    </DialogFooter>
                </form >
            </DialogContent >
        </Dialog >
    );
}
