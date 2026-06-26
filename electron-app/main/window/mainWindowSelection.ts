import {
    appRef as electronAppRef,
    browserWindowRef as electronBrowserWindowRef,
} from "../runtime/electronAccess.js";
import { isTestEnvironment } from "../../utils/runtime/processEnvironment.js";

export interface MainWindowSelectionWindowLike {
    isDestroyed?: () => boolean;
}

export interface MainWindowBrowserWindowApi<
    TWindow extends MainWindowSelectionWindowLike,
> {
    getAllWindows?: () => TWindow[];
}

export type MainWindowBrowserWindowConstructor<
    TWindow extends MainWindowSelectionWindowLike,
> = new (...args: never[]) => TWindow;

type ElectronAppLike = {
    whenReady?: () => unknown;
};

const runtimeAppRef = electronAppRef as () => ElectronAppLike | undefined;
const runtimeBrowserWindowRef = electronBrowserWindowRef as () =>
    | MainWindowBrowserWindowApi<MainWindowSelectionWindowLike>
    | undefined;

export function callElectronWhenReadyForTests(): void {
    if (!isTestEnvironment()) {
        return;
    }

    try {
        const app = runtimeAppRef();
        if (app && typeof app.whenReady === "function") {
            try {
                app.whenReady();
            } catch {
                /* Ignore errors */
            }
        }
    } catch {
        /* Ignore errors */
    }
}

function getElectronWindowsForTests<
    TWindow extends MainWindowSelectionWindowLike,
>(): TWindow[] | undefined {
    try {
        const BrowserWindow = runtimeBrowserWindowRef() as
            | MainWindowBrowserWindowApi<TWindow>
            | undefined;
        if (
            BrowserWindow &&
            typeof BrowserWindow.getAllWindows === "function"
        ) {
            try {
                return BrowserWindow.getAllWindows();
            } catch {
                /* Ignore errors */
            }
        }
    } catch {
        /* Ignore errors */
    }

    return undefined;
}

function getWindowsFromBrowserWindowRef<
    TWindow extends MainWindowSelectionWindowLike,
>(
    BrowserWindow:
        | MainWindowBrowserWindowApi<TWindow>
        | MainWindowBrowserWindowConstructor<TWindow>
        | null
        | undefined
): TWindow[] | undefined {
    if (
        BrowserWindow &&
        typeof (BrowserWindow as MainWindowBrowserWindowApi<TWindow>)
            .getAllWindows === "function"
    ) {
        try {
            return (
                BrowserWindow as MainWindowBrowserWindowApi<TWindow>
            ).getAllWindows?.();
        } catch {
            /* Ignore errors */
        }
    }

    return undefined;
}

export function resolveExistingMainWindow<
    TWindow extends MainWindowSelectionWindowLike,
>(
    BrowserWindow:
        | MainWindowBrowserWindowApi<TWindow>
        | MainWindowBrowserWindowConstructor<TWindow>
        | null
        | undefined
): TWindow | undefined {
    let windows = getElectronWindowsForTests<TWindow>();
    if (!windows || windows.length === 0) {
        windows = getWindowsFromBrowserWindowRef(BrowserWindow);
    }

    return Array.isArray(windows) && windows.length > 0
        ? windows[0]
        : undefined;
}
