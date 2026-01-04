import { Product } from '../types';

// Export products to CSV
export const exportToCSV = (products: Product[], filename: string = 'produtos.csv') => {
    // CSV Header
    const headers = ['Nome', 'Preço', 'Categoria', 'Unidade', 'Data de Criação'];

    // CSV Rows
    const rows = products.map(p => [
        p.name,
        p.price.toFixed(2),
        p.category,
        p.unit || 'un',
        p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : ''
    ]);

    // Build CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Share products via Web Share API
export const shareProducts = async (products: Product[]) => {
    if (!navigator.share) {
        throw new Error('Web Share API not supported');
    }

    const text = `📦 Catálogo SuperScan AI\n\n` +
        `Total: ${products.length} produtos\n\n` +
        products.slice(0, 10).map(p =>
            `• ${p.name} - R$ ${p.price.toFixed(2)}`
        ).join('\n') +
        (products.length > 10 ? `\n\n...e mais ${products.length - 10} produtos` : '');

    await navigator.share({
        title: 'Catálogo de Produtos',
        text: text
    });
};
