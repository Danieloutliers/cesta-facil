// Globals for Cesta Fácil 2.0
// Defines the namespace to allow data sharing between content scripts in Isolated World

window.CF = {
    // Modules
    UI: {},
    CRM: {},
    Flow: {},
    Kanban: {},

    // State
    flows: [],

    // Helper to run functions safely
    safeExec: (fn) => {
        try { fn(); } catch (e) { console.error('[CF2.0 Error]', e); }
    }
};

console.log("[CF2.0] Globals Initialized");
