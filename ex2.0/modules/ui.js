// UI Module (Refactored for Isolated World)

window.CF.UI.createSidebar = () => {
    if (document.getElementById('cf-sidebar')) return;

    const sidebar = document.createElement('div');
    sidebar.id = 'cf-sidebar';
    sidebar.className = 'cf-sidebar collapsed';

    sidebar.innerHTML = `
        <div class="cf-header">
            <div class="cf-title">Cesta Fácil CRM</div>
            <div style="cursor:pointer" id="cf-close-btn">✖</div>
        </div>
        
        <div class="cf-tabs">
            <div class="cf-tab active" data-tab="crm">CRM</div>
            <div class="cf-tab" data-tab="flows">Automação</div>
        </div>

        <div class="cf-content">
            <!-- CRM TAB -->
            <div id="tab-crm" class="cf-tab-content active">
                <button class="cf-btn" id="cf-open-kanban-btn" style="margin-bottom: 20px; background: linear-gradient(to right, #8B5CF6, #3B82F6);">
                    📊 Abrir Kanban Board
                </button>

                <div class="cf-card">
                    <span class="cf-label">Status do Lead</span>
                    <div class="cf-pipeline-selector" id="cf-pipeline-status">
                        <span class="cf-status-badge">Novo Lead</span>
                    </div>
                </div>

                <div class="cf-card">
                    <span class="cf-label">Dados do Cliente</span>
                    <input type="text" class="cf-input" placeholder="Nome Completo" id="cf-customer-name">
                    <input type="text" class="cf-input" placeholder="Email" id="cf-customer-email">
                    <input type="text" class="cf-input" placeholder="CPF/CNPJ" id="cf-customer-doc">
                </div>

                <div class="cf-card">
                    <span class="cf-label">Anotações</span>
                    <textarea class="cf-textarea" rows="4" placeholder="Escreva observações sobre este cliente..." id="cf-notes"></textarea>
                    <button class="cf-btn" id="cf-save-btn">Salvar Alterações</button>
                </div>
            </div>

            <!-- FLOWS TAB -->
            <div id="tab-flows" class="cf-tab-content">
                <div class="cf-card" style="border-bottom: 1px solid var(--cf-border); padding-bottom: 20px;">
                    <span class="cf-label">Novo Fluxo</span>
                    <input type="text" class="cf-input" placeholder="Nome do Fluxo (ex: Promoção)" id="cf-flow-name">
                    <input type="text" class="cf-input" placeholder="Gatilhos (sep. por vírgula)" id="cf-flow-keywords">
                    <textarea class="cf-textarea" rows="2" placeholder="Resposta Automática" id="cf-flow-response"></textarea>
                    <button class="cf-btn" id="cf-add-flow-btn">+ Criar Automação</button>
                </div>
                
                <span class="cf-label" style="margin-top: 20px;">Seus Fluxos</span>
                <div id="cf-flows-list"></div>
            </div>
        </div>
    `;

    document.body.appendChild(sidebar);

    // Tab Logic
    sidebar.querySelectorAll('.cf-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            sidebar.querySelectorAll('.cf-tab').forEach(t => t.classList.remove('active'));
            sidebar.querySelectorAll('.cf-tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');

            if (tab.dataset.tab === 'flows') window.CF.Flow.renderList();
        });
    });

    document.getElementById('cf-add-flow-btn').addEventListener('click', window.CF.Flow.save);

    // Kanban Logic - Dispatch Event
    document.getElementById('cf-open-kanban-btn').addEventListener('click', () => {
        // Dispatch to window (Isolated World window)
        window.dispatchEvent(new Event('CF_OPEN_KANBAN'));
    });

    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'cf-toggle-btn';
    toggleBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
    toggleBtn.onclick = window.CF.UI.toggleSidebar;

    document.body.appendChild(toggleBtn);
    document.getElementById('cf-close-btn').onclick = window.CF.UI.toggleSidebar;

    console.log("[CF2.0] Sidebar Created");
};

window.CF.UI.toggleSidebar = () => {
    const sidebar = document.getElementById('cf-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        if (!sidebar.classList.contains('collapsed')) {
            window.dispatchEvent(new CustomEvent('CF_LOAD_CHAT_DATA'));
        }
    }
};

window.CF.UI.updateWithData = (data) => {
    if (!data) return;
    if (document.getElementById('cf-customer-name')) document.getElementById('cf-customer-name').value = data.name || '';
    if (document.getElementById('cf-customer-email')) document.getElementById('cf-customer-email').value = data.email || '';
    if (document.getElementById('cf-notes')) document.getElementById('cf-notes').value = data.notes || '';

    // Update Badge
    if (data.status && document.querySelector('.cf-status-badge')) {
        document.querySelector('.cf-status-badge').innerText = data.status.toUpperCase();
    }
};
