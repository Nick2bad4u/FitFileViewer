/**
 * @vitest-environment node
 */
// @ts-nocheck

import { beforeEach, describe, expect, it } from "vitest";
import { afterEach, vi } from "vitest";
import { EventEmitter } from "node:events";

/**
 * Build an ipcMain mock that behaves like many unit-test mocks:
 * - `handle()` and `on()` register EventEmitter listeners
 * - *no* removeHandler/removeListener APIs are provided
 */
function createMinimalIpcMainMock() {
    const emitter = new EventEmitter();

    return {
        emitter,
        handle(channel, handler) {
            emitter.on(`handle:${channel}`, handler);
        },
        on(channel, listener) {
            emitter.on(channel, listener);
        },
    };
}

describe("ipcRegistry idempotency", () => {
    beforeEach(() => {
        // Ensure electronAccess re-reads the override for each test.
        vi.resetModules();
        // eslint-disable-next-line no-underscore-dangle
        delete globalThis.__electronHoistedMock;
    });

    afterEach(() => {
        // eslint-disable-next-line no-underscore-dangle
        delete globalThis.__electronHoistedMock;
    });

    it("registerIpcHandle does not leak listeners when removeHandler is unavailable", async () => {
        const ipcMain = createMinimalIpcMainMock();
        // eslint-disable-next-line no-underscore-dangle
        globalThis.__electronHoistedMock = { ipcMain };

        const { registerIpcHandle } = await import("../../../../main/ipc/ipcRegistry.js");

        registerIpcHandle("dialog:openFile", async () => 1);
        registerIpcHandle("dialog:openFile", async () => 2);

        expect(ipcMain.emitter.listenerCount("handle:dialog:openFile")).toBe(1);

    });

    it("registerIpcListener does not leak listeners when removeListener is unavailable", async () => {
        const ipcMain = createMinimalIpcMainMock();
        // eslint-disable-next-line no-underscore-dangle
        globalThis.__electronHoistedMock = { ipcMain };

        const { registerIpcListener } = await import("../../../../main/ipc/ipcRegistry.js");

        registerIpcListener("theme-changed", () => 1);
        registerIpcListener("theme-changed", () => 2);

        expect(ipcMain.emitter.listenerCount("theme-changed")).toBe(1);

    });

    it("resetIpcRegistries removes registered handlers/listeners when APIs exist", async () => {
        const ipcMain = {
            handleCalls: 0,
            onCalls: 0,
            removedHandlers: [],
            removedListeners: [],
            handle(channel, handler) {
                this.handleCalls += 1;
                // mimic Electron storing internally
                this._handler = { channel, handler };
            },
            on(channel, listener) {
                this.onCalls += 1;
                this._listener = { channel, listener };
            },
            removeHandler(channel) {
                this.removedHandlers.push(channel);
            },
            removeListener(channel, listener) {
                this.removedListeners.push({ channel, listenerType: typeof listener });
            },
        };

        // eslint-disable-next-line no-underscore-dangle
        globalThis.__electronHoistedMock = { ipcMain };

        const { registerIpcHandle, registerIpcListener, resetIpcRegistries } = await import(
            "../../../../main/ipc/ipcRegistry.js"
        );

        registerIpcHandle("file:read", async () => 123);
        registerIpcListener("set-fullscreen", () => void 0);

        resetIpcRegistries();

        expect(ipcMain.removedHandlers).toContain("file:read");
        expect(ipcMain.removedListeners.some((x) => x.channel === "set-fullscreen")).toBe(true);
    });
});
