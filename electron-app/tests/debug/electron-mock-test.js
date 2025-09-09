/**
 * Debug test to check what the electron module mock returns
 */

console.log('=== Debugging Electron Mock ===');

// Check what the electron module returns
const electronModule = require("electron");
console.log('electronModule:', electronModule);
console.log('electronModule keys:', Object.keys(electronModule));

// Check destructuring
try {
    const { contextBridge, ipcRenderer } = electronModule;
    console.log('Destructured contextBridge:', contextBridge);
    console.log('Destructured ipcRenderer:', ipcRenderer);
    console.log('contextBridge type:', typeof contextBridge);
    console.log('ipcRenderer type:', typeof ipcRenderer);

    // Check if they have the expected methods
    if (contextBridge) {
        console.log('contextBridge.exposeInMainWorld:', typeof contextBridge.exposeInMainWorld);
    }
    if (ipcRenderer) {
        console.log('ipcRenderer.invoke:', typeof ipcRenderer.invoke);
        console.log('ipcRenderer.send:', typeof ipcRenderer.send);
        console.log('ipcRenderer.on:', typeof ipcRenderer.on);
    }
} catch (error) {
    console.error('Error during destructuring:', error);
}

// Check global mocks
console.log('=== Global Mocks ===');
console.log('globalThis.mockContextBridge:', globalThis.mockContextBridge);
console.log('globalThis.mockIpcRenderer:', globalThis.mockIpcRenderer);
