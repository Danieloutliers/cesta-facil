// CRM Module (Refactored)

let currentChatId = null;

window.CF.CRM.init = async () => {
    console.log("[CF2.0] CRM Initialized");
    window.addEventListener('CF_LOAD_CHAT_DATA', loadCurrentChatData);
    setInterval(detectActiveChat, 1000);

    const saveBtn = document.getElementById('cf-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveData);
};

const detectActiveChat = () => {
    const headerTitle = document.querySelector('header span[title]');
    if (headerTitle) {
        const title = headerTitle.getAttribute('title');
        const cleanTitle = title.replace(/\D/g, '');

        if (cleanTitle.length > 8) {
            if (currentChatId !== cleanTitle) {
                currentChatId = cleanTitle;
                console.log("[CF2.0] Active Chat Changed:", currentChatId);
                loadCurrentChatData();
            }
        }
    }
};

const loadCurrentChatData = () => {
    if (!currentChatId) return;

    // Now we CAN use chrome.storage because we are in Content Script
    chrome.storage.local.get([`crm_${currentChatId}`], (result) => {
        const data = result[`crm_${currentChatId}`] || {};
        window.CF.UI.updateWithData(data);
    });
};

const saveData = () => {
    if (!currentChatId) {
        alert("Nenhum chat selecionado");
        return;
    }

    const data = {
        name: document.getElementById('cf-customer-name').value,
        email: document.getElementById('cf-customer-email').value,
        notes: document.getElementById('cf-notes').value,
        status: 'novo',
        updatedAt: new Date().toISOString()
    };

    chrome.storage.local.get([`crm_${currentChatId}`], (result) => {
        if (result[`crm_${currentChatId}`] && result[`crm_${currentChatId}`].status) {
            data.status = result[`crm_${currentChatId}`].status;
        }

        chrome.storage.local.set({ [`crm_${currentChatId}`]: data }, () => {
            console.log("[CF2.0] Data Saved");
            const btn = document.getElementById('cf-save-btn');
            if (btn) {
                const originalText = btn.innerText;
                btn.innerText = "Salvo!";
                setTimeout(() => btn.innerText = originalText, 2000);
            }
        });
    });
};
