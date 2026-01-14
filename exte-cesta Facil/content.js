function waitForEl(e, t) { document.querySelector(e) ? t() : setTimeout((() => { waitForEl(e, t) }), 300) } function injectScript(e) { try { const t = document.createElement("script"); t.src = chrome.runtime.getURL(e), t.onerror = function () { }, t.onload = function () { this.remove() }, (document.head || document.documentElement).appendChild(t) } catch (e) { } } function loadClientConfig() { injectScript("assets/client-config.js"), window.addEventListener("message", (e => { if ("CLIENT_CONFIG_LOADED" === e.data.type && e.data.config) { const t = e.data.config; chrome.storage.local.set({ clientId: t.clientId, clientConfig: t }) } })), setTimeout((() => { void 0 !== window.__EXTENSION_CONFIG__ && window.postMessage({ type: "CLIENT_CONFIG_LOADED", config: window.__EXTENSION_CONFIG__ }, "*") }), 100) } const scriptsToInject = ["assets/client-config.js", "assets/socket.js", "assets/jquery.js", "assets/wppconnect-wa.js", "assets/listenerTracker.js"], injectScriptsWhenReady = () => { "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", (() => { loadClientConfig(), scriptsToInject.forEach((e => injectScript(e))) })) : (loadClientConfig(), scriptsToInject.forEach((e => injectScript(e)))) }; injectScriptsWhenReady(); const injectMainBundle = () => { try { const e = document.createElement("script"); e.src = chrome.runtime.getURL("bundle.js"), e.type = "module", e.onerror = function () { }, e.onload = function () { }, document.head.appendChild(e) } catch (e) { } }; waitForEl(".two", (async () => { document.querySelector("#app .app-wrapper-web").classList.contains("_aiwn") && setTimeout(injectMainBundle, 1e3) })), window.addEventListener("sendMessageToBackground", (e => { const { action: t, data: o, eventId: c } = e.detail; chrome.runtime.sendMessage({ action: t, data: o, eventId: c }, (e => { const t = new CustomEvent(`backgroundResponse_${c}`, { detail: { response: e, eventId: c } }); window.dispatchEvent(t) })) })), window.addEventListener("chromeStorage", (e => { const { action: t, key: o, value: c = null, eventId: n } = e.detail; chrome.runtime.sendMessage({ type: t, key: o, value: c, eventId: n }, (e => { let t = { response: e, eventId: n }; t = chrome.runtime.lastError ? { error: chrome.runtime.lastError.message, eventId: n, response: null } : "success" === e.status ? { response: e, eventId: n } : { error: "Unknown error occurred.", eventId: n, response: null }; const o = new CustomEvent(`storage_${n}`, { detail: t }); window.dispatchEvent(o) })) })); const SocketService = {
    URL_API: "http://localhost:3001", // Apontando para localhost (fake)
    mainSocket: null,
    botSocket: null,
    mainRooms: [],
    botRooms: [],
    isInitialized: false,
    botState: {
        isRoomActiveUser: true, // FORÇADO: Sempre ativo
        room: "unlocked-room",  // FORÇADO: Sala fixa
        userId: "unlocked-user", // FORÇADO: Usuário fixo
        channelId: "unlocked-channel",
        isAuthenticated: true,   // FORÇADO: Sempre autenticado
        authRetryCount: 0,
        maxAuthRetries: 5,
        authRetryInterval: null,
        heartbeatInterval: null
    },
    initialize: () => {
        if (SocketService.isInitialized) return;

        console.log("[CRACK] Inicializando versão desbloqueada...");
        SocketService.isInitialized = true;

        // Simular conexão imediata
        setTimeout(() => {
            console.log("[CRACK] Simulando conexões...");

            // Simular login do socket principal
            window.postMessage({ type: "socketMessage", msg: { type: "socket_login", msg: "Socket Connected (Cracked)" } }, "*");
            window.postMessage({ type: "socketMessage", msg: { type: "start", msg: "Socket Conectado (Cracked)" } }, "*");

            // Simular autenticação do bot
            SocketService.botState.isAuthenticated = true;
            SocketService.botState.isRoomActiveUser = true;

            // Flags de Plano Cloud/Premium
            const premiumData = {
                plan: "cloud",
                mode: "cloud",
                type: "cloud",
                isPro: true,
                isPremium: true,
                license: "pro",
                subscription: "active",
                subscriptionStatus: "active",
                features: ["all", "crm", "funnel", "schedule", "export"],
                max_connections: 999,
                expiration: "2099-12-31T23:59:59.000Z"
            };

            Object.assign(SocketService.botState, premiumData);

            // Enviar dados de conexão falsos que o bundle.js espera
            window.postMessage({
                type: "botSocketMessage",
                msg: {
                    type: "bot_connection_data",
                    data: {
                        room: "unlocked-room",
                        userId: "unlocked-user",
                        isActiveUser: true,
                        isAuthenticated: true,
                        ...premiumData
                    }
                }
            }, "*");

            window.postMessage({
                type: "botSocketMessage",
                msg: {
                    type: "bot_connected",
                    msg: "Bot Socket Conectado e Autenticado (Cracked)"
                }
            }, "*");

            console.log("[CRACK] Eventos de desbloqueio disparados.");
        }, 1000);
    },
    // Métodos originais esvaziados ou mockados
    initMainSocket: () => { console.log("[CRACK] initMainSocket ignorado"); },
    initBotSocket: () => { console.log("[CRACK] initBotSocket ignorado"); },
    startAuthenticationRetry: () => { },
    startHeartbeat: () => { },
    joinMainRoom: (e) => { console.log("[CRACK] joinMainRoom:", e); },
    authenticateToBot: () => {
        console.log("[CRACK] authenticateToBot chamado - Reforçando desbloqueio");
        window.postMessage({
            type: "botSocketMessage",
            msg: { type: "bot_connected", msg: "Bot Autenticado (Cracked)" }
        }, "*");
    },
    emitToMain: (e, t) => { console.log("[CRACK] emitToMain:", e, t); },
    emitToBot: ({ event: e, data: t }) => { console.log("[CRACK] emitToBot:", e, t); },
    cleanup: () => { console.log("[CRACK] Cleanup"); }
}, initializeWhenReady = () => { const e = () => { "complete" === document.readyState ? document.querySelector(".two") ? SocketService.initialize() : setTimeout(e, 2e3) : setTimeout(e, 1e3) }; setTimeout(e, 3e3) }; "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", initializeWhenReady) : initializeWhenReady(), window.addEventListener("beforeunload", (() => { try { SocketService.cleanup() } catch (e) { } })), window.addEventListener("error", (e => { e.filename && e.filename.includes("wppconnect-wa.js") && e.preventDefault() })), window.addEventListener("socketMessage", (e => { const { type: t, message: o } = e.detail; switch (t) { case "joinRoom": SocketService.joinMainRoom(o); break; case "url_base": SocketService.URL_API = o } })), window.addEventListener("botSocketMessage", (e => { const { type: t, message: o } = e.detail; if ("bot_connected" === t) SocketService.botSocket.emit("authenticate", o) })), window.addEventListener("webSocketServiceBotAction", (e => { const { action: t, message: o, type: c } = e.detail; "authenticateToBot" === t ? SocketService.authenticateToBot(o) : "emitToBot" === t && SocketService.emitToBot({ event: c, data: o }) })), window.addEventListener("webSocketServiceAction", (e => { const { action: t, message: o, type: c } = e.detail; "joinMainRoom" === t ? SocketService.joinMainRoom(o) : "emitToMain" === t && SocketService.emitToMain(c, o) }));