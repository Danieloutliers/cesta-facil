// Flow Module (Refactored)

window.CF.Flow.init = async () => {
    console.log("[CF2.0] Flow Module Initialized");
    const result = await chrome.storage.local.get(['cf_flows']);
    window.CF.flows = result.cf_flows || [];
    startMessageObserver();
};

window.CF.Flow.save = () => {
    const name = document.getElementById('cf-flow-name').value;
    const keywordsInput = document.getElementById('cf-flow-keywords').value;
    const response = document.getElementById('cf-flow-response').value;

    if (!name || !keywordsInput || !response) return alert("Preencha todos os campos");

    const keywords = keywordsInput.split(',').map(k => k.trim());

    const newFlow = {
        id: 'flow_' + Date.now(),
        active: true,
        name,
        keywords,
        response
    };

    window.CF.flows.push(newFlow);
    chrome.storage.local.set({ cf_flows: window.CF.flows });

    document.getElementById('cf-flow-name').value = '';
    document.getElementById('cf-flow-keywords').value = '';
    document.getElementById('cf-flow-response').value = '';

    window.CF.Flow.renderList();
};

window.CF.Flow.delete = (flowId) => {
    window.CF.flows = window.CF.flows.filter(f => f.id !== flowId);
    chrome.storage.local.set({ cf_flows: window.CF.flows });
    window.CF.Flow.renderList();
};

window.CF.Flow.renderList = () => {
    const list = document.getElementById('cf-flows-list');
    if (!list) return;

    list.innerHTML = '';
    const flows = window.CF.flows;

    if (flows.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--cf-text-secondary)">Nenhum fluxo criado</div>';
        return;
    }

    flows.forEach(flow => {
        const item = document.createElement('div');
        item.className = 'cf-flow-item';
        item.innerHTML = `
            <div class="cf-flow-header">
                <span class="cf-flow-name">${flow.name}</span>
                <span class="cf-flow-toggle" title="Delete">🗑️</span>
            </div>
            <div style="font-size: 12px; color: var(--cf-text-secondary)">
                Gatilhos: ${flow.keywords.join(', ')}
            </div>
        `;

        item.querySelector('.cf-flow-toggle').onclick = () => {
            if (confirm('Deletar fluxo?')) {
                window.CF.Flow.delete(flow.id);
            }
        };

        list.appendChild(item);
    });
};

// Automation
const startMessageObserver = () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node.classList && node.classList.contains('message-in')) {
                        processIncomingMessage(node);
                    }
                });
            }
        });
    });

    const tryAttach = setInterval(() => {
        const main = document.getElementById('main');
        if (main) {
            clearInterval(tryAttach);
            observer.observe(main, { childList: true, subtree: true });
        }
    }, 2000);
};

const processIncomingMessage = (messageNode) => {
    const textNode = messageNode.querySelector('.selectable-text span');
    if (!textNode) return;

    const text = textNode.innerText.toLowerCase().trim();

    window.CF.flows.forEach(flow => {
        if (flow.active && flow.keywords.some(k => text.includes(k.toLowerCase()))) {
            console.log("[CF2.0] Flow Triggered:", flow.name);
            executeFlowAction(flow);
        }
    });
};

const executeFlowAction = async (flow) => {
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    const inputBox = document.querySelector('footer div[contenteditable="true"]');
    if (inputBox) {
        inputBox.innerHTML = flow.response;
        inputBox.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => {
            const sendBtn = document.querySelector('span[data-icon="send"]');
            if (sendBtn) sendBtn.click();
        }, 500);
    }
};
