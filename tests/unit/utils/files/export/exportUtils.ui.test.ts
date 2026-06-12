import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type DetectCurrentTheme = () => "light";
type OAuthReject = (error: Error) => void;
type OAuthResolve = (token: string) => void;
type ShowNotification = (message: string, type: string) => void;
type StopGyazoServer = () => Promise<void>;
type TestGlobal = typeof globalThis & {
    confirm: (message?: string) => boolean;
};

let detectCurrentThemeMock:
    | ReturnType<typeof vi.fn<DetectCurrentTheme>>
    | undefined;
let showNotificationMock:
    | ReturnType<typeof vi.fn<ShowNotification>>
    | undefined;
let stopGyazoServerMock: ReturnType<typeof vi.fn<StopGyazoServer>> | undefined;

async function loadExportUtils() {
    const module =
        await import("../../../../../electron-app/utils/files/export/exportUtils.js");
    module.__setTestDeps({
        detectCurrentTheme: getDetectCurrentThemeMock(),
        showNotification: getShowNotificationMock(),
    });
    return module;
}

function getDetectCurrentThemeMock(): ReturnType<
    typeof vi.fn<DetectCurrentTheme>
> {
    if (!detectCurrentThemeMock) {
        throw new Error("detectCurrentTheme mock was not installed");
    }
    return detectCurrentThemeMock;
}

function getShowNotificationMock(): ReturnType<typeof vi.fn<ShowNotification>> {
    if (!showNotificationMock) {
        throw new Error("showNotification mock was not installed");
    }
    return showNotificationMock;
}

function getStopGyazoServerMock(): ReturnType<typeof vi.fn<StopGyazoServer>> {
    if (!stopGyazoServerMock) {
        throw new Error("stopGyazoServer mock was not installed");
    }
    return stopGyazoServerMock;
}

function installBaseMocks() {
    showNotificationMock = vi.fn<ShowNotification>();
    detectCurrentThemeMock = vi
        .fn<DetectCurrentTheme>()
        .mockReturnValue("light");

    // Provide URL, Clipboard, and minimal canvas APIs used by exportUtils
    const URLMock = function URLMock(
        this: URL,
        input?: string | URL,
        base?: string | URL
    ) {
        if (!(this instanceof URLMock)) {
            return new URLMock(input, base);
        }
        this.href = input || "https://localhost/mock";
        this.protocol = "https:";
        this.host = "localhost";
        this.pathname = "/mock";
    } as unknown as typeof URL & {
        createObjectURL: () => string;
        revokeObjectURL: () => void;
    };
    URLMock.createObjectURL = () => "blob:export";
    URLMock.revokeObjectURL = () => {};
    vi.stubGlobal("URL", URLMock);

    const ctx = {
        fillStyle: "#fff",
        drawImage: vi.fn<(...args: unknown[]) => void>(),
        fillRect: vi.fn<(...args: unknown[]) => void>(),
        getImageData: vi.fn<() => ImageData>(
            () => ({ data: new Uint8ClampedArray(4) }) as ImageData
        ),
        putImageData: vi.fn<(...args: unknown[]) => void>(),
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
        (type: string) => {
            if (type === "2d") {
                return ctx;
            }
            return null;
        }
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
        "data:image/png;base64,AAA"
    );
}

