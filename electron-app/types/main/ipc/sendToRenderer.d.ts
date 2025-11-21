/**
 * Sends an IPC message to the renderer only when the target window is still usable.
 *
 * @param {any} win - BrowserWindow instance.
 * @param {string} channel - IPC channel.
 * @param {...any} args - Payload forwarded to webContents.send.
 */
export function sendToRenderer(win: any, channel: string, ...args: any[]): void;
//# sourceMappingURL=sendToRenderer.d.ts.map
