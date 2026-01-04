<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://vitejs.dev/guide/features.html#swc) uses [SWC](https://swc.rs/) for Fast Refresh

## 🚀 Deploy na Vercel

### Passo 1: Push para GitHub

```bash
git init
git add .
git commit -m "feat: SuperScan AI completo"
git branch -M main
git remote add origin <sua-url-do-github>
git push -u origin main
```

### Passo 2: Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Importe seu repositório
4. **Configure as variáveis de ambiente:**

```
VITE_SUPABASE_URL = sua_url_supabase
VITE_SUPABASE_ANON_KEY = sua_chave_publica
GEMINI_API_KEY = sua_chave_gemini
```

5. Clique em "Deploy"

### Onde obter as chaves:

**Supabase**: Settings → API  
**Gemini**: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

---

## 📱 Funcionalidades

- ✅ Scan com IA (Gemini)
- ✅ Editor de imagem
- ✅ Modo offline
- ✅ Detecção duplicatas
- ✅ Dashboard analytics
- ✅ Exportação CSV
- ✅ PWA instaláveltall`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
