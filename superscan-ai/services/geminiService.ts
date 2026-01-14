/// <reference types="vite/client" />
import { GoogleGenAI, Type } from "@google/genai";
import { ScannedData } from "../types";

export const analyzeProductImage = async (
  base64Image: string,
  availableCategories?: { id: string, label: string }[],
  availableSubcategories?: { id: string, label: string, category_id: string }[],
  customApiKeys: string[] = []
): Promise<ScannedData> => {
  // Combine custom keys with the default env key
  // Filter out empty or placeholder keys
  const allKeys = [
    ...customApiKeys,
    import.meta.env.VITE_GEMINI_API_KEY
  ].filter(key => key && typeof key === 'string' && !key.includes('PLACEHOLDER') && key.length > 10);

  if (allKeys.length === 0) {
    console.warn("No valid Gemini API Keys found.");
    return {
      name: "Produto (Demonstração Sem IA)",
      price: 0.00,
      category: "alimentos",
      description: "Adicione uma chave API válida no .env.local ou nas configurações para usar a inteligência artificial real.",
      unit: "un"
    };
  }

  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  // Build context strings
  const catsStr = availableCategories?.map(c => `${c.id} (${c.label})`).join(', ') || "alimentos, bebidas, limpeza, higiene";
  const subsStr = availableSubcategories?.map(s => `ID: ${s.id}, Nome: ${s.label}, Categoria Pai: ${s.category_id}`).join('\n') || "";

  let lastError = null;

  // Try each key sequentially
  for (const apiKey of allKeys) {
    try {
      console.log(`Tentando Gemini com chave final ${apiKey.slice(-4)}...`);
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            },
            {
              text: `Você é um assistente de IA para um supermercado. Analise esta imagem do produto e retorne APENAS um JSON válido.
              
              Categorias Disponíveis: ${catsStr}
              Subcategorias Disponíveis:
              ${subsStr}
  
              Escolha a categoria que melhor se adapta (use o ID/Slug).
              E escolha a subcategoria mais específica possível da lista acima, se houver uma correspondente (use o ID). Se não houver, deixe null.
  
              JSON Schema:
  {
    "name": "Nome completo do produto (Marca + Tipo + Peso/Volume)",
    "price": preço em número (ex: 9.99),
    "category": "o ID da categoria escolhida",
    "subcategory_id": "o ID da subcategoria escolhida ou null",
    "description": "descrição curta do produto",
    "unit": "unidade como '1kg', '500ml', 'un', etc"
  }
  
  Se não conseguir identificar o preço, estime um valor de mercado realista. Retorne APENAS o JSON.`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              category: { type: Type.STRING },
              subcategory_id: { type: Type.STRING, nullable: true },
              description: { type: Type.STRING },
              unit: { type: Type.STRING }
            },
            required: ["name", "price", "category", "description", "unit"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      const parsed = JSON.parse(text) as ScannedData;

      // Validar e normalizar categoria
      const validCategories = ['alimentos', 'bebidas', 'limpeza', 'higiene'];
      let category = parsed.category.toLowerCase().trim();
      if (!validCategories.includes(category)) {
        if (category.includes('aliment') || category.includes('comida')) category = 'alimentos';
        else if (category.includes('bebida')) category = 'bebidas';
        else if (category.includes('limpeza')) category = 'limpeza';
        else if (category.includes('higiene')) category = 'higiene';
        else category = 'alimentos';
      }

      return {
        name: parsed.name || "Produto não identificado",
        price: parsed.price || 0,
        category: category,
        subcategory_id: parsed.subcategory_id || undefined,
        description: parsed.description || "",
        unit: parsed.unit || "un"
      };

    } catch (error) {
      console.error(`Erro com a chave final ${apiKey.slice(-4)}:`, error);
      lastError = error;
      // Continue to next key loop
    }
  }

  // If we get here, all keys failed
  console.error("Todas as chaves falharam.");
  return {
    name: "Produto não identificado (Erro IA)",
    price: 0.00,
    category: "alimentos",
    description: "Houve um erro ao processar a imagem com todas as chaves disponíveis. Verifique limites de cota.",
    unit: "un"
  };
};