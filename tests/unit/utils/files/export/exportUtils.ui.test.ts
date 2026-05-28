import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

async function loadExportUtils() {
    return await import("../../../../../electron-app/utils/files/export/exportUtils.js");
}

function installBaseMocks() {
    // Minimal manual mock registry so exportUtils resolves showNotification/detectCurrentTheme
    const reg = new Map<string, any>();
    (globalThis as any).__vitest_manual_mocks__ = reg;
    reg.set("/utils/ui/notifications/showNotification.js", {
        showNotification: vi.fn(),
    });
    reg.set("/utils/charts/theming/chartThemeUtils.js", {
        detectCurrentTheme: vi.fn(() => "light"),
    });

    // Provide URL, Clipboard, and minimal canvas APIs used by exportUtils
    const URLMock = function URLMock(this: any, input?: string, base?: string) {
        if (!(this instanceof URLMock)) {
            return new (URLMock as any)(input, base);
        }
        this.href = input || "https://localhost/mock";
        this.protocol = "https:";
        this.host = "localhost";
        this.pathname = "/mock";
    } as unknown as typeof URL;
    (URLMock as any).createObjectURL = vi.fn(() => "blob:export");
    (URLMock as any).revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", URLMock);

    const ctx = {
        fillStyle: "#fff",
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(
        HTMLCanvasElement.prototype as any,
        "getContext"
    ).mockImplementation((type: any) => {
        if (type === "2d") return ctx as any;
        return null;
    });
    vi.spyOn(
        HTMLCanvasElement.prototype as any,
        "toDataURL"
    ).mockImplementation(() => "data:image/png;base64,AAA");
}

describe("exportUtils UI modals (Imgur & Gyazo)", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
        vi.resetModules();
        installBaseMocks();
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("Imgur account manager: save, setup guide, clear, close, ESC and click-outside", async () => {
        const { exportUtils } = await loadExportUtils();

        // Open settings modal
        exportUtils.showImgurAccountManager();
        const overlay1 = document.querySelector(".imgur-account-manager-modal")
            ?.parentElement as HTMLElement;
        expect(overlay1.tagName).toBe("DIV");

        const reg = (globalThis as any).__vitest_manual_mocks__ as Map<
            string,
            any
        >;
        const notify = reg.get("/utils/ui/notifications/showNotification.js")
            .showNotification as any;

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
        expect(overlay2.isConnected).toBe(false);

        // Reopen and test ESC
        exportUtils.showImgurAccountManager();
        const overlay3 = document.querySelector(".imgur-account-manager-modal")
            ?.parentElement as HTMLElement;
        expect(overlay3.contains(document.activeElement)).toBe(false);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(overlay3.isConnected).toBe(false);

        // Reopen and test click outside
        exportUtils.showImgurAccountManager();
        const overlay4 = document.querySelector(".imgur-account-manager-modal")
            ?.parentElement as HTMLElement;
        overlay4.click(); // event target is overlay
        expect(overlay4.isConnected).toBe(false);
    });

    it("Imgur account manager: does not inject stored clientId as HTML", async () => {
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

    it("Imgur update status toggles UI", async () => {
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

    it("Gyazo account manager: save creds, connect, disconnect, clear all, close, ESC and click-outside", async () => {
        const { exportUtils } = await loadExportUtils();
        const reg = (globalThis as any).__vitest_manual_mocks__ as Map<
            string,
            any
        >;
        const notify = reg.get("/utils/ui/notifications/showNotification.js")
            .showNotification as any;

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
            .mockImplementation(async () => {
                localStorage.setItem("gyazo_access_token", "tok");
                return "tok" as any;
            });
        await (
            overlay1.querySelector("#gyazo-connect") as HTMLButtonElement
        ).click();
        expect(spyAuth).toHaveBeenCalled();
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
        const oldConfirm = (globalThis as any).confirm;
        (globalThis as any).confirm = () => true;
        (
            overlay1.querySelector("#clear-all-data") as HTMLButtonElement
        ).click();
        expect(overlay1.isConnected).toBe(false);
        (globalThis as any).confirm = oldConfirm;

        // Reopen then close button
        exportUtils.showGyazoAccountManager();
        const overlay2 = document.querySelector(".gyazo-account-manager-modal")
            ?.parentElement as HTMLElement;
        (overlay2.querySelector("#gyazo-close") as HTMLButtonElement).click();
        expect(overlay2.isConnected).toBe(false);

        // ESC
        exportUtils.showGyazoAccountManager();
        const overlay3 = document.querySelector(".gyazo-account-manager-modal")
            ?.parentElement as HTMLElement;
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(overlay3.isConnected).toBe(false);

        // Click outside
        exportUtils.showGyazoAccountManager();
        const overlay4 = document.querySelector(".gyazo-account-manager-modal")
            ?.parentElement as HTMLElement;
        overlay4.click();
        expect(overlay4.isConnected).toBe(false);
    });

    it("Gyazo account manager: does not inject stored credentials as HTML", async () => {
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

        expect(overlay.querySelectorAll("img").length).toBe(0);
        expect(overlay.innerHTML).not.toMatch(/onerror/i);
    });

    it("createGyazoAuthModal: manual mode completes with code and can cancel/esc/click-outside", async () => {
        const { exportUtils } = await loadExportUtils();
        const reg = (globalThis as any).__vitest_manual_mocks__ as Map<
            string,
            any
        >;
        const notify = reg.get("/utils/ui/notifications/showNotification.js")
            .showNotification as any;

        const resolveSpy = vi.fn();
        const rejectSpy = vi.fn();

        // Mock exchange function to return token
        const spyExchange = vi
            .spyOn(exportUtils, "exchangeGyazoCodeForToken")
            .mockResolvedValue({ access_token: "tok" } as any);

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

        expect(spyExchange).toHaveBeenCalled();
        expect(localStorage.getItem("gyazo_access_token")).toBe("tok");
        expect(resolveSpy).toHaveBeenCalledWith("tok");
        expect(notify).toHaveBeenCalledWith(
            "Gyazo authentication successful!",
            "success"
        );

        // Recreate and test cancel
        const resolve2 = vi.fn();
        const reject2 = vi.fn();
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
        expect(reject2).toHaveBeenCalled();

        // ESC
        const resolve3 = vi.fn();
        const reject3 = vi.fn();
        const overlay3 = exportUtils.createGyazoAuthModal(
            "https://auth",
            "state",
            resolve3,
            reject3,
            false
        );
        document.body.append(overlay3);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(reject3).toHaveBeenCalled();

        // Click outside
        const resolve4 = vi.fn();
        const reject4 = vi.fn();
        const overlay4 = exportUtils.createGyazoAuthModal(
            "https://auth",
            "state",
            resolve4,
            reject4,
            false
        );
        document.body.append(overlay4);
        overlay4.click();
        expect(reject4).toHaveBeenCalled();
    });

    it("createGyazoAuthModal: server mode stops server on cancel/esc/click-outside", async () => {
        const { exportUtils } = await loadExportUtils();
        (globalThis as any).electronAPI = {
            stopGyazoServer: vi.fn().mockResolvedValue(undefined),
        };

        const overlay = exportUtils.createGyazoAuthModal(
            "https://auth",
            "state",
            vi.fn(),
            vi.fn(),
            true
        );
        document.body.append(overlay);
        (
            overlay.querySelector("#gyazo-cancel-auth") as HTMLButtonElement
        ).click();
        expect(
            (globalThis as any).electronAPI.stopGyazoServer
        ).toHaveBeenCalled();

        // ESC
        const overlay2 = exportUtils.createGyazoAuthModal(
            "https://auth",
            "state",
            vi.fn(),
            vi.fn(),
            true
        );
        document.body.append(overlay2);
        const beforeEscCalls = (
            (globalThis as any).electronAPI.stopGyazoServer as any
        ).mock.calls.length;
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        // ESC may trigger multiple listeners (from current and prior modals); ensure it increases by at least 1
        expect(
            ((globalThis as any).electronAPI.stopGyazoServer as any).mock.calls
                .length
        ).toBeGreaterThanOrEqual(beforeEscCalls + 1);

        // Click outside
        const overlay3 = exportUtils.createGyazoAuthModal(
            "https://auth",
            "state",
            vi.fn(),
            vi.fn(),
            true
        );
        document.body.append(overlay3);
        const beforeClickCalls = (
            (globalThis as any).electronAPI.stopGyazoServer as any
        ).mock.calls.length;
        overlay3.click();
        expect(
            ((globalThis as any).electronAPI.stopGyazoServer as any).mock.calls
                .length
        ).toBeGreaterThanOrEqual(beforeClickCalls + 1);
    });
});
