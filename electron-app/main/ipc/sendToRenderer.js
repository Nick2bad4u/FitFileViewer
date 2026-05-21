"use strict";
{
    const { validateWindow } = require("../window/windowValidation");
    function hasRendererSend(win) {
        return typeof win.webContents?.send === "function";
    }
    /**
     * Sends an IPC message to the renderer only when the target window is still
     * usable.
     */
    function sendToRenderer(win, channel, ...args) {
        if (
            win &&
            validateWindow(win, `IPC send to ${channel}`) &&
            hasRendererSend(win)
        ) {
            win.webContents.send(channel, ...args);
        }
    }
    module.exports = { sendToRenderer };
}
