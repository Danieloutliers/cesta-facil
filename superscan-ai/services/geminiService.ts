import { GoogleGenAI, Type } from "@google/genai";
import { ScannedData } from "../types";

export const analyzeProductImage = async (base64Image: string): Promise<ScannedData> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('PLACEHOLDER')) {
    console.warn("Gemini API Key is missing or invalid.");
    return {
      name: "Produto (Demonstração Sem IA)",
      price: 0.00,
      category: "alimentos",
      description: "Adicione uma chave API válida no .env.local para usar a inteligência artificial real.",
      unit: "un"
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  try {
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
            text: `Você é um assistente de IA para um supermercado. Analise esta imagem do produto e retorne APENAS um JSON válido com:
{
  "name": "Nome completo do produto (Marca + Tipo + Peso/Volume)",
  "price": preço em número (ex: 9.99),
  "category": "uma das opções: alimentos, bebidas, limpeza ou higiene",
  "description": "descrição curta do produto",
  "unit": "unidade como '1kg', '500ml', 'un', etc"
}

Se não conseguir identificar o preço, estime um valor de mercado realista. Retorne APENAS o JSON, sem texto adicional.`
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
      description: parsed.description || "",
      unit: parsed.unit || "un"
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      name: "Produto não identificado",
      price: 0.00,
      category: "alimentos",
      description: "Houve um erro ao processar a imagem. Verifique sua conexão e tente novamente.",
      unit: "un"
    };
  }
};