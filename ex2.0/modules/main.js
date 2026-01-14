// Main Module
import { createSidebar, toggleSidebar } from './ui.js';
import { initCRM } from './crm.js';
import { initFlows } from './flow.js';
import { initKanban } from './kanban.js';

console.log("[CF2.0] Main Module Loaded");

const init = async () => {
    // Inject Styles
    // Styles are injected via manifest, but we can verify here

    // Initialize UI
    createSidebar();

    // Initialize CRM Logic
    await initCRM();

    // Initialize Flows
    await initFlows();

    // Initialize Kanban
    initKanban();

    console.log("[CF2.0] Initialization Complete");
};

init();
