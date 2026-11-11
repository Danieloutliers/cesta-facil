import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function DeliveryLogin() {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto p-6 max-w-md text-center py-20">
      <h1 className="text-2xl font-bold mb-4">Login de Entregador</h1>
      <Button onClick={() => navigate('/delivery')} className="w-full">Entrar</Button>
    </div>
  );
}
