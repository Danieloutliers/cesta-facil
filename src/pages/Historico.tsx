import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Historico() {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto p-6 max-w-2xl text-center">
      <h1 className="text-2xl font-bold mb-4">Histórico de Pedidos</h1>
      <p className="text-muted-foreground mb-4">Você ainda não realizou nenhum pedido.</p>
      <Button onClick={() => navigate('/')}>Ir para a Loja</Button>
    </div>
  );
}
