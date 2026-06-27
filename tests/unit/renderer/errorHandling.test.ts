import { describe, expect, it, vi } from "vitest";

import {
    createRendererErrorEventHandlers,
    getRendererErrorMessage,
} from "../../../electron-app/renderer/errorHandling.js";

describe("renderer error handling", () => {
    it("extracts non-empty object messages", () => {
        expect.assertions(5);

        expect(getRendererErrorMessage(new Error("boom"))).toBe("boom");
        expect(getRendererErrorMessage({ message: "plain" })).toBe("plain");
        expect(
            getRendererErrorMessage(Object.create({ message: "inherited" }))
        ).toBe("inherited");
        expect(getRendererErrorMessage({ message: "" })).toBe("Unknown error");
        expect(getRendererErrorMessage("string failure")).toBe("Unknown error");
    });

    it("logs uncaught errors and shows critical notifications", async () => {
        expect.assertions(2);

        const logs: unknown[][] = [];
        const notifications: unknown[][] = [];
        const { handleUncaughtError } = createRendererErrorEventHandlers({
            getCoreModules: () =>
                Promise.resolve({
                    showNotification: (...args: unknown[]) => {
                        notifications.push(args);
                    },
                }),
            logRenderer: (...args: unknown[]) => {
                logs.push(args);
            },
        });

        await handleUncaughtError({
            error: new Error("render failed"),
        } as ErrorEvent);

        expect(logs).toStrictEqual([
            [
                "error",
                "[Renderer] Uncaught error:",
                expect.any(Error),
            ],
        ]);
        expect(notifications).toStrictEqual([
            [
                "Critical error: render failed",
                "error",
                7000,
            ],
        ]);
    });

    it("logs unhandled rejections, shows notifications, and prevents default handling", async () => {
        expect.assertions(3);

        let prevented = false;
        const logs: unknown[][] = [];
        const notifications: unknown[][] = [];
        const { handleUnhandledRejection } = createRendererErrorEventHandlers({
            getCoreModules: () =>
                Promise.resolve({
                    showNotification: (...args: unknown[]) => {
                        notifications.push(args);
                    },
                }),
            logRenderer: (...args: unknown[]) => {
                logs.push(args);
            },
        });

        await handleUnhandledRejection({
            preventDefault: () => {
                prevented = true;
            },
            reason: new Error("promise failed"),
        } as PromiseRejectionEvent);

        expect(logs).toStrictEqual([
            [
                "error",
                "[Renderer] Unhandled promise rejection:",
                expect.any(Error),
            ],
        ]);
        expect(notifications).toStrictEqual([
            [
                "Application error: promise failed",
                "error",
                5000,
            ],
        ]);
        expect(prevented).toBe(true);
    });

    it("logs notification failures without throwing", async () => {
        expect.assertions(1);

        const notifyError = new Error("notification unavailable");
        const logs: unknown[][] = [];
        const { handleUncaughtError } = createRendererErrorEventHandlers({
            getCoreModules: () => Promise.reject(notifyError),
            logRenderer: (...args: unknown[]) => {
                logs.push(args);
            },
        });

        await handleUncaughtError({
            error: new Error("render failed"),
        } as ErrorEvent);

        expect(logs.at(-1)).toStrictEqual([
            "error",
            "[Renderer] Failed to show error notification:",
            notifyError,
        ]);
    });

    it("adapts browser events to async error handlers", async () => {
        expect.assertions(2);

        const notifications: unknown[][] = [];
        const { onUncaughtErrorEvent, onUnhandledRejectionEvent } =
            createRendererErrorEventHandlers({
                getCoreModules: () =>
                    Promise.resolve({
                        showNotification: (...args: unknown[]) => {
                            notifications.push(args);
                        },
                    }),
                logRenderer: vi.fn(),
            });

        onUncaughtErrorEvent({
            error: new Error("sync event"),
        } as ErrorEvent);
        onUnhandledRejectionEvent({
            preventDefault: vi.fn(),
            reason: new Error("async event"),
        } as unknown as Event);
        await Promise.resolve();

        expect(notifications).toContainEqual([
            "Critical error: sync event",
            "error",
            7000,
        ]);
        expect(notifications).toContainEqual([
            "Application error: async event",
            "error",
            5000,
        ]);
    });
});
