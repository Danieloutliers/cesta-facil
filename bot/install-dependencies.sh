#!/bin/bash

# Script de instalação de dependências para o Bot WhatsApp Cesta Fácil
# Ubuntu Server 24.04 LTS

set -e  # Sair em caso de erro

echo "🚀 Instalando dependências para o Bot WhatsApp Cesta Fácil..."
echo "=================================================="

# Atualizar sistema
echo "📦 Atualizando repositórios do sistema..."
sudo apt update

# Instalar Node.js 18.x via NodeSource
echo "📦 Instalando Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    echo "✅ Node.js instalado: $(node --version)"
else
    echo "✅ Node.js já está instalado: $(node --version)"
fi

# Verificar versão do npm
echo "📦 NPM versão: $(npm --version)"

# Instalar dependências do Chromium/Puppeteer
echo "📦 Instalando dependências do Puppeteer/Chromium..."
sudo apt install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    chromium-browser

echo "✅ Dependências do Chromium instaladas"

# Instalar PM2 globalmente
echo "📦 Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo "✅ PM2 instalado: $(pm2 --version)"
else
    echo "✅ PM2 já está instalado: $(pm2 --version)"
fi

# Criar diretório de logs
echo "📁 Criando diretório de logs..."
mkdir -p logs

echo ""
echo "=================================================="
echo "✅ Instalação concluída com sucesso!"
echo "=================================================="
echo ""
echo "Próximos passos:"
echo "1. Instalar dependências do projeto: npm install"
echo "2. Iniciar o bot com PM2: pm2 start ecosystem.config.js"
echo "3. Configurar firewall: sudo ufw allow 3001/tcp"
echo "4. Salvar configuração PM2: pm2 save"
echo "5. Configurar auto-start: pm2 startup"
echo ""
