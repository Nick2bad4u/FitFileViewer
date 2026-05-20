const { validateWindow } = require("../window/windowValidation");

/**
 * @typedef {import("electron").BrowserWindow} BrowserWindow
 */

/**
 * Sends an IPC message to the renderer only when the target window is still
 * usable.
 *
 * @param {BrowserWindow | null | undefined} win - BrowserWindow instance.
 * @param {string} channel - IPC channel.
 * @param {...unknown} args - Payload forwarded to webContents.send.
 */
function sendToRenderer(win, channel, ...args) {
    if (win && validateWindow(win, `IPC send to ${channel}`)) {
        win.webContents.send(channel, ...args);
    }
}

module.exports = { sendToRenderer };
