import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
  const { cart, total } = useCart();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Finalizar Compra</h1>
      <div className="bg-muted p-4 rounded-lg mb-4">
        <p className="font-medium">Total de itens: {cart.length}</p>
        <p className="text-lg font-bold text-primary">Total: R$ {total.toFixed(2)}</p>
      </div>
      <Button onClick={() => { alert('Pedido realizado com sucesso!'); navigate('/'); }} className="w-full">
        Confirmar Pedido
      </Button>
    </div>
  );
}
