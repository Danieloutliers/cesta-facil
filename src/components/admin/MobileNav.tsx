import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavProps {
    onMenuClick: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
    return (
        <div className="md:hidden flex items-center justify-between h-14 px-4 border-b bg-background">
            <h2 className="text-lg font-semibold">Admin Panel</h2>
            <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                aria-label="Abrir menu"
            >
                <Menu className="h-5 w-5" />
            </Button>
        </div>
    );
}
