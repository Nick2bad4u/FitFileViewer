// Debug script to test electron mock behavior
const { createElectronMocks } = require("./tests/setupVitest.js");

// Create mock
const electronMocks = createElectronMocks();

console.log("Created electron mocks:", {
    hasApp: !!electronMocks.app,
    hasIpcRenderer: !!electronMocks.ipcRenderer,
    hasContextBridge: !!electronMocks.contextBridge,
});

// Simulate what vi.doMock does
const originalRequire = require;
require = function (moduleName) {
    if (moduleName === "electron") {
        console.log("Mocked electron require returning:", electronMocks);
        return electronMocks;
    }
    return originalRequire.apply(this, arguments);
};

// Test destructuring
console.log("Testing destructuring assignment...");
try {
    const { contextBridge, ipcRenderer } = require("electron");
    console.log("Destructuring result:", {
        hasContextBridge: !!contextBridge,
        hasIpcRenderer: !!ipcRenderer,
        contextBridgeType: typeof contextBridge,
        ipcRendererType: typeof ipcRenderer,
    });
} catch (error) {
    console.error("Destructuring failed:", error);
}
