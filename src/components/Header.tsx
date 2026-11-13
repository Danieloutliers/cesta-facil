import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, History, Shield, Home, LogOut, LogIn, User, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Notifications } from '@/components/Notifications';
import { formatPhone } from '@/lib/phone';

export function Header() {
  const { itemCount } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/montar-cesta', label: 'Montar Cesta', icon: ShoppingCart },
    { href: '/historico', label: 'Meus Pedidos', icon: History },
    { href: '/indicacao', label: 'Indicações 10%', icon: Gift },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-primary shadow-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20">
            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary-foreground">
            Mercado Fácil
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* User Info / Login Button (Desktop) */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-foreground/10">
              <User className="h-4 w-4 text-primary-foreground" />
              <span className="text-sm text-primary-foreground font-medium">
                {formatPhone(user.phone)}
              </span>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="hero-outline" size="sm" className="hidden sm:flex">
                <LogIn className="h-4 w-4" />
                <span>Entrar</span>
              </Button>
            </Link>
          )}

          {/* Sininho de Notificações */}
          <Notifications />

          {/* Botão de Indicações (10%) ao Lado do Sininho */}
          <Link to="/indicacao" title="Indique e Ganhe 10%">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-primary-foreground hover:bg-primary-foreground/20 transition-all rounded-xl"
            >
              <Gift className="h-5 w-5 text-primary-foreground" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow-sm ring-2 ring-primary animate-pulse">
                10%
              </span>
            </Button>
          </Link>

          {/* Logout Button (Desktop) */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-primary-foreground hover:bg-primary-foreground/10"
              onClick={handleLogout}
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}

          {/* User Avatar */}
          {user ? (
            <Link to={isAdmin ? "/admin/settings" : "/perfil"}>
              <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
                <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground text-xs font-bold">
                  {user.name ? user.name.substring(0, 2).toUpperCase() : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link to="/login" className="sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
