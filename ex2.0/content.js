// Main Content Script (Refactored)

console.log("[CF2.0] Main Content Script Loaded");

const initApp = async () => {
    // Wait for Globals
    if (!window.CF) {
        console.error("Globals not found!");
        return;
    }

    // Initialize Modules
    window.CF.UI.createSidebar();

    // Safely init async modules
    window.CF.safeExec(async () => {
        await window.CF.CRM.init();
        await window.CF.Flow.init();
        window.CF.Kanban.init();
    });

    console.log("[CF2.0] All Modules Initialized");
};

// Wait for interface (e.g. valid WhatsApp DOM)
const waitForInterface = () => {
    const app = document.getElementById('app');
    if (app && document.querySelector('#side')) {
        console.log("[CF2.0] WhatsApp Interface detected. Starting App...");
        initApp();
    } else {
        setTimeout(waitForInterface, 500);
    }
};

waitForInterface();
