import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { Product } from '../types';

interface StatisticsProps {
    products: Product[];
    onClose: () => void;
}

const COLORS = {
    alimentos: '#10b981',
    bebidas: '#3b82f6',
    limpeza: '#f59e0b',
    higiene: '#8b5cf6'
};

const CATEGORY_LABELS = {
    alimentos: '🍎 Alimentos',
    bebidas: '🥤 Bebidas',
    limpeza: '🧹 Limpeza',
    higiene: '🧼 Higiene'
};

export function Statistics({ products, onClose }: StatisticsProps) {
    // Category stats
    const categoryData = Object.entries(
        products.reduce((acc, p) => {
            const cat = p.category.toLowerCase();
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({
        name: CATEGORY_LABELS[name as keyof typeof CATEGORY_LABELS] || name,
        value,
        fill: COLORS[name as keyof typeof COLORS] || '#gray'
    }));

    // Price stats
    const prices = products.map(p => p.price);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const totalValue = prices.reduce((a, b) => a + b, 0);

    // Price alerts (produtos acima de 30% da média)
    const priceAlerts = products.filter(p => p.price > avgPrice * 1.3);

    // Today's products
    const today = new Date().toDateString();
    const todayProducts = products.filter(p => {
        if (!p.created_at) return false;
        return new Date(p.created_at).toDateString() === today;
    });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">📊 Estatísticas</h2>
                        <p className="text-sm text-gray-500">Análise do catálogo</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                            <Package size={24} className="mb-2" />
                            <p className="text-sm opacity-90">Total de Produtos</p>
                            <p className="text-3xl font-bold">{products.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                            <TrendingUp size={24} className="mb-2" />
                            <p className="text-sm opacity-90">Valor Total</p>
                            <p className="text-3xl font-bold">R$ {totalValue.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Today Stats */}
                    {todayProducts.length > 0 && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <h3 className="font-bold text-purple-900 mb-2">🎯 Hoje</h3>
                            <p className="text-purple-700">{todayProducts.length} produto(s) adicionados hoje</p>
                        </div>
                    )}

                    {/* Price Stats */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <h3 className="font-bold text-gray-900">💰 Análise de Preços</h3>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                                <p className="text-gray-500">Média</p>
                                <p className="font-bold text-blue-600">R$ {avgPrice.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Mínimo</p>
                                <p className="font-bold text-green-600">R$ {minPrice.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Máximo</p>
                                <p className="font-bold text-orange-600">R$ {maxPrice.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Price Alerts */}
                    {priceAlerts.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="text-orange-600" size={20} />
                                <h3 className="font-bold text-orange-900">Alertas de Preço</h3>
                            </div>
                            <p className="text-sm text-orange-700 mb-2">
                                {priceAlerts.length} produto(s) com preço acima de 30% da média
                            </p>
                            <div className="space-y-2">
                                {priceAlerts.slice(0, 3).map((product) => (
                                    <div key={product.id} className="flex justify-between text-sm">
                                        <span className="font-medium truncate">{product.name}</span>
                                        <span className="font-bold text-orange-600">R$ {product.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Category Chart */}
                    {categoryData.length > 0 && (
                        <div className="bg-white border rounded-xl p-4">
                            <h3 className="font-bold text-gray-900 mb-4">📦 Distribuição por Categoria</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
