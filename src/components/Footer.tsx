import { Link } from 'react-router-dom';
import { ShoppingCart, Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Mercado Fácil</span>
            </Link>
            <p className="text-sm text-background/70">
              Sua cesta básica personalizada, do seu jeito, no seu orçamento.
            </p>
            <div className="flex gap-3">
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/10 hover:bg-primary transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/10 hover:bg-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/10 hover:bg-primary transition-colors">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 font-semibold">Links Úteis</h3>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
              <li><Link to="/montar-cesta" className="hover:text-primary transition-colors">Montar Cesta</Link></li>
              <li><Link to="/historico" className="hover:text-primary transition-colors">Meus Pedidos</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Como Funciona</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="mb-4 font-semibold">Contato</h3>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                (11) 99999-9999
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                contato@mercadofacil.com
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>São Paulo, SP - Brasil</span>
              </li>
            </ul>
          </div>

          {/* Horário */}
          <div>
            <h3 className="mb-4 font-semibold">Horário de Atendimento</h3>
            <ul className="space-y-2 text-sm text-background/70">
              <li>Segunda a Sexta: 8h às 20h</li>
              <li>Sábado: 8h às 18h</li>
              <li>Domingo: 9h às 14h</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-background/10 pt-6 text-center text-sm text-background/50">
          <p>© 2024 Mercado Fácil. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
