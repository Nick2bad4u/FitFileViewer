import { ensureRendererVendorBundle } from "./vendorBundleLoader.js";
import { setupFullscreenListeners } from "../utils/ui/controls/addFullScreenButton.js";

export interface MainUiVendorStartupOptions {
    readonly logMainUi: (
        level: "warn",
        message: string,
        ...args: unknown[]
    ) => void;
}

export async function initializeMainUiVendorStartup({
    logMainUi,
}: MainUiVendorStartupOptions): Promise<void> {
    try {
        await ensureRendererVendorBundle("core");
    } catch (error: unknown) {
        logMainUi("warn", "[main-ui] Core vendor bundle failed to load", error);
    } finally {
        setupFullscreenListeners();
    }
}