describe("exportUtils UI modals (Imgur & Gyazo)", () => {
    beforeEach(function setupExportUiTest(): void {
        document.body.replaceChildren();
        localStorage.clear();
        vi.restoreAllMocks();
        vi.resetModules();
        installBaseMocks();
    });

    afterEach(async function cleanupExportUiTest(): Promise<void> {
        document.body.replaceChildren();
        detectCurrentThemeMock = undefined;
        showNotificationMock = undefined;
        stopGyazoServerMock = undefined;
        await resetRegisteredElectronApi();
    });

    it("imgur account manager: save, setup guide, clear, close, ESC and click-outside", async () => {
        expect.assertions(14);

        const { exportUtils } = await loadExportUtils();

        // Open settings modal
        exportUtils.showImgurAccountManager();
        const overlay1 = document.querySelector(".imgur-account-manager-modal")
            ?.parentElement as HTMLElement;
        expect(overlay1.tagName).toBe("DIV");

        const notify = getShowNotificationMock();

        // Save configuration
        const input = overlay1.querySelector(
            "#imgur-client-id"
        ) as HTMLInputElement;
        input.value = "my-client-123";
        (
            overlay1.querySelector("#save-imgur-config") as HTMLButtonElement
        ).click();
        expect(localStorage.getItem("imgur_client_id")).toBe("my-client-123");
        expect(notify).toHaveBeenCalledWith(
            "Imgur configuration saved",
            "success"
        );
        // Status should show configured
        expect(
            (overlay1.querySelector("#imgur-status") as HTMLElement).textContent
        ).toMatch(/Configured/);

        // Open setup guide (closes current overlay and opens guide)
        (
            overlay1.querySelector("#imgur-setup-guide") as HTMLButtonElement
        ).click();
        expect(
            document.querySelector(".imgur-account-manager-modal")
        ).toBeNull();
        // Guide should exist
        expect(
            (document.querySelector("#imgur-guide-close") as HTMLElement)
                .tagName
        ).toBe("BUTTON");

        // Back to settings then clear
        (
            document.querySelector("#imgur-guide-back") as HTMLButtonElement
        ).click();
        const overlay2 = document.querySelector(".imgur-account-manager-modal")
            ?.parentElement as HTMLElement;
        expect(overlay2.tagName).toBe("DIV");

        (
            overlay2.querySelector("#clear-imgur-config") as HTMLButtonElement
        ).click();
        expect(notify).toHaveBeenCalledWith(
            "Imgur configuration cleared",
            "info"
        );
        // Input resets to default
        expect(
            (overlay2.querySelector("#imgur-client-id") as HTMLInputElement)
                .value
        ).toBe(exportUtils.getImgurConfig().clientId);
        // Status reflects current configuration logic: default client id is considered configured
        expect(
            (overlay2.querySelector("#imgur-status") as HTMLElement).textContent
        ).toMatch(/Configured/);

        // Close button removes overlay
        (overlay2.querySelector("#imgur-close") as HTMLButtonElement).click();
        expect(overlay2).toHaveProperty("isConnected", false);

        // Reopen and test ESC
        exportUtils.showImgurAccountManager();
        const overlay3 = document.querySelector(".imgur-account-manager-modal")
            ?.parentElement as HTMLElement;
        expect(
            document.activeElement?.closest(".imgur-account-manager-modal")
        ).toBeNull();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(overlay3).toHaveProperty("isConnected", false);

        // Reopen and test click outside
        exportUtils.showImgurAccountManager();
        const overlay4 = document.querySelector(".imgur-account-manager-modal")
            ?.parentElement as HTMLElement;
        overlay4.click(); // event target is overlay
        expect(overlay4).toHaveProperty("isConnected", false);
    });

    it("imgur account manager: does not inject stored clientId as HTML", async () => {
        expect.assertions(5);

        // Stored values are untrusted (localStorage can be manipulated).
        localStorage.setItem(
            "imgur_client_id",
            '"/><img src=x onerror=alert(1)>'
        );

        const { exportUtils } = await loadExportUtils();
        exportUtils.showImgurAccountManager();

        const overlay = document.querySelector(".imgur-account-manager-modal")
            ?.parentElement as HTMLElement;
        expect(overlay.tagName).toBe("DIV");

        const input = overlay.querySelector(
            "#imgur-client-id"
        ) as HTMLInputElement;
        expect(input.type).toBe("text");
        expect(input.value).toBe('"/><img src=x onerror=alert(1)>');

        // Ensure no DOM element was injected.
        expect(overlay.querySelector("img")).toBeNull();
        expect(overlay.innerHTML).not.toMatch(/onerror/i);
    });

    it("imgur update status toggles UI", async () => {
        expect.assertions(5);

        const { exportUtils } = await loadExportUtils();
        exportUtils.showImgurAccountManager();
        const modal = document.querySelector(
            ".imgur-account-manager-modal"
        ) as HTMLElement;
        expect(modal.className).toBe("imgur-account-manager-modal");

        // With default client id -> considered configured in current logic
        exportUtils.updateImgurStatus(modal);
        expect(
            (modal.querySelector("#imgur-status") as HTMLElement).textContent
        ).toMatch(/Configured/);

        // Force unconfigured/limited by setting placeholder client id
        exportUtils.setImgurConfig("YOUR_IMGUR_CLIENT_ID");
        exportUtils.updateImgurStatus(modal);
        expect(
            (modal.querySelector("#imgur-status") as HTMLElement).textContent
        ).toMatch(/Default|Limited/);

        // Custom client id -> configured
        exportUtils.setImgurConfig("abc");
        exportUtils.updateImgurStatus(modal);
        expect(exportUtils.getImgurConfig().clientId).toBe("abc");
        expect(
            (modal.querySelector("#imgur-status") as HTMLElement).style
                .background
        ).toBe("var(--color-success)");
        // cleanup
        modal.parentElement?.remove();
    });

    it("gyazo account manager: save creds, connect, disconnect, clear all, close, ESC and click-outside", async () => {
        expect.assertions(13);

        const { exportUtils } = await loadExportUtils();
        const notify = getShowNotificationMock();

        // Ensure not authenticated
        localStorage.removeItem("gyazo_access_token");

        // Open modal
        exportUtils.showGyazoAccountManager();
        const overlay1 = document.querySelector(".gyazo-account-manager-modal")
            ?.parentElement as HTMLElement;
        expect(overlay1.tagName).toBe("DIV");

        // Save credentials
        (overlay1.querySelector("#gyazo-client-id") as HTMLInputElement).value =
            "cid";
        (
            overlay1.querySelector("#gyazo-client-secret") as HTMLInputElement
        ).value = "sec";
        (
            overlay1.querySelector("#save-credentials") as HTMLButtonElement
        ).click();
        expect(localStorage.getItem("gyazo_client_id")).toBe("cid");
        expect(localStorage.getItem("gyazo_client_secret")).toBe("sec");
        expect(notify).toHaveBeenCalledWith(
            "Gyazo credentials saved successfully!",
            "success"
        );

        // Connect (mock authenticateWithGyazo and ensure token stored)
        const spyAuth = vi
            .spyOn(exportUtils, "authenticateWithGyazo")
            .mockImplementation(async function authenticateWithGyazoMock() {
                localStorage.setItem("gyazo_access_token", "tok");
                return "tok";
            });
        await (
            overlay1.querySelector("#gyazo-connect") as HTMLButtonElement
        ).click();
        expect(spyAuth).toHaveBeenCalledWith();
        // Status updated to connected (disconnect visible)
        expect(
            (overlay1.querySelector("#gyazo-disconnect") as HTMLElement).style
                .display
        ).toBe("block");
        expect(notify).toHaveBeenCalledWith(
            "Gyazo account connected successfully!",
            "success"
        );

        // Disconnect
        (
            overlay1.querySelector("#gyazo-disconnect") as HTMLButtonElement
        ).click();
        expect(localStorage.getItem("gyazo_access_token")).toBeNull();
        expect(notify).toHaveBeenCalledWith(
            "Gyazo account disconnected",
            "info"
        );

        // Clear all data (confirm=true)
        const oldConfirm = (globalThis as TestGlobal).confirm;
        (globalThis as TestGlobal).confirm = () => true;
        (
            overlay1.querySelector("#clear-all-data") as HTMLButtonElement
        ).click();
        expect(overlay1).toHaveProperty("isConnected", false);
        (globalThis as TestGlobal).confirm = oldConfirm;

        // Reopen then close button
        exportUtils.showGyazoAccountManager();
        const overlay2 = document.querySelector(".gyazo-account-manager-modal")
            ?.parentElement as HTMLElement;
        (overlay2.querySelector("#gyazo-close") as HTMLButtonElement).click();
        expect(overlay2).toHaveProperty("isConnected", false);

        // ESC
        exportUtils.showGyazoAccountManager();
        const overlay3 = document.querySelector(".gyazo-account-manager-modal")
            ?.parentElement as HTMLElement;
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(overlay3).toHaveProperty("isConnected", false);

        // Click outside
        exportUtils.showGyazoAccountManager();
        const overlay4 = document.querySelector(".gyazo-account-manager-modal")
            ?.parentElement as HTMLElement;
        overlay4.click();
        expect(overlay4).toHaveProperty("isConnected", false);
    });

    it("gyazo account manager: does not inject stored credentials as HTML", async () => {
        expect.assertions(5);

        localStorage.setItem(
            "gyazo_client_id",
            '"/><img src=x onerror=alert(1)>'
        );
        localStorage.setItem(
            "gyazo_client_secret",
            '"/><img src=y onerror=alert(2)>'
        );

        const { exportUtils } = await loadExportUtils();
        exportUtils.showGyazoAccountManager();

        const overlay = document.querySelector(".gyazo-account-manager-modal")
            ?.parentElement as HTMLElement;
        expect(overlay.tagName).toBe("DIV");

        const idInput = overlay.querySelector(
            "#gyazo-client-id"
        ) as HTMLInputElement;
        const secretInput = overlay.querySelector(
            "#gyazo-client-secret"
        ) as HTMLInputElement;
        expect(idInput.value).toBe('"/><img src=x onerror=alert(1)>');
        expect(secretInput.value).toBe('"/><img src=y onerror=alert(2)>');

        expect(overlay.querySelectorAll("img")).toHaveLength(0);
        expect(overlay.innerHTML).not.toMatch(/onerror/i);
    });

    it("createGyazoAuthModal: manual mode completes with code and can cancel/esc/click-outside", async () => {
        expect.assertions(7);

        const { exportUtils } = await loadExportUtils();
        const notify = getShowNotificationMock();

        const resolveSpy = vi.fn<OAuthResolve>();
        const rejectSpy = vi.fn<OAuthReject>();

        // Mock exchange function to return token
        const spyExchange = vi
            .spyOn(exportUtils, "exchangeGyazoCodeForToken")
            .mockResolvedValue({ access_token: "tok" });

        const overlay = exportUtils.createGyazoAuthModal(
            "https://auth",
            "state",
            resolveSpy,
            rejectSpy,
            false
        );
        document.body.append(overlay);
        const input = overlay.querySelector(
            "#gyazo-auth-code"
        ) as HTMLInputElement;
        input.value = "code123";
        (
            overlay.querySelector("#gyazo-complete-auth") as HTMLButtonElement
        ).click();

        // Wait microtask queue
        await Promise.resolve();

        expect(spyExchange).toHaveBeenCalledWith(
            "code123",
            exportUtils.getGyazoConfig().redirectUri
        );
        expect(localStorage.getItem("gyazo_access_token")).toBe("tok");
        expect(resolveSpy).toHaveBeenCalledWith("tok");
        expect(notify).toHaveBeenCalledWith(
            "Gyazo authentication successful!",
            "success"
        );

        // Recreate and test cancel
        const resolve2 = vi.fn<OAuthResolve>();
        const reject2 = vi.fn<OAuthReject>();
        const overlay2 = exportUtils.createGyazoAuthModal(
            "https://auth",
            "state",
            resolve2,
            reject2,
            false
        );
        document.body.append(overlay2);
        (
            overlay2.querySelector("#gyazo-cancel-auth") as HTMLButtonElement
        ).click();
        expect(reject2).toHaveBeenCalledWith(
            new Error("User cancelled authentication")
        );

        // ESC
        const resolve3 = vi.fn<OAuthResolve>();
        const reject3 = vi.fn<OAuthReject>();
        const overlay3 = exportUtils.createGyazoAuthModal(
            "https://auth",
            "state",
            resolve3,
            reject3,
            false
        );
        document.body.append(overlay3);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(reject3).toHaveBeenCalledWith(
            new Error("User cancelled authentication")
        );

        // Click outside
        const resolve4 = vi.fn<OAuthResolve>();
        const reject4 = vi.fn<OAuthReject>();
        const overlay4 = exportUtils.createGyazoAuthModal(
            "https://auth",
            "state",
            resolve4,
            reject4,
            false
        );
        document.body.append(overlay4);
        overlay4.click();
        expect(reject4).toHaveBeenCalledWith(
            new Error("User cancelled authentication")
        );
    });

    it("createGyazoAuthModal: server mode stops server on cancel/esc/click-outside", async () => {
        expect.assertions(3);

        const { exportUtils } = await loadExportUtils();
        stopGyazoServerMock = vi
            .fn<StopGyazoServer>()
            .mockResolvedValue(undefined);
        await registerElectronApi({ stopGyazoServer: stopGyazoServerMock });

        const overlay = exportUtils.createGyazoAuthModal(
            "https://auth",
            "state",
            vi.fn<OAuthResolve>(),
            vi.fn<OAuthReject>(),
            true
        );
        document.body.append(overlay);
        (
            overlay.querySelector("#gyazo-cancel-auth") as HTMLButtonElement
        ).click();
        const stopGyazoServer = getStopGyazoServerMock();
        expect(stopGyazoServer).toHaveBeenCalledWith();

        // ESC
        const overlay2 = exportUtils.createGyazoAuthModal(
            "https://auth",
            "state",
            vi.fn<OAuthResolve>(),
            vi.fn<OAuthReject>(),
            true
        );
        document.body.append(overlay2);
        const beforeEscCalls = stopGyazoServer.mock.calls.length;
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        // ESC may trigger multiple listeners (from current and prior modals); ensure it increases by at least 1
        expect(stopGyazoServer.mock.calls.length).toBeGreaterThanOrEqual(
            beforeEscCalls + 1
        );

        // Click outside
        const overlay3 = exportUtils.createGyazoAuthModal(
            "https://auth",
            "state",
            vi.fn<OAuthResolve>(),
            vi.fn<OAuthReject>(),
            true
        );
        document.body.append(overlay3);
        const beforeClickCalls = stopGyazoServer.mock.calls.length;
        overlay3.click();
        expect(stopGyazoServer.mock.calls.length).toBeGreaterThanOrEqual(
            beforeClickCalls + 1
        );
    });
});

async function registerElectronApi(api: {
    readonly stopGyazoServer: ReturnType<typeof vi.fn<StopGyazoServer>>;
}): Promise<void> {
    const { registerRendererElectronApiCandidate } =
        await import("../../../../../electron-app/utils/runtime/electronApiRuntime.js");
    registerRendererElectronApiCandidate(api);
}

async function resetRegisteredElectronApi(): Promise<void> {
    const { resetRendererElectronApiCandidate } =
        await import("../../../../../electron-app/utils/runtime/electronApiRuntime.js");
    resetRendererElectronApiCandidate();
}
