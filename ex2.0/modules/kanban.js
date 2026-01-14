// Kanban Module (Refactored)

window.CF.Kanban.init = () => {
    console.log("[CF2.0] Kanban Initialized");
    window.addEventListener('CF_OPEN_KANBAN', openKanban);
};

const openKanban = async () => {
    let overlay = document.getElementById('cf-kanban-overlay');
    if (!overlay) {
        createKanbanOverlay();
        overlay = document.getElementById('cf-kanban-overlay');
    }

    overlay.style.display = 'flex';
    await renderKanbanBoard();
};

const closeKanban = () => {
    const overlay = document.getElementById('cf-kanban-overlay');
    if (overlay) overlay.style.display = 'none';
};

const createKanbanOverlay = () => {
    const overlay = document.createElement('div');
    overlay.id = 'cf-kanban-overlay';
    overlay.className = 'cf-kanban-overlay';
    overlay.innerHTML = `
        <div class="cf-kanban-header">
            <h2 class="cf-kanban-title">Pipeline de Vendas</h2>
            <button class="cf-btn-icon" id="cf-kanban-close">✖</button>
        </div>
        <div class="cf-kanban-board" id="cf-kanban-board"></div>
    `;

    document.body.appendChild(overlay);
    document.getElementById('cf-kanban-close').onclick = closeKanban;

    const importBtn = document.createElement('button');
    importBtn.className = 'cf-btn-primary';
    importBtn.innerText = 'Importar Contatos';
    importBtn.style.marginRight = '15px';
    importBtn.onclick = importActiveChats;

    overlay.querySelector('.cf-kanban-header').insertBefore(importBtn, document.getElementById('cf-kanban-close'));
};

const importActiveChats = async () => {
    // Attempt to scrape active chats from the sidebar
    // This is a "best effort" scrape of the visible chat list on the left
    const paneSide = document.getElementById('pane-side');
    if (!paneSide) {
        alert('Não foi possível encontrar a lista de conversas. Certifique-se de que o WhatsApp Web carregou completamente.');
        return;
    }

    // Typical structure: role="grid" -> role="row" -> role="gridcell" -> div -> role="listitem" ???
    // Actually, usually direct children of a virtual list.
    // Let's look for elements with role="listitem" or specific attributes
    // A robust way often is looking for image avatars or specific classes, but classes change.
    // We will target role="listitem" or simply iterate div children that look like rows.

    // Strategy: Get all elements that look like chat rows.
    // Often: div[role="listitem"] or div[aria-label]
    // Let's try to find text content.

    const chatRows = paneSide.querySelectorAll('div[role="listitem"]'); // Most common in WA Web updates

    if (chatRows.length === 0) {
        alert('Nenhuma conversa detectada. Role a lista de conversas para carregar mais.');
        return;
    }

    let count = 0;
    const existingData = await getCRMData();
    const existingIds = new Set(existingData.map(i => i.id));

    for (let row of chatRows) {
        // Extract Name
        // Usually in a span with dir="auto" and specific classes for title
        // We grep the first span with significant text
        const textSpans = Array.from(row.querySelectorAll('span[dir="auto"]'));
        if (textSpans.length < 1) continue;

        const name = textSpans[0].innerText; // Title
        const lastMsg = textSpans[1] ? textSpans[1].innerText : ''; // Subtitle/Time (varies)

        // Generate ID - strictly we don't have the phone number easily from DOM list without opening.
        // We will generate a pseudo-ID based on name. 
        // NOTE: This updates if name changes, which is a limitation of DOM scraping without opening chat.
        // For a hacky MVP, this is acceptable.

        // Try to find image url to create a better unique key if possible? No.
        const id = name.replace(/\s+/g, '_').toLowerCase();

        if (!existingIds.has(id)) {
            await updateItemStatus(id, 'novo');
            // We need to inject the name/notes too, updateItemStatus only handles status.
            // Let's make a direct update.
            const key = `crm_${id}`;
            const newItem = {
                id: id,
                name: name,
                notes: `Importado: ${lastMsg.substring(0, 20)}...`,
                status: 'novo',
                updatedAt: new Date().toISOString()
            };

            await new Promise(r => chrome.storage.local.set({ [key]: newItem }, r));
            count++;
        }
    }

    alert(`${count} contatos importados para a coluna 'Novo'.`);
    renderKanbanBoard();
};

