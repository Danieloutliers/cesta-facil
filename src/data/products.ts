import { Product } from '@/types';

export const products: Product[] = [
  // Alimentos
  { id: '1', name: 'Arroz Tipo 1', price: 22.90, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop', category: 'alimentos', unit: '5kg' },
  { id: '2', name: 'Feijão Carioca', price: 8.90, image: 'https://images.unsplash.com/photo-1551489186-cf8726f514f8?w=300&h=300&fit=crop', category: 'alimentos', unit: '1kg' },
  { id: '3', name: 'Macarrão Espaguete', price: 4.50, image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&h=300&fit=crop', category: 'alimentos', unit: '500g' },
  { id: '4', name: 'Óleo de Soja', price: 7.90, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop', category: 'alimentos', unit: '900ml' },
  { id: '5', name: 'Açúcar Cristal', price: 4.90, image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=300&h=300&fit=crop', category: 'alimentos', unit: '1kg' },
  { id: '6', name: 'Café Torrado', price: 15.90, image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop', category: 'alimentos', unit: '500g' },
  { id: '7', name: 'Leite Integral', price: 5.49, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop', category: 'alimentos', unit: '1L' },
  { id: '8', name: 'Farinha de Trigo', price: 5.90, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=300&fit=crop', category: 'alimentos', unit: '1kg' },
  { id: '9', name: 'Sal Refinado', price: 2.50, image: 'https://images.unsplash.com/photo-1518110925495-5fe2c53e3c7c?w=300&h=300&fit=crop', category: 'alimentos', unit: '1kg' },
  { id: '10', name: 'Molho de Tomate', price: 3.90, image: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop', category: 'alimentos', unit: '340g' },
  { id: '11', name: 'Sardinha em Lata', price: 6.90, image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=300&h=300&fit=crop', category: 'alimentos', unit: '125g' },
  { id: '12', name: 'Margarina', price: 7.50, image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&h=300&fit=crop', category: 'alimentos', unit: '500g' },
  { id: '13', name: 'Biscoito Cream Cracker', price: 4.90, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=300&fit=crop', category: 'alimentos', unit: '400g' },
  { id: '14', name: 'Ovos Brancos', price: 12.90, image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop', category: 'alimentos', unit: '12 un' },
  { id: '15', name: 'Frango Congelado', price: 18.90, image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=300&fit=crop', category: 'alimentos', unit: '1kg' },
  { id: '16', name: 'Linguiça Calabresa', price: 22.90, image: 'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=300&h=300&fit=crop', category: 'alimentos', unit: '400g' },
  
  // Bebidas
  { id: '17', name: 'Água Mineral', price: 2.50, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop', category: 'bebidas', unit: '1.5L' },
  { id: '18', name: 'Suco de Laranja', price: 8.90, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&h=300&fit=crop', category: 'bebidas', unit: '1L' },
  
  // Limpeza
  { id: '19', name: 'Detergente', price: 2.90, image: 'https://images.unsplash.com/photo-1585441695325-21557c8f4168?w=300&h=300&fit=crop', category: 'limpeza', unit: '500ml' },
  { id: '20', name: 'Sabão em Pó', price: 16.90, image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=300&h=300&fit=crop', category: 'limpeza', unit: '1kg' },
  { id: '21', name: 'Água Sanitária', price: 5.90, image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300&h=300&fit=crop', category: 'limpeza', unit: '2L' },
  { id: '22', name: 'Desinfetante', price: 6.90, image: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=300&h=300&fit=crop', category: 'limpeza', unit: '2L' },
  
  // Higiene
  { id: '23', name: 'Sabonete', price: 2.50, image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=300&h=300&fit=crop', category: 'higiene', unit: '90g' },
  { id: '24', name: 'Creme Dental', price: 5.90, image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=300&h=300&fit=crop', category: 'higiene', unit: '90g' },
  { id: '25', name: 'Papel Higiênico', price: 18.90, image: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=300&h=300&fit=crop', category: 'higiene', unit: '12 rolos' },
  { id: '26', name: 'Shampoo', price: 12.90, image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300&h=300&fit=crop', category: 'higiene', unit: '350ml' },
];

export const budgetOptions = [
  { value: 200, label: 'R$ 200', description: 'Essencial para 1 pessoa', popular: false },
  { value: 300, label: 'R$ 300', description: 'Ideal para casal', popular: true },
  { value: 400, label: 'R$ 400', description: 'Família pequena', popular: false },
  { value: 500, label: 'R$ 500', description: 'Família média', popular: false },
  { value: 600, label: 'R$ 600', description: 'Família grande', popular: false },
  { value: 700, label: 'R$ 700', description: 'Cesta completa', popular: false },
];

export const categories = [
  { id: 'todos', label: 'Todos', icon: '🛒' },
  { id: 'alimentos', label: 'Alimentos', icon: '🍚' },
  { id: 'bebidas', label: 'Bebidas', icon: '🥤' },
  { id: 'limpeza', label: 'Limpeza', icon: '🧹' },
  { id: 'higiene', label: 'Higiene', icon: '🧴' },
];
