import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

const Settings = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
                <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                </Button>
            </div>
            <div className="border rounded-lg p-8 text-center text-muted-foreground bg-white">
                Configurações globais serão exibidas aqui.
            </div>
        </div>
    );
};

export default Settings;
