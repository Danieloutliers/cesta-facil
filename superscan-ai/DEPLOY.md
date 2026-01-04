# 🚀 Guia de Deploy - SuperScan AI na Vercel

## ✅ Pré-requisitos
- [ ] Conta no GitHub
- [ ] Conta na Vercel
- [ ] Chaves API do Supabase
- [ ] Chave API do Gemini

---

## 📋 Passo a Passo

### 1. Preparar Repositório Git

```bash
cd superscan-ai
git init
git add .
git commit -m "feat: SuperScan AI - versão de produção"
git branch -M main
```

### 2. Criar Repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Nome: `superscan-ai`
3. Deixe público ou privado
4. **NÃO** inicialize com README
5. Crie o repositório
6. Copie a URL (ex: `https://github.com/seu-usuario/superscan-ai.git`)

### 3. Push para GitHub

```bash
git remote add origin https://github.com/seu-usuario/superscan-ai.git
git push -u origin main
```

### 4. Deploy na Vercel

#### 4.1. Importar Projeto
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Conecte sua conta GitHub
3. Selecione o repositório `superscan-ai`
4. Clique em "Import"

#### 4.2. Configurar Build
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 4.3. Adicionar Variáveis de Ambiente

Clique em "Environment Variables" e adicione:

| Nome | Valor | Onde Obter |
|------|-------|------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase → Settings → API → anon/public |
| `GEMINI_API_KEY` | `AIzaSy...` | [Google AI Studio](https://makersuite.google.com/app/apikey) |

> ⚠️ **IMPORTANTE**: Copie suas chaves do arquivo `.env.local`

#### 4.4. Deploy

1. Clique em "Deploy"
2. Aguarde ~2 minutos
3. 🎉 Pronto! Seu app estará no ar

---

## 🔗 Após o Deploy

### URL do App
Vercel fornecerá uma URL como:
```
https://superscan-ai-seu-usuario.vercel.app
```

### Domínio Personalizado (Opcional)
1. Vá em Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

### Testar Funcionalidades

- [ ] Abrir câmera e tirar foto
- [ ] IA identificar produto
- [ ] Salvar no Supabase
- [ ] Ver dashboard com produtos
- [ ] Testar modo offline
- [ ] Exportar CSV
- [ ] Ver estatísticas

---

## 🔄 Atualizações Futuras

Sempre que fizer mudanças:

```bash
git add .
git commit -m "descrição da mudança"
git push
```

Vercel fará o deploy automaticamente! ✨

---

## 🆘 Problemas Comuns

### Erro: "Failed to fetch"
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o Supabase está com RLS configurado

### Erro: "Gemini API"
- Verifique se a quota da API não foi excedida
- Confirme que a chave está correta

### Build Failed
- Rode `npm run build` localmente primeiro
- Verifique erros no console da Vercel

---

## 📱 Instalar como PWA

No celular:
1. Abra a URL no Chrome/Safari
2. Menu → "Adicionar à tela inicial"
3. Use como app nativo!

---

✅ **Seu SuperScan AI está pronto para produção!**
