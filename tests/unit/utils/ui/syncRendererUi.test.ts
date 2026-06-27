import { describe, expect, it, vi } from "vitest";
import type { NotificationTimerRuntime } from "../../../../electron-app/utils/ui/notifications/notificationTimerRuntime.js";

type StateListener = (
    newValue: unknown,
    oldValue: unknown,
    path: string
) => void;

type SyncRendererLoadingModule =
    typeof import("../../../../electron-app/utils/ui/loading/syncRendererLoading.js");
type SyncRendererNotificationsModule =
    typeof import("../../../../electron-app/utils/ui/notifications/syncRendererNotifications.js");
type RendererStateBindingsModule =
    typeof import("../../../../electron-app/utils/ui/rendererStateBindings.js");

const stateMock = vi.hoisted(() => {
    const listeners = new Map<string, Set<StateListener>>();
    const state = new Map<string, unknown>();

    return {
        getState: vi.fn<(path: string) => unknown>((path) => state.get(path)),
        reset(): void {
            listeners.clear();
            state.clear();
            this.getState.mockClear();
            this.setState.mockClear();
            this.subscribe.mockClear();
        },
        setState: vi.fn<
            (
                path: string,
                value: unknown,
                options?: { source?: string }
            ) => void
        >((path, value) => {
            const previousValue = state.get(path);
            state.set(path, value);

            const pathListeners = listeners.get(path);
            if (!pathListeners) {
                return;
            }

            for (const listener of pathListeners) {
                listener(value, previousValue, path);
            }
        }),
        subscribe: vi.fn<(path: string, callback: StateListener) => () => void>(
            (path, callback) => {
                const pathListeners = listeners.get(path) ?? new Set();
                pathListeners.add(callback);
                listeners.set(path, pathListeners);

                return () => {
                    pathListeners.delete(callback);
                };
            }
        ),
    };
});

vi.mock(
    import("../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: stateMock.getState,
        setState: stateMock.setState,
        subscribe: stateMock.subscribe,
    })
);

function resetTestState(): void {
    vi.useFakeTimers();
    vi.resetModules();
    stateMock.reset();
    document.body.textContent = "";
    document.body.className = "";
    document.body.removeAttribute("aria-busy");
    setupDOM();
}

function setupDOM(): void {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.id = "loadingOverlay";
    loadingOverlay.style.display = "none";

    const notification = document.createElement("div");
    notification.id = "notification";
    notification.style.display = "none";

    const openFileButton = document.createElement("button");
    openFileButton.id = "openFileBtn";
    openFileButton.textContent = "Open";

    const otherButton = document.createElement("button");
    otherButton.id = "otherBtn";
    otherButton.textContent = "Other";

    const input = document.createElement("input");
    input.id = "someInput";

    document.body.append(
        loadingOverlay,
        notification,
        openFileButton,
        otherButton,
        input
    );
}

function requireHTMLElement(id: string): HTMLElement {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Expected #${id} to exist`);
    }

    return element;
}

async function importRendererStateBindings(): Promise<RendererStateBindingsModule> {
    return import("../../../../electron-app/utils/ui/rendererStateBindings.js");
}

async function importSyncRendererLoading(): Promise<SyncRendererLoadingModule> {
    return import("../../../../electron-app/utils/ui/loading/syncRendererLoading.js");
}

async function importSyncRendererNotifications(): Promise<SyncRendererNotificationsModule> {
    return import("../../../../electron-app/utils/ui/notifications/syncRendererNotifications.js");
}

