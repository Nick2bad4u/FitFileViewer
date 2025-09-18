// Debug script to test electron mock behavior
const { createElectronMocks } = require("./tests/setupVitest.js");

// Create mock
const electronMocks = createElectronMocks();

console.log("Created electron mocks:", {
    hasApp: Boolean(electronMocks.app),
    hasContextBridge: Boolean(electronMocks.contextBridge),
    hasIpcRenderer: Boolean(electronMocks.ipcRenderer),
});

// Simulate what vi.doMock does
const originalRequire = require;
require = function (moduleName) {
    if (moduleName === "electron") {
        console.log("Mocked electron require returning:", electronMocks);
        return electronMocks;
    }
    return Reflect.apply(originalRequire, this, arguments);
};

// Test destructuring
console.log("Testing destructuring assignment...");
try {
    const { contextBridge, ipcRenderer } = require("electron");
    console.log("Destructuring result:", {
        contextBridgeType: typeof contextBridge,
        hasContextBridge: Boolean(contextBridge),
        hasIpcRenderer: Boolean(ipcRenderer),
        ipcRendererType: typeof ipcRenderer,
    });
} catch (error) {
    console.error("Destructuring failed:", error);
}
