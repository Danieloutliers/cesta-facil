import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto p-6 max-w-md text-center py-20">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground mb-6">Página não encontrada.</p>
      <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
    </div>
  );
}
