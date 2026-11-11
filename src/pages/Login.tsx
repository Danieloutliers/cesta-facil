import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto p-6 max-w-md text-center py-20">
      <h1 className="text-2xl font-bold mb-4">Entrar / Login</h1>
      <p className="text-muted-foreground mb-6">Acesse sua conta para continuar.</p>
      <Button onClick={() => navigate('/')} className="w-full">Entrar como Convidado</Button>
    </div>
  );
}
