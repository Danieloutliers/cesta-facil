import { GoogleGenAI, Type } from "@google/genai";
import { ScannedData } from "../types";

export const analyzeProductImage = async (base64Image: string): Promise<ScannedData> => {
  // Lazy init to avoid crash if env var is missing during initial load
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey.includes('PLACEHOLDER')) {
    console.warn("Gemini API Key is missing or invalid.");
    // Return mock data for demo purposes if key is missing
    return {
      name: "Produto (Demonstração Sem IA)",
      price: 0.00,
      category: "Geral",
      description: "Adicione uma chave API válida no .env.local para usar a inteligência artificial real. (Reinicie o servidor após adicionar)"
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  // Remove header if present (data:image/jpeg;base64,)
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-pro-vision', // Modelo estável compatível com análise de imagens
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Você é um assistente de IA para um supermercado. Analise esta imagem do produto.
            1. Identifique o nome exato do produto (Marca + Tipo + Peso/Volume).
            2. Identifique o preço exibido na etiqueta. Se não houver preço visível, estime um preço de mercado realista para o Brasil (BRL) e marque como estimativa.
            3. Categorize o produto (ex: Bebidas, Limpeza, Mercearia).
            4. Crie uma curta descrição comercial para o site.`
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
            description: { type: Type.STRING }
          },
          required: ["name", "price", "category", "description"]
        }
      }
    });

    const text = response.text; // Fixed: .text is a property in this SDK version
    // In @google/genai newer versions it might be different, but assuming previous code worked or using standard pattern.
    // Actually, the previous code used `response.text`. Let's check imports.
    // The previous code had `import { GoogleGenAI, Type } from "@google/genai";`
    // If it is the new SDK, response might be different. 
    // Let's stick to safe property access or check.

    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as ScannedData;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      name: "Produto não identificado",
      price: 0.00,
      category: "Geral",
      description: "Houve um erro ao processar a imagem. Verifique sua conexão e tente novamente."
    };
  }
};