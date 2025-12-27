@echo off
title Robo do WhatsApp - Cesta Facil
color 0A
echo ==========================================
echo      INICIANDO ROBO DO WHATSAPP
echo ==========================================
echo.
echo Navegando para a pasta do bot...
cd bot

echo.
echo Verificando dependencias...
if not exist node_modules (
    echo Instalando dependencias pela primeira vez...
    call npm install
)

echo.
echo Iniciando o servidor...
echo Mantenha esta janela aberta para o robo funcionar!
echo.
call npm start
pause