const getCRMData = async () => {
    return new Promise((resolve) => {
        chrome.storage.local.get(null, (items) => {
            const crmItems = [];
            for (let key in items) {
                if (key.startsWith('crm_')) {
                    crmItems.push({
                        id: key.replace('crm_', ''),
                        ...items[key]
                    });
                }
            }
            resolve(crmItems);
        });
    });
};

const columns = [
    { id: 'novo', title: 'Novo Lead', color: '#10B981' },
    { id: 'negociacao', title: 'Em Negociação', color: '#F59E0B' },
    { id: 'fechado', title: 'Fechado', color: '#3B82F6' },
    { id: 'perdido', title: 'Perdido', color: '#EF4444' }
];

const renderKanbanBoard = async () => {
    const board = document.getElementById('cf-kanban-board');
    if (!board) return;
    board.innerHTML = '';

    const data = await getCRMData();

    columns.forEach(col => {
        const colEl = document.createElement('div');
        colEl.className = 'cf-kanban-column';
        colEl.dataset.status = col.id;

        colEl.innerHTML = `
            <div class="cf-column-header" style="border-bottom: 2px solid ${col.color}">
                <span class="cf-column-title">${col.title}</span>
                <span class="cf-column-count">0</span>
            </div>
            <div class="cf-column-content"></div>
        `;

        const content = colEl.querySelector('.cf-column-content');
        const items = data.filter(item => (item.status || 'novo') === col.id);
        colEl.querySelector('.cf-column-count').innerText = items.length;

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'cf-kanban-card';
            card.draggable = true;
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="cf-card-name">${item.name || 'Sem Nome'}</div>
                <div class="cf-card-number">${item.id}</div>
                ${item.notes ? `<div class="cf-card-note">${item.notes.substring(0, 30)}...</div>` : ''}
            `;

            card.addEventListener('dragstart', handleDragStart);
            content.appendChild(card);
        });

        content.addEventListener('dragover', handleDragOver);
        content.addEventListener('drop', handleDrop);
        content.addEventListener('dragenter', handleDragEnter);
        content.addEventListener('dragleave', handleDragLeave);

        board.appendChild(colEl);
    });
};

// Drag & Drop
let draggedItem = null;

const handleDragStart = (e) => {
    draggedItem = e.target;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => e.target.style.opacity = '0.5', 0);
};

const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
};

const handleDragLeave = (e) => {
    e.currentTarget.style.background = 'transparent';
};

const handleDrop = async (e) => {
    e.preventDefault();
    e.currentTarget.style.background = 'transparent';

    if (draggedItem) {
        const column = e.currentTarget.closest('.cf-kanban-column');
        const newStatus = column.dataset.status;
        const chatId = draggedItem.dataset.id;

        e.currentTarget.appendChild(draggedItem);
        draggedItem.style.opacity = '1';
        draggedItem = null;

        await updateItemStatus(chatId, newStatus);

        // Refresh to ensure counts match
        // Debounce simple
        setTimeout(renderKanbanBoard, 100);
    }
};

const updateItemStatus = (chatId, status) => {
    return new Promise((resolve) => {
        const key = `crm_${chatId}`;
        chrome.storage.local.get([key], (result) => {
            const item = result[key] || {};
            item.status = status;
            item.updatedAt = new Date().toISOString();
            chrome.storage.local.set({ [key]: item }, resolve);
        });
    });
};
