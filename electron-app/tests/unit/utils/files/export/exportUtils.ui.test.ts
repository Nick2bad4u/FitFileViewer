import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const modPath = "../../../../../utils/files/export/exportUtils.js";

function installBaseMocks() {
    // Minimal manual mock registry so exportUtils resolves showNotification/detectCurrentTheme
    const reg = new Map<string, any>();
    (globalThis as any).__vitest_manual_mocks__ = reg;
    reg.set("/utils/ui/notifications/showNotification.js", { showNotification: vi.fn() });
    reg.set("/utils/charts/theming/chartThemeUtils.js", { detectCurrentTheme: vi.fn(() => "light") });

    // Provide URL, Clipboard, and minimal canvas APIs used by exportUtils
    vi.stubGlobal("URL", {
        createObjectURL: vi.fn(() => "blob:export"),
        revokeObjectURL: vi.fn(),
    });

    const ctx = {
        fillStyle: "#fff",
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(HTMLCanvasElement.prototype as any, "getContext").mockImplementation((type: any) => {
        if (type === "2d") return ctx as any;
        return null;
    });
    vi.spyOn(HTMLCanvasElement.prototype as any, "toDataURL").mockImplementation(() => "data:image/png;base64,AAA");
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
        const { exportUtils } = await import(modPath);

        // Open settings modal
        exportUtils.showImgurAccountManager();
        const overlay1 = document.querySelector(".imgur-account-manager-modal")?.parentElement as HTMLElement;
        expect(overlay1).toBeTruthy();

        const reg = (globalThis as any).__vitest_manual_mocks__ as Map<string, any>;
        const notify = reg.get("/utils/ui/notifications/showNotification.js").showNotification as any;

        // Save configuration
        const input = overlay1.querySelector("#imgur-client-id") as HTMLInputElement;
        input.value = "my-client-123";
        (overlay1.querySelector("#save-imgur-config") as HTMLButtonElement).click();
        expect(localStorage.getItem("imgur_client_id")).toBe("my-client-123");
        expect(notify).toHaveBeenCalledWith("Imgur configuration saved", "success");
        // Status should show configured
        expect((overlay1.querySelector("#imgur-status") as HTMLElement).textContent).toMatch(/Configured/);

        // Open setup guide (closes current overlay and opens guide)
        (overlay1.querySelector("#imgur-setup-guide") as HTMLButtonElement).click();
        expect(document.querySelector(".imgur-account-manager-modal")).toBeNull();
        // Guide should exist
        expect(document.querySelector("#imgur-guide-close")).toBeTruthy();

        // Back to settings then clear
        (document.querySelector("#imgur-guide-back") as HTMLButtonElement).click();
        const overlay2 = document.querySelector(".imgur-account-manager-modal")?.parentElement as HTMLElement;
        expect(overlay2).toBeTruthy();

        (overlay2.querySelector("#clear-imgur-config") as HTMLButtonElement).click();
        expect(notify).toHaveBeenCalledWith("Imgur configuration cleared", "info");
        // Input resets to default
        expect((overlay2.querySelector("#imgur-client-id") as HTMLInputElement).value).toBe(
            exportUtils.getImgurConfig().clientId
        );
        // Status reflects current configuration logic: default client id is considered configured
        expect((overlay2.querySelector("#imgur-status") as HTMLElement).textContent).toMatch(/Configured/);

        // Close button removes overlay
        (overlay2.querySelector("#imgur-close") as HTMLButtonElement).click();
        expect(document.querySelector(".imgur-account-manager-modal")).toBeNull();

        // Reopen and test ESC
        exportUtils.showImgurAccountManager();
        const overlay3 = document.querySelector(".imgur-account-manager-modal")?.parentElement as HTMLElement;
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(document.querySelector(".imgur-account-manager-modal")).toBeNull();

        // Reopen and test click outside
        exportUtils.showImgurAccountManager();
        const overlay4 = document.querySelector(".imgur-account-manager-modal")?.parentElement as HTMLElement;
        overlay4.click(); // event target is overlay
        expect(document.querySelector(".imgur-account-manager-modal")).toBeNull();
    });

    it("Imgur update status toggles UI", async () => {
        const { exportUtils } = await import(modPath);
        exportUtils.showImgurAccountManager();
        const modal = document.querySelector(".imgur-account-manager-modal") as HTMLElement;
        expect(modal).toBeTruthy();

        // With default client id -> considered configured in current logic
        exportUtils.updateImgurStatus(modal);
        expect((modal.querySelector("#imgur-status") as HTMLElement).textContent).toMatch(/Configured/);

        // Force unconfigured/limited by setting placeholder client id
        exportUtils.setImgurConfig("YOUR_IMGUR_CLIENT_ID");
        exportUtils.updateImgurStatus(modal);
        expect((modal.querySelector("#imgur-status") as HTMLElement).textContent).toMatch(/Default|Limited/);

        // Custom client id -> configured
        exportUtils.setImgurConfig("abc");
        exportUtils.updateImgurStatus(modal);
        expect((modal.querySelector("#imgur-status") as HTMLElement).textContent).toMatch(/Configured/);
        // cleanup
        modal.parentElement?.remove();
    });

    it("Gyazo account manager: save creds, connect, disconnect, clear all, close, ESC and click-outside", async () => {
        const { exportUtils } = await import(modPath);
        const reg = (globalThis as any).__vitest_manual_mocks__ as Map<string, any>;
        const notify = reg.get("/utils/ui/notifications/showNotification.js").showNotification as any;

        // Ensure not authenticated
        localStorage.removeItem("gyazo_access_token");

        // Open modal
        exportUtils.showGyazoAccountManager();
        const overlay1 = document.querySelector(".gyazo-account-manager-modal")?.parentElement as HTMLElement;
        expect(overlay1).toBeTruthy();

        // Save credentials
        (overlay1.querySelector("#gyazo-client-id") as HTMLInputElement).value = "cid";
        (overlay1.querySelector("#gyazo-client-secret") as HTMLInputElement).value = "sec";
        (overlay1.querySelector("#save-credentials") as HTMLButtonElement).click();
        expect(localStorage.getItem("gyazo_client_id")).toBe("cid");
        expect(localStorage.getItem("gyazo_client_secret")).toBe("sec");
        expect(notify).toHaveBeenCalledWith("Gyazo credentials saved successfully!", "success");

        // Connect (mock authenticateWithGyazo and ensure token stored)
        const spyAuth = vi.spyOn(exportUtils, "authenticateWithGyazo").mockImplementation(async () => {
            localStorage.setItem("gyazo_access_token", "tok");
            return "tok" as any;
        });
        await (overlay1.querySelector("#gyazo-connect") as HTMLButtonElement).click();
        expect(spyAuth).toHaveBeenCalled();
        // Status updated to connected (disconnect visible)
        expect((overlay1.querySelector("#gyazo-disconnect") as HTMLElement).style.display).toBe("block");
        expect(notify).toHaveBeenCalledWith("Gyazo account connected successfully!", "success");

        // Disconnect
        (overlay1.querySelector("#gyazo-disconnect") as HTMLButtonElement).click();
        expect(localStorage.getItem("gyazo_access_token")).toBeNull();
        expect(notify).toHaveBeenCalledWith("Gyazo account disconnected", "info");

        // Clear all data (confirm=true)
        const oldConfirm = (globalThis as any).confirm;
        (globalThis as any).confirm = () => true;
        (overlay1.querySelector("#clear-all-data") as HTMLButtonElement).click();
        expect(document.querySelector(".gyazo-account-manager-modal")).toBeNull();
        (globalThis as any).confirm = oldConfirm;

        // Reopen then close button
        exportUtils.showGyazoAccountManager();
        const overlay2 = document.querySelector(".gyazo-account-manager-modal")?.parentElement as HTMLElement;
        (overlay2.querySelector("#gyazo-close") as HTMLButtonElement).click();
        expect(document.querySelector(".gyazo-account-manager-modal")).toBeNull();

        // ESC
        exportUtils.showGyazoAccountManager();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(document.querySelector(".gyazo-account-manager-modal")).toBeNull();

        // Click outside
        exportUtils.showGyazoAccountManager();
        const overlay3 = document.querySelector(".gyazo-account-manager-modal")?.parentElement as HTMLElement;
        overlay3.click();
        expect(document.querySelector(".gyazo-account-manager-modal")).toBeNull();
    });

    it("createGyazoAuthModal: manual mode completes with code and can cancel/esc/click-outside", async () => {
        const { exportUtils } = await import(modPath);
        const reg = (globalThis as any).__vitest_manual_mocks__ as Map<string, any>;
        const notify = reg.get("/utils/ui/notifications/showNotification.js").showNotification as any;

        const resolveSpy = vi.fn();
        const rejectSpy = vi.fn();

        // Mock exchange function to return token
        const spyExchange = vi
            .spyOn(exportUtils, "exchangeGyazoCodeForToken")
            .mockResolvedValue({ access_token: "tok" } as any);

        const overlay = exportUtils.createGyazoAuthModal("http://auth", "state", resolveSpy, rejectSpy, false);
        document.body.append(overlay);
        const input = overlay.querySelector("#gyazo-auth-code") as HTMLInputElement;
        input.value = "code123";
        (overlay.querySelector("#gyazo-complete-auth") as HTMLButtonElement).click();

        // Wait microtask queue
        await Promise.resolve();

        expect(spyExchange).toHaveBeenCalled();
        expect(localStorage.getItem("gyazo_access_token")).toBe("tok");
        expect(resolveSpy).toHaveBeenCalledWith("tok");
        expect(notify).toHaveBeenCalledWith("Gyazo authentication successful!", "success");

        // Recreate and test cancel
        const resolve2 = vi.fn();
        const reject2 = vi.fn();
        const overlay2 = exportUtils.createGyazoAuthModal("http://auth", "state", resolve2, reject2, false);
        document.body.append(overlay2);
        (overlay2.querySelector("#gyazo-cancel-auth") as HTMLButtonElement).click();
        expect(reject2).toHaveBeenCalled();

        // ESC
        const resolve3 = vi.fn();
        const reject3 = vi.fn();
        const overlay3 = exportUtils.createGyazoAuthModal("http://auth", "state", resolve3, reject3, false);
        document.body.append(overlay3);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(reject3).toHaveBeenCalled();

        // Click outside
        const resolve4 = vi.fn();
        const reject4 = vi.fn();
        const overlay4 = exportUtils.createGyazoAuthModal("http://auth", "state", resolve4, reject4, false);
        document.body.append(overlay4);
        overlay4.click();
        expect(reject4).toHaveBeenCalled();
    });

    it("createGyazoAuthModal: server mode stops server on cancel/esc/click-outside", async () => {
        const { exportUtils } = await import(modPath);
        (globalThis as any).electronAPI = {
            stopGyazoServer: vi.fn().mockResolvedValue(undefined),
        };

        const overlay = exportUtils.createGyazoAuthModal("http://auth", "state", vi.fn(), vi.fn(), true);
        document.body.append(overlay);
        (overlay.querySelector("#gyazo-cancel-auth") as HTMLButtonElement).click();
        expect((globalThis as any).electronAPI.stopGyazoServer).toHaveBeenCalled();

        // ESC
        const overlay2 = exportUtils.createGyazoAuthModal("http://auth", "state", vi.fn(), vi.fn(), true);
        document.body.append(overlay2);
        const beforeEscCalls = ((globalThis as any).electronAPI.stopGyazoServer as any).mock.calls.length;
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        // ESC may trigger multiple listeners (from current and prior modals); ensure it increases by at least 1
        expect(((globalThis as any).electronAPI.stopGyazoServer as any).mock.calls.length).toBeGreaterThanOrEqual(
            beforeEscCalls + 1
        );

        // Click outside
        const overlay3 = exportUtils.createGyazoAuthModal("http://auth", "state", vi.fn(), vi.fn(), true);
        document.body.append(overlay3);
        const beforeClickCalls = ((globalThis as any).electronAPI.stopGyazoServer as any).mock.calls.length;
        overlay3.click();
        expect(((globalThis as any).electronAPI.stopGyazoServer as any).mock.calls.length).toBeGreaterThanOrEqual(
            beforeClickCalls + 1
        );
    });
});
