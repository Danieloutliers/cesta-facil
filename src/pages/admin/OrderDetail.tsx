import React from 'react';
import { useParams } from 'react-router-dom';

export default function OrderDetail() {
  const { orderId } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Detalhes do Pedido #{orderId}</h1>
      <p className="text-muted-foreground">Informações completas do pedido.</p>
    </div>
  );
}
