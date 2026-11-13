import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, FileSpreadsheet, Clipboard, Download, Check, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { createProductsBulk, useSubcategories, createSubcategory } from '@/hooks/useData';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types';

interface ImportProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedProductRow {
  id: string; // temporary key
  selected: boolean;
  itemNum?: string;
  name: string;
  unit: string;
  cost_price: number;
  price: number;
  category: 'alimentos' | 'limpeza' | 'higiene' | 'bebidas';
  subcategory: string;
  image: string;
}

// Utility to parse Brazilian currency or decimal strings to number
function parsePtBrCurrency(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const rawStr = String(val).trim();
  if (!rawStr) return 0;

  // Ignore units / weights like "250ml", "350g", "1kg", "500g", "1L", "Qtd / Peso"
  if (
    rawStr.match(/\d+\s*(ml|g|kg|l|un|cx|pct|grm)$/i) ||
    rawStr.toLowerCase().includes('qtd') ||
    rawStr.toLowerCase().includes('peso')
  ) {
    return 0;
  }

  // Ignore small pure integer item numbers (1, 2, 3, 4, 5...) without R$
  if (rawStr.match(/^\d{1,3}$/) && !rawStr.toLowerCase().includes('r$')) {
    return 0;
  }

  const cleanStr = rawStr
    .replace(/R\$\s?/gi, '')
    .replace(/\s/g, '')
    .trim();

  if (!cleanStr) return 0;

  // Handle formats like "13,40" -> 13.40 or "1.250,90" -> 1250.90
  if (cleanStr.includes(',') && cleanStr.includes('.')) {
    const num = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
  } else if (cleanStr.includes(',')) {
    const num = parseFloat(cleanStr.replace(',', '.'));
    return isNaN(num) ? 0 : num;
  } else if (cleanStr.includes('.')) {
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
}

// Category keyword auto-detector
function detectCategory(name: string): 'alimentos' | 'limpeza' | 'higiene' | 'bebidas' {
  const n = name.toLowerCase();
  
  if (
    n.includes('sabonete') ||
    n.includes('shampoo') ||
    n.includes('creme') ||
    n.includes('desodorante') ||
    n.includes('pasta') ||
    n.includes('escova') ||
    n.includes('fralda') ||
    n.includes('absorvente') ||
    n.includes('dove') ||
    n.includes('nivea') ||
    n.includes('rexona') ||
    n.includes('colgate') ||
    n.includes('higiene')
  ) {
    return 'higiene';
  }

  if (
    n.includes('detergente') ||
    n.includes('desinfetante') ||
    n.includes('amaciante') ||
    n.includes('sabao') ||
    n.includes('sabão') ||
    n.includes('agua sanitaria') ||
    n.includes('água sanitária') ||
    n.includes('veja') ||
    n.includes('ype') ||
    n.includes('ypê') ||
    n.includes('vanish') ||
    n.includes('limpeza') ||
    n.includes('esponja') ||
    n.includes('palha') ||
    n.includes('multiuso')
  ) {
    return 'limpeza';
  }

  if (
    n.includes('refrigerante') ||
    n.includes('suco') ||
    n.includes('cerveja') ||
    n.includes('água') ||
    n.includes('agua') ||
    n.includes('leite') ||
    n.includes('café') ||
    n.includes('cafe') ||
    n.includes('chá') ||
    n.includes('coca') ||
    n.includes('guarana') ||
    n.includes('guaraná') ||
    n.includes('vinho') ||
    n.includes('vodka') ||
    n.includes('energético') ||
    n.includes('energetico') ||
    n.includes('bebida')
  ) {
    return 'bebidas';
  }

  return 'alimentos';
}

// Subcategory keyword auto-detector
function detectSubcategory(name: string, category: string): string {
  const n = name.toLowerCase();
  if (n.includes('sabonete')) return 'Sabonetes';
  if (n.includes('shampoo') || n.includes('condicionador')) return 'Cabelos';
  if (n.includes('detergente') || n.includes('esponja')) return 'Lava Louças';
  if (n.includes('sabao') || n.includes('sabão') || n.includes('amaciante')) return 'Lava Roupas';
  if (n.includes('desinfetante') || n.includes('multiuso')) return 'Limpeza Geral';
  if (n.includes('arroz') || n.includes('feijao') || n.includes('feijão')) return 'Grãos e Cereais';
  if (n.includes('achocolatado') || n.includes('nescau') || n.includes('toddy')) return 'Matinais';
  if (n.includes('leite')) return 'Laticínios';
  if (n.includes('maionese') || n.includes('molho') || n.includes('ketchup')) return 'Molhos e Condimentos';
  if (n.includes('suco') || n.includes('refrigerante') || n.includes('água')) return 'Sucos e Refrescos';

  if (category === 'higiene') return 'Cuidados Pessoais';
  if (category === 'limpeza') return 'Limpeza Geral';
  if (category === 'bebidas') return 'Bebidas';
  return 'Mercearia';
}

// Category image map
const categoryDefaultImages: Record<string, string> = {
  higiene: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
  limpeza: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?w=500&auto=format&fit=crop&q=60',
  bebidas: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60',
  alimentos: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
};

export const ImportProductsDialog: React.FC<ImportProductsDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { subcategories, refetch: refetchSubcategories } = useSubcategories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputTab, setInputTab] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [defaultCategory, setDefaultCategory] = useState<'alimentos' | 'limpeza' | 'higiene' | 'bebidas'>('alimentos');
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const resetState = () => {
    setParsedRows([]);
    setPastedText('');
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  // Process raw tabular data array into ParsedProductRow list
  const processRawData = (rows: unknown[][]) => {
    if (!rows || rows.length === 0) {
      toast({
        title: "Nenhum dado encontrado",
        description: "A planilha ou texto colado está vazio.",
        variant: "destructive"
      });
      return;
    }

    // Find header row index
    let headerIdx = -1;
    let headers: string[] = [];

    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const rowStr = rows[i].map(c => String(c).toLowerCase()).join(' ');
      if (
        rowStr.includes('produto') ||
        rowStr.includes('nome') ||
        rowStr.includes('item') ||
        rowStr.includes('varejo') ||
        rowStr.includes('atacado') ||
        rowStr.includes('preço')
      ) {
        headerIdx = i;
        headers = rows[i].map(c => String(c).trim());
        break;
      }
    }

    // Identify column indexes
    let nameCol = -1;
    let unitCol = -1;
    let costCol = -1;
    let priceCol = -1;
    let itemCol = -1;
    let categoryCol = -1;
    let subcategoryCol = -1;

    headers.forEach((h, idx) => {
      const lower = h.toLowerCase().trim();
      if (lower.includes('subcat') || lower.includes('sub-cat') || lower.includes('sub cat')) {
        subcategoryCol = idx;
      } else if (lower.includes('produto') || lower === 'nome' || lower === 'description') {
        nameCol = idx;
      } else if (lower.includes('qtd') || lower.includes('peso') || lower.includes('unid') || lower.includes('emb')) {
        unitCol = idx;
      } else if (lower.includes('atacado') || lower.includes('custo') || lower.includes('cost')) {
        costCol = idx;
      } else if (lower.includes('varejo') || lower.includes('oferta') || lower.includes('preço') || lower.includes('preco') || lower.includes('price')) {
        priceCol = idx;
      } else if (lower === 'item') {
        itemCol = idx;
      } else if (lower.includes('cat') && !lower.includes('sub')) {
        categoryCol = idx;
      }
    });

    const parsed: ParsedProductRow[] = [];

    rows.forEach((row, idx) => {
      if (!row || row.length === 0 || row.every(cell => cell === null || cell === '' || String(cell).trim() === '')) {
        return; // Skip empty rows
      }

      // Skip header rows explicitly
      const c0Lower = String(row[0] || '').toLowerCase().trim();
      const c1Lower = String(row[1] || '').toLowerCase().trim();

      if (
        c0Lower === 'item' ||
        c0Lower === 'produto' ||
        c0Lower === 'nome' ||
        c1Lower === 'produto' ||
        c1Lower === 'nome' ||
        c1Lower === 'qtd / peso' ||
        c0Lower.includes('preço') ||
        c1Lower.includes('preço')
      ) {
        return; // SKIP HEADER ROWS ENTIRELY!
      }

      let name = '';
      let unit = '';
      let cost_price = 0;
      let price = 0;
      let category: 'alimentos' | 'limpeza' | 'higiene' | 'bebidas' = defaultCategory;
      let subcategory = '';

      // Check for extended layout [Item, Produto, Qtd/Peso, Preço Atacado, Preço Varejo/Oferta, Categoria, Subcategoria]
      if (row.length >= 5 && (c0Lower.match(/^\d+$/) || nameCol === -1)) {
        name = String(row[1] || '').trim();
        unit = String(row[2] || 'un').trim();
        cost_price = parsePtBrCurrency(row[3]);
        price = parsePtBrCurrency(row[4]);

        if (row[5]) {
          const catStr = String(row[5]).toLowerCase();
          if (catStr.includes('limpeza')) category = 'limpeza';
          else if (catStr.includes('higiene')) category = 'higiene';
          else if (catStr.includes('bebida')) category = 'bebidas';
          else if (catStr.includes('alim')) category = 'alimentos';
        } else {
          category = detectCategory(name);
        }

        if (row[6]) {
          subcategory = String(row[6]).trim();
        } else {
          subcategory = detectSubcategory(name, category);
        }
      } else if (nameCol >= 0) {
        name = String(row[nameCol] || '').trim();
        unit = String(unitCol >= 0 ? row[unitCol] : 'un').trim();
        cost_price = costCol >= 0 ? parsePtBrCurrency(row[costCol]) : 0;
        price = priceCol >= 0 ? parsePtBrCurrency(row[priceCol]) : 0;

        if (categoryCol >= 0 && row[categoryCol]) {
          const catStr = String(row[categoryCol]).toLowerCase();
          if (catStr.includes('limpeza')) category = 'limpeza';
          else if (catStr.includes('higiene')) category = 'higiene';
          else if (catStr.includes('bebida')) category = 'bebidas';
          else if (catStr.includes('alim')) category = 'alimentos';
        } else {
          category = detectCategory(name);
        }

        if (subcategoryCol >= 0 && row[subcategoryCol]) {
          subcategory = String(row[subcategoryCol]).trim();
        } else {
          subcategory = detectSubcategory(name, category);
        }
      } else {
        // Fallback for non-standard layout
        const strCells = row.map(c => String(c || '').trim());
        name = strCells.find(s => s.length > 2 && isNaN(Number(s)) && !s.match(/^r\$/i) && !s.match(/\d+ml|\d+g|\d+kg/i)) || strCells[1] || strCells[0] || '';
        unit = strCells.find(s => s.match(/^\d+(,\d+)?\s?(ml|g|kg|l|un|cx|pct|grm)$/i)) || 'un';

        const prices = strCells.map(s => parsePtBrCurrency(s)).filter(p => p > 0);
        if (prices.length >= 2) {
          cost_price = prices[0];
          price = prices[prices.length - 1]; // Last price is Varejo/Oferta
        } else if (prices.length === 1) {
          price = prices[0];
          cost_price = 0;
        }

        category = detectCategory(name);
        subcategory = detectSubcategory(name, category);
      }

      // Cleanup extra spaces in name
      name = name.replace(/\s+/g, ' ').trim();
      if (!name || name.toLowerCase() === 'item' || name.toLowerCase() === 'produto' || name.toLowerCase() === 'nome') {
        return;
      }

      // Ensure fallback price if cost_price present but price missing
      if (price === 0 && cost_price > 0) {
        price = cost_price;
      }

      parsed.push({
        id: `import-${idx}-${Date.now()}`,
        selected: true,
        itemNum: String(row[0] || ''),
        name,
        unit,
        cost_price,
        price,
        category,
        subcategory,
        image: categoryDefaultImages[category] || categoryDefaultImages.alimentos
      });
    });

    if (parsed.length === 0) {
      toast({
        title: "Não foi possível identificar produtos",
        description: "Verifique se a planilha possui colunas como Produto, Qtd/Peso, Preço Atacado e Preço Varejo.",
        variant: "destructive"
      });
      return;
    }

    setParsedRows(parsed);
    toast({
      title: `${parsed.length} produto(s) identificados`,
      description: "Revise os dados abaixo antes de confirmar a importação.",
    });
  };

  // Handle File Upload (.xlsx, .xls, .csv, .tsv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.name.endsWith('.txt')) {
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        Papa.parse<unknown[]>(content, {
          skipEmptyLines: true,
          complete: (results) => {
            processRawData(results.data);
          }
        });
      };
      reader.readAsText(file);
    } else {
      // Excel binary .xlsx / .xls
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
          processRawData(jsonRows);
        } catch (err) {
          console.error('Excel parse error:', err);
          toast({
            title: "Erro ao ler arquivo Excel",
            description: "Certifique-se que o arquivo é um Excel (.xlsx ou .xls) válido.",
            variant: "destructive"
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Handle Text Paste parsing (Tab / Semicolon / Comma separated)
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      toast({
        title: "Texto vazio",
        description: "Cole as linhas da planilha na área de texto antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    Papa.parse<unknown[]>(pastedText.trim(), {
      skipEmptyLines: true,
      complete: (results) => {
        processRawData(results.data);
      }
    });
  };

  // Download template CSV with Subcategoria column
  const handleDownloadTemplate = () => {
    const templateContent =
`Item;Produto;Qtd / Peso;Preço Atacado (R$);Preço Varejo / Oferta (R$);Categoria;Subcategoria
1;Sabonete Líquido Nivea (Erva Doce / Creme Care);250ml;R$ 13,40;R$ 13,90;Higiene;Sabonetes
2;Detergente Líquido Ypê Neutro;500ml;R$ 2,50;R$ 2,99;Limpeza;Lava Louças
3;Arroz Tio João Tipo 1;5kg;R$ 22,00;R$ 25,90;Alimentos;Grãos e Cereais
4;Suco Del Valle Uva;1L;R$ 6,50;R$ 7,90;Bebidas;Sucos e Refrescos`;

    const blob = new Blob(['\uFEFF' + templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_importacao_produtos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Batch Selection helpers
  const toggleSelectRow = (id: string) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const toggleSelectAllParsed = () => {
    const allSelected = parsedRows.every(r => r.selected);
    setParsedRows(prev => prev.map(r => ({ ...r, selected: !allSelected })));
  };

  const updateParsedRow = (id: string, updates: Partial<ParsedProductRow>) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteParsedRow = (id: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== id));
  };

  // Final Commit to Supabase with Subcategories matching / auto-creation
  const handleConfirmImport = async () => {
    const selectedRows = parsedRows.filter(r => r.selected);

    if (selectedRows.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Marque ao menos um produto para importar.",
        variant: "destructive"
      });
      return;
    }

    try {
      setImporting(true);

      // Cache existing subcategories
      const currentSubcategories = [...subcategories];

      // Prepare product records with subcategory_id
      const productsToInsert: Omit<Product, 'id'>[] = [];

      for (const r of selectedRows) {
        let subcategoryId: string | undefined = undefined;

        if (r.subcategory && r.subcategory.trim()) {
          const subNameTrimmed = r.subcategory.trim();
          // Find existing matching subcategory
          let match = currentSubcategories.find(
            s => s.label.toLowerCase() === subNameTrimmed.toLowerCase() && s.category_id === r.category
          );

          if (!match) {
            // Auto create subcategory if missing
            try {
              const newSub = await createSubcategory({
                label: subNameTrimmed,
                category_id: r.category
              });
              if (newSub) {
                match = newSub;
                currentSubcategories.push(newSub);
              }
            } catch (err) {
              console.warn('Subcategory creation note:', err);
            }
          }

          if (match) {
            subcategoryId = match.id;
          }
        }

        productsToInsert.push({
          name: r.name,
          unit: r.unit || 'un',
          cost_price: Number(r.cost_price) || 0,
          price: Number(r.price) || 0,
          category: r.category,
          subcategory_id: subcategoryId,
          image: r.image || categoryDefaultImages[r.category] || categoryDefaultImages.alimentos
        });
      }

      await createProductsBulk(productsToInsert);
      await refetchSubcategories();

      toast({
        title: "Importação concluída!",
        description: `${productsToInsert.length} produto(s) e subcategorias foram vinculados com sucesso.`,
      });

      handleDialogClose(false);
      onSuccess();
    } catch (error: unknown) {
      console.error('Error importing products bulk:', error);
      toast({
        title: "Erro na importação",
        description: (error as Error)?.message || "Não foi possível salvar os produtos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = parsedRows.filter(r => r.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
              <DialogTitle className="text-xl">Importar Planilha de Produtos</DialogTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs text-muted-foreground hover:text-foreground border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <Download className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              Baixar Planilha Exemplo (.CSV)
            </Button>
          </div>
          <DialogDescription className="text-xs mt-1">
            Importe arquivos <strong>.xlsx, .xls, .csv</strong> ou cole dados da sua tabela com as colunas: 
            <span className="font-semibold text-foreground bg-muted px-1 rounded ml-1">
              Item | Produto | Qtd / Peso | Preço Atacado | Preço Varejo / Oferta | Categoria | Subcategoria
            </span>
          </DialogDescription>
        </DialogHeader>

        {parsedRows.length === 0 ? (
          /* Step 1: Upload or Paste */
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Button
                variant={inputTab === 'file' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInputTab('file')}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload de Arquivo (Excel / CSV)
              </Button>
              <Button
                variant={inputTab === 'paste' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInputTab('paste')}
                className="gap-2"
              >
                <Clipboard className="h-4 w-4" />
                Colar Texto Copiado
              </Button>
            </div>

            {inputTab === 'file' ? (
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      Clique para selecionar o arquivo Excel ou CSV
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Suporta arquivos .xlsx, .xls, .csv e .tsv
                    </p>
                  </div>
                  {fileName && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                      Arquivo selecionado: {fileName}
                    </span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="paste-textarea" className="text-xs font-medium">
                  Cole as linhas da sua planilha abaixo (copie do Excel, Google Sheets ou Bloco de Notas):
                </Label>
                <Textarea
                  id="paste-textarea"
                  placeholder={`Item\tProduto\tQtd / Peso\tPreço Atacado (R$)\tPreço Varejo / Oferta (R$)\tCategoria\tSubcategoria\n1\tSabonete Líquido Nivea (Erva Doce / Creme Care)\t250ml\tR$ 13,40\tR$ 13,90\tHigiene\tSabonetes`}
                  rows={8}
                  className="font-mono text-xs"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
                <Button onClick={handleParsePastedText} className="w-full">
                  Processar Texto Colado
                </Button>
              </div>
            )}

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 flex gap-3 text-xs text-blue-800 dark:text-blue-300">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Exemplo de Formato Aceito:</p>
                <p className="font-mono text-[11px] bg-background/60 p-2 rounded border">
                  Item | Produto | Qtd / Peso | Preço Atacado | Preço Varejo / Oferta | Categoria | Subcategoria<br />
                  1 | Sabonete Líquido Nivea | 250ml | R$ 13,40 | R$ 13,90 | Higiene | Sabonetes
                </p>
                <p>
                  O sistema criará ou vinculará automaticamente as **Subcategorias** no banco de dados.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Preview Parsed Items Table */
          <div className="flex-1 overflow-hidden flex flex-col py-3 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-muted/40 p-2.5 rounded-lg border">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={parsedRows.length > 0 && parsedRows.every(r => r.selected)}
                  onCheckedChange={toggleSelectAllParsed}
                  id="select-all-parsed"
                />
                <label htmlFor="select-all-parsed" className="text-xs font-medium cursor-pointer">
                  {selectedCount} de {parsedRows.length} selecionado(s) para importar
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetState}
                  className="h-8 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Carregar Outro Arquivo
                </Button>
              </div>
            </div>

            <div className="flex-1 border rounded-lg overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="min-w-[180px]">Produto / Nome</TableHead>
                    <TableHead className="w-[90px]">Qtd / Peso</TableHead>
                    <TableHead className="w-[110px]">Preço Atacado</TableHead>
                    <TableHead className="w-[110px]">Preço Varejo</TableHead>
                    <TableHead className="w-[80px]">Margem</TableHead>
                    <TableHead className="w-[120px]">Categoria</TableHead>
                    <TableHead className="w-[130px]">Subcategoria</TableHead>
                    <TableHead className="w-[40px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row) => {
                    const margin = row.cost_price > 0 ? ((row.price - row.cost_price) / row.cost_price) * 100 : 0;

                    return (
                      <TableRow key={row.id} className={!row.selected ? "opacity-50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={row.selected}
                            onCheckedChange={() => toggleSelectRow(row.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(e) => updateParsedRow(row.id, { name: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.unit}
                            onChange={(e) => updateParsedRow(row.id, { unit: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-2 top-2 text-xs text-muted-foreground">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={row.cost_price || ''}
                              onChange={(e) => updateParsedRow(row.id, { cost_price: parseFloat(e.target.value) || 0 })}
                              className="h-8 text-xs pl-7"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-2 top-2 text-xs text-muted-foreground">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={row.price || ''}
                              onChange={(e) => updateParsedRow(row.id, { price: parseFloat(e.target.value) || 0 })}
                              className="h-8 text-xs pl-7"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.cost_price > 0 ? (
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${margin < 30 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                              {margin.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.category}
                            onValueChange={(cat: 'alimentos' | 'limpeza' | 'higiene' | 'bebidas') => updateParsedRow(row.id, { category: cat, image: categoryDefaultImages[cat] })}
                          >
                            <SelectTrigger className="h-8 text-xs capitalize">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alimentos">Alimentos</SelectItem>
                              <SelectItem value="higiene">Higiene</SelectItem>
                              <SelectItem value="limpeza">Limpeza</SelectItem>
                              <SelectItem value="bebidas">Bebidas</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.subcategory || ''}
                            placeholder="ex: Sabonetes"
                            onChange={(e) => updateParsedRow(row.id, { subcategory: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteParsedRow(row.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="pt-3 border-t">
          <Button
            variant="outline"
            onClick={() => handleDialogClose(false)}
            disabled={importing}
          >
            Cancelar
          </Button>
          {parsedRows.length > 0 && (
            <Button
              onClick={handleConfirmImport}
              disabled={importing || selectedCount === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Check className="h-4 w-4" />
              {importing ? "Importando..." : `Importar ${selectedCount} Produto(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
