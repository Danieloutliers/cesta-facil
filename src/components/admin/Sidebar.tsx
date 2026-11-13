import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Tags,
    MessageCircle,
    Users,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    Store,
    Gift,
    DollarSign,
    Image,
    Bot,
    X,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useState, useEffect } from 'react';

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

interface AdminSidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

const navGroups: NavGroup[] = [
    {
        label: 'Visão Geral',
        items: [
            {
                title: 'Dashboard',
                href: '/admin',
                icon: LayoutDashboard
            },
            {
                title: 'Relatórios',
                href: '/admin/reports',
                icon: BarChart3
            }
        ]
    },
    {
        label: 'Vendas & Operações',
        items: [
            {
                title: 'Esteira de Pedidos',
                href: '/admin/orders',
                icon: ShoppingBag
            },
            {
                title: 'Clientes',
                href: '/admin/customers',
                icon: Users
            },
            {
                title: 'Financeiro',
                href: '/admin/financial',
                icon: DollarSign
            },
            {
                title: 'Indicações',
                href: '/admin/referrals',
                icon: Gift
            }
        ]
    },
    {
        label: 'Catálogo',
        items: [
            {
                title: 'Produtos',
                href: '/admin/products',
                icon: Package
            },
            {
                title: 'Categorias',
                href: '/admin/categories',
                icon: Tags
            },
            {
                title: 'Orçamentos',
                href: '/admin/budgets',
                icon: DollarSign
            },
            {
                title: 'Banners',
                href: '/admin/banners',
                icon: Image
            }
        ]
    },
    {
        label: 'Comunicação & IA',
        items: [
            {
                title: 'WhatsApp',
                href: '/admin/whatsapp',
                icon: MessageCircle
            },
            {
                title: 'Chat em Tempo Real',
                href: '/admin/chat',
                icon: MessageCircle
            },
            {
                title: 'Inteligência Artificial',
                href: '/admin/ai-settings',
                icon: Bot
            },
            {
                title: 'Configurações',
                href: '/admin/settings',
                icon: Settings
            }
        ]
    }
];

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        if (mobileOpen && onMobileClose) {
            onMobileClose();
        }
        // Close the drawer only when the route changes; re-running for each parent
        // render would fight the open/close animation.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-card text-card-foreground select-none">
            {/* Header / Brand */}
            <div className="flex h-16 items-center justify-between border-b border-border/70 px-4">
                {(!collapsed || mobileOpen) ? (
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 font-bold text-sm border border-primary/25 shadow-xs">
                            MF
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold tracking-tight text-foreground truncate">
                                Mercado Fácil
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">
                                Painel de Controle
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-sm border border-primary/25">
                        MF
                    </div>
                )}

                {/* Desktop: Collapse button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn('hidden md:inline-flex h-8 w-8 text-muted-foreground hover:text-foreground', !collapsed && 'ml-auto')}
                    aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>

                {/* Mobile: Close button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMobileClose}
                    className="md:hidden ml-auto h-8 w-8 text-muted-foreground"
                    aria-label="Fechar menu"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 space-y-5 px-3 py-4 overflow-y-auto">
                {navGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-1">
                        {(!collapsed || mobileOpen) && (
                            <h3 className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                                {group.label}
                            </h3>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.href ||
                                    (item.href !== '/admin' && location.pathname.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={cn(
                                            'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-xs font-medium transition-all duration-150',
                                            isActive
                                                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                            collapsed && !mobileOpen && 'justify-center px-2 py-2.5'
                                        )}
                                        title={collapsed && !mobileOpen ? item.title : undefined}
                                    >
                                        <Icon className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                                        {(!collapsed || mobileOpen) && <span className="truncate">{item.title}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Quick Link to Public Store */}
            {(!collapsed || mobileOpen) && (
                <div className="px-3 py-2 border-t border-border/60">
                    <Link
                        to="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <span className="flex items-center gap-2 truncate">
                            <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            Ver Loja Online
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                    </Link>
                </div>
            )}

            {/* Footer */}
            <div className="border-t border-border/70 p-3 bg-muted/20">
                <div className={cn('flex items-center', (collapsed && !mobileOpen) ? 'justify-center' : 'justify-between')}>
                    {(!collapsed || mobileOpen) && (
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">Admin Cesta Fácil</span>
                            <span className="text-[10px] text-muted-foreground tabular-nums">Versão 2.4</span>
                        </div>
                    )}
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
                    onClick={onMobileClose}
                />
            )}

            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    'hidden md:flex relative flex-col border-r border-border/80 bg-card transition-all duration-300 ease-in-out shrink-0 z-20',
                    collapsed ? 'w-16' : 'w-64'
                )}
            >
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <aside
                className={cn(
                    'fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-card border-r border-border transition-transform duration-300 ease-in-out md:hidden flex flex-col shadow-2xl',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <SidebarContent />
            </aside>
        </>
    );
}