describe("sync renderer UI helpers", () => {
    it("showNotification updates DOM, state, and clears after timeout", async () => {
        expect.assertions(6);

        resetTestState();

        const { getCurrentNotification, showNotification } =
            await importSyncRendererNotifications();

        expect(getCurrentNotification()).toBeNull();

        showNotification("Hello", "info", 1000);

        const notification = requireHTMLElement("notification");

        expect(notification.textContent).toBe("Hello");
        expect(notification.className).toBe("notification info");
        expect(notification.style.display).toBe("block");
        expect(getCurrentNotification()).toStrictEqual(
            expect.objectContaining({ message: "Hello", type: "info" })
        );

        vi.runAllTimers();

        expect(notification.style.display).toBe("none");
    });

    it("showNotification schedules and clears through an injected timer runtime", async () => {
        expect.assertions(8);

        resetTestState();

        const timestamp = Number("1234");
        const timeoutHandle = Number("47");
        const runtime: NotificationTimerRuntime = {
            clearTimeout: vi.fn(),
            dateNow: vi.fn(() => timestamp),
            setTimeout: vi.fn(() => timeoutHandle),
        };
        const { clearNotification, getCurrentNotification, showNotification } =
            await importSyncRendererNotifications();

        showNotification("Injected timer", "warning", 2500, runtime);

        const notification = requireHTMLElement("notification");

        expect(notification.textContent).toBe("Injected timer");
        expect(notification.style.display).toBe("block");
        expect(runtime.setTimeout).toHaveBeenCalledExactlyOnceWith(
            expect.any(Function),
            2500
        );
        expect(runtime.dateNow).toHaveBeenCalledOnce();
        expect(getCurrentNotification()).toStrictEqual(
            expect.objectContaining({ timestamp })
        );

        clearNotification();

        expect(runtime.clearTimeout).toHaveBeenCalledExactlyOnceWith(
            timeoutHandle
        );
        expect(notification.style.display).toBe("none");
        expect(getCurrentNotification()).toBeNull();
    });

    it("showNotification warns when the notification element is missing", async () => {
        expect.assertions(2);

        resetTestState();
        requireHTMLElement("notification").remove();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { showNotification } = await importSyncRendererNotifications();

        try {
            showNotification("Hi", "success", 0);

            expect(document.getElementById("notification")).toBeNull();
            expect(warnSpy).toHaveBeenCalledWith(
                "[RendererUtils] Notification element not found"
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it("setLoading toggles overlay, cursor, and aria attributes", async () => {
        expect.assertions(7);

        resetTestState();

        const { setLoading } = await importSyncRendererLoading();
        const overlay = requireHTMLElement("loadingOverlay");
        const openButton = requireHTMLElement("openFileBtn");
        const otherButton = requireHTMLElement("otherBtn") as HTMLButtonElement;
        const input = requireHTMLElement("someInput") as HTMLInputElement;

        setLoading(true);

        expect(overlay.style.display).toBe("flex");
        expect(document.body.style.cursor).toBe("wait");
        expect(overlay.getAttribute("aria-hidden")).toBe("false");
        expect(document.body.getAttribute("aria-busy")).toBe("true");
        expect(openButton.getAttribute("disabled")).toBeNull();

        setLoading(false);

        expect(otherButton.disabled ? "disabled" : "enabled").toBe("enabled");
        expect(input.disabled ? "disabled" : "enabled").toBe("enabled");
    });

    it("initializeRendererStateBindings wires subscriptions and updates UI on state change", async () => {
        expect.assertions(6);

        resetTestState();

        const { initializeRendererStateBindings } =
            await importRendererStateBindings();
        const overlay = requireHTMLElement("loadingOverlay");
        const notification = requireHTMLElement("notification");

        initializeRendererStateBindings();
        expect(stateMock.subscribe).toHaveBeenCalledWith(
            "isLoading",
            expect.any(Function)
        );
        expect(stateMock.subscribe).toHaveBeenCalledWith(
            "ui.currentNotification",
            expect.any(Function)
        );

        const loadingCallback = stateMock.subscribe.mock.calls.find(
            ([path]) => path === "isLoading"
        )?.[1];
        const notificationCallback = stateMock.subscribe.mock.calls.find(
            ([path]) => path === "ui.currentNotification"
        )?.[1];

        loadingCallback?.(true, false, "isLoading");

        expect(overlay.style.display).toBe("flex");
        expect(document.body.getAttribute("aria-busy")).toBe("true");

        notificationCallback?.(
            {
                message: "Done",
                type: "success",
            },
            null,
            "ui.currentNotification"
        );

        expect(notification.textContent).toBe("Done");
        expect(notification.getAttribute("role")).toBe("alert");
    });

    it("createRendererStateBindings wires explicit state and UI dependencies", async () => {
        expect.assertions(5);

        const { createRendererStateBindings } =
            await importRendererStateBindings();
        const logStateInitialized = vi.fn<(message: string) => void>();
        const loadingSubscribers: Array<(loading: boolean) => void> = [];
        const notificationSubscribers: Array<(notification: unknown) => void> =
            [];
        const updateLoadingFromState = vi.fn<(loading: boolean) => void>();
        const updateNotificationFromState =
            vi.fn<(notification: unknown) => void>();

        const utils = createRendererStateBindings({
            logStateInitialized,
            subscribeToCurrentRendererNotification: (listener) => {
                notificationSubscribers.push(listener);
            },
            subscribeToRendererLoading: (listener) => {
                loadingSubscribers.push(listener);
            },
            updateLoadingFromState,
            updateNotificationFromState,
        });

        utils();
        loadingSubscribers[0]?.(true);
        notificationSubscribers[0]?.({
            message: "Saved",
            type: "success",
        });

        expect(loadingSubscribers).toHaveLength(1);
        expect(notificationSubscribers).toHaveLength(1);
        expect(updateLoadingFromState).toHaveBeenCalledExactlyOnceWith(true);
        expect(updateNotificationFromState).toHaveBeenCalledExactlyOnceWith({
            message: "Saved",
            type: "success",
        });
        expect(logStateInitialized).toHaveBeenCalledExactlyOnceWith(
            "[RendererUtils] State management initialized"
        );
    });

    it("helper wrappers call showNotification with their expected types", async () => {
        expect.assertions(1);

        resetTestState();

        const { showError, showInfo, showSuccess, showWarning } =
            await importSyncRendererNotifications();
        const notification = requireHTMLElement("notification");
        const classes: string[] = [];

        showSuccess("ok", 0);
        classes.push(notification.className);

        showError("bad", 0);
        classes.push(notification.className);

        showInfo("info", 0);
        classes.push(notification.className);

        showWarning("warn", 0);
        classes.push(notification.className);

        expect(classes).toStrictEqual([
            "notification success",
            "notification error",
            "notification info",
            "notification warning",
        ]);
    });

    it("clearNotification hides the element and clears state", async () => {
        expect.assertions(3);

        resetTestState();

        const { clearNotification, getCurrentNotification, showInfo } =
            await importSyncRendererNotifications();
        const notification = requireHTMLElement("notification");

        showInfo("temp", 0);

        expect(notification.style.display).toBe("block");

        clearNotification();

        expect(notification.style.display).toBe("none");
        expect(getCurrentNotification()).toBeNull();
    });
});
