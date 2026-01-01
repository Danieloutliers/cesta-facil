import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAllBanners, useBannerMutations } from '@/hooks/useBanners';
import { BannerFormDialog } from './BannerFormDialog';
import { Banner } from '@/types';
import { Edit, Trash2, Plus, GripVertical, Link as LinkIcon } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function BannerManager() {
    const { banners, loading, refetch } = useAllBanners();
    const { deleteBanner, toggleActive } = useBannerMutations();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | undefined>();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);

    const handleEdit = (banner: Banner) => {
        setEditingBanner(banner);
        setDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingBanner(undefined);
        setDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!bannerToDelete) return;

        try {
            await deleteBanner(bannerToDelete);
            refetch();
            setDeleteDialogOpen(false);
            setBannerToDelete(null);
        } catch (error) {
            console.error('Error deleting banner:', error);
        }
    };

    const handleToggleActive = async (id: string, active: boolean) => {
        try {
            await toggleActive(id, !active);
            refetch();
        } catch (error) {
            console.error('Error toggling banner:', error);
        }
    };

    const handleSuccess = () => {
        refetch();
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar Banners</CardTitle>
                    <CardDescription>Carregando...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                        <div>
                            <CardTitle>Gerenciar Banners</CardTitle>
                            <CardDescription>
                                Configure os banners exibidos no carrossel da página inicial
                            </CardDescription>
                        </div>
                        <Button onClick={handleAdd} className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Banner
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {banners.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhum banner cadastrado. Clique em "Adicionar Banner" para começar.
                            </div>
                        ) : (
                            banners.map((banner) => (
                                <div
                                    key={banner.id}
                                    className={`border rounded-lg p-3 sm:p-4 transition-opacity ${!banner.active ? 'opacity-50' : ''
                                        }`}
                                >
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Mobile: Header with Drag Handle & Actions */}
                                        <div className="flex items-center justify-between sm:hidden">
                                            <div className="flex items-center text-muted-foreground">
                                                <GripVertical className="h-5 w-5" />
                                                <span className="ml-2 text-sm font-medium">Ordem: {banner.display_order}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={banner.active}
                                                    onCheckedChange={() => handleToggleActive(banner.id, banner.active)}
                                                />
                                            </div>
                                        </div>

                                        {/* Desktop: Drag Handle */}
                                        <div className="hidden sm:flex items-center text-muted-foreground cursor-move">
                                            <GripVertical className="h-5 w-5" />
                                        </div>

                                        {/* Banner Preview Image */}
                                        <div className="w-full h-32 sm:w-32 sm:h-20 flex-shrink-0">
                                            <img
                                                src={banner.image_url}
                                                alt={banner.title}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        </div>

                                        {/* Banner Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                                                <div className="flex-1 w-full">
                                                    <h3 className="font-semibold text-lg">{banner.title}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {banner.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-muted-foreground">
                                                        <span className="hidden sm:inline">Ordem: {banner.display_order}</span>
                                                        <span>Ícone: {banner.icon}</span>
                                                        {banner.button_text && <span>Botão: {banner.button_text}</span>}
                                                        {banner.link && (
                                                            <span className="flex items-center gap-1">
                                                                <LinkIcon className="h-3 w-3" /> {banner.link}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Desktop Actions */}
                                                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-muted-foreground">Ativo</span>
                                                        <Switch
                                                            checked={banner.active}
                                                            onCheckedChange={() => handleToggleActive(banner.id, banner.active)}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(banner)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setBannerToDelete(banner.id);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>

                                                {/* Mobile Actions Buttons */}
                                                <div className="flex sm:hidden w-full gap-2 mt-3 pt-3 border-t">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => handleEdit(banner)}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                                        onClick={() => {
                                                            setBannerToDelete(banner.id);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Excluir
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <BannerFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                banner={editingBanner}
                onSuccess={handleSuccess}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
