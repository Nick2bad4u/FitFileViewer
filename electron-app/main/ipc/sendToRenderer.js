const { validateWindow } = require("../window/windowValidation");

/**
 * Sends an IPC message to the renderer only when the target window is still usable.
 *
 * @param {any} win - BrowserWindow instance.
 * @param {string} channel - IPC channel.
 * @param {...any} args - Payload forwarded to webContents.send.
 */
function sendToRenderer(win, channel, ...args) {
    if (validateWindow(win, `IPC send to ${channel}`)) {
        win.webContents.send(channel, ...args);
    }
}

module.exports = { sendToRenderer };
