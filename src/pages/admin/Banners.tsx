import { BannerManager } from '@/components/admin/BannerManager';

export default function Banners() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Banners</h2>
                <p className="text-muted-foreground">Gerencie os banners promocionais da loja</p>
            </div>
            <BannerManager />
        </div>
    );
}
