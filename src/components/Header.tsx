import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, History, Shield, Home, LogOut, LogIn, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Notifications } from '@/components/Notifications';

export function Header() {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/montar-cesta', label: 'Montar Cesta', icon: ShoppingCart },
    { href: '/historico', label: 'Meus Pedidos', icon: History },
    { href: '/admin', label: 'Admin', icon: Shield },
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
          {/* User Info / Login Button */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-foreground/10">
              <User className="h-4 w-4 text-primary-foreground" />
              <span className="text-sm text-primary-foreground font-medium">
                {user.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
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

          {/* Cart Button - Hidden on mobile, visible on desktop */}
          <Link to="/montar-cesta" className="hidden md:block">
            <Button variant="hero-outline" size="sm" className="relative">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Carrinho</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-xs font-bold text-warning-foreground">
                  {itemCount}
                </span>
              )}
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

          {/* Mobile Menu Button Removed - Using Bottom Nav */}


          {/* Mobile Actions (Notifications & Profile) */}
          <div className="flex md:hidden items-center gap-1">
            {/* Notification Bell */}
            <Notifications />

            {/* User Avatar */}
            {user ? (
              <Link to="/admin/settings">
                <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
                  <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground text-xs">
                    {user.name ? user.name.substring(0, 2).toUpperCase() : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link to="/login">
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
      </div>

      {/* Mobile Navigation Removed */}
    </header>
  );
}
