// Cesta Fácil 2.0 - Background Service Worker

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        tags: [
            { id: 'new', name: 'Novo Cliente', color: '#10B981' },
            { id: 'pending', name: 'Aguardando Pagamento', color: '#F59E0B' },
            { id: 'closed', name: 'Concluído', color: '#3B82F6' },
            { id: 'vip', name: 'VIP', color: '#8B5CF6' }
        ],
        pipelines: [
            { id: 'default', name: 'Vendas Padrão' }
        ],
        stages: [
            { id: 'lead', name: 'Novo Lead', pipelineId: 'default' },
            { id: 'contact', name: 'Em Contato', pipelineId: 'default' },
            { id: 'negotiation', name: 'Em Negociação', pipelineId: 'default' },
            { id: 'won', name: 'Venda Realizada', pipelineId: 'default' }
        ]
    });
    console.log("Cesta Fácil 2.0 Installed - CRM Initialized");
});

// Listener for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_CRM_DATA') {
        chrome.storage.local.get(null, (data) => {
            sendResponse(data);
        });
        return true; // Keep channel open for async response
    }
});
