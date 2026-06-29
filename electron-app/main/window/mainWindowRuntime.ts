import {
    appRef as electronAppRef,
    browserWindowRef as electronBrowserWindowRef,
} from "../runtime/electronAccess.js";
import { isTestEnvironment as isRuntimeTestEnvironment } from "../../utils/runtime/processEnvironment.js";

type MainWindowRuntimeProvider<T> = T | undefined;

export interface MainWindowRuntimeWindowLike {
    isDestroyed?: () => boolean;
}

export interface MainWindowRuntimeAppLike {
    whenReady?: () => unknown;
}

export interface MainWindowRuntimeBrowserWindowApi<
    TWindow extends MainWindowRuntimeWindowLike,
> {
    getAllWindows?: () => TWindow[];
    getFocusedWindow?: () => null | TWindow | undefined;
}

export interface MainWindowRuntimeScope {
    readonly appRef: MainWindowRuntimeProvider<
        () => MainWindowRuntimeAppLike | undefined
    >;
    readonly browserWindowRef: MainWindowRuntimeProvider<
        () =>
            | MainWindowRuntimeBrowserWindowApi<MainWindowRuntimeWindowLike>
            | undefined
    >;
    readonly isTestEnvironment: MainWindowRuntimeProvider<() => boolean>;
}

export interface MainWindowRuntime {
    readonly appRef: () => MainWindowRuntimeAppLike | undefined;
    readonly browserWindowRef: () =>
        | MainWindowRuntimeBrowserWindowApi<MainWindowRuntimeWindowLike>
        | undefined;
    readonly isTestEnvironment: () => boolean;
}

const defaultMainWindowRuntimeScope: MainWindowRuntimeScope = {
    appRef: defaultAppRef,
    browserWindowRef: defaultBrowserWindowRef,
    isTestEnvironment: isRuntimeTestEnvironment,
};

function defaultAppRef(): MainWindowRuntimeAppLike | undefined {
    return electronAppRef();
}

function defaultBrowserWindowRef():
    | MainWindowRuntimeBrowserWindowApi<MainWindowRuntimeWindowLike>
    | undefined {
    const candidate: unknown = electronBrowserWindowRef();
    return isBrowserWindowApi(candidate) ? candidate : undefined;
}

function isBrowserWindowApi(
    candidate: unknown
): candidate is MainWindowRuntimeBrowserWindowApi<MainWindowRuntimeWindowLike> {
    return (
        candidate !== null &&
        (typeof candidate === "object" || typeof candidate === "function")
    );
}

function getRequiredProvider<T>(
    provider: MainWindowRuntimeProvider<T>,
    providerName: string
): T {
    if (typeof provider === "function") {
        return provider;
    }

    throw new TypeError(`mainWindowRuntime requires ${providerName} provider`);
}

export function getMainWindowRuntime(
    scope: MainWindowRuntimeScope = defaultMainWindowRuntimeScope
): MainWindowRuntime {
    return {
        appRef(): MainWindowRuntimeAppLike | undefined {
            return getRequiredProvider(scope.appRef, "appRef")();
        },
        browserWindowRef():
            | MainWindowRuntimeBrowserWindowApi<MainWindowRuntimeWindowLike>
            | undefined {
            return getRequiredProvider(
                scope.browserWindowRef,
                "browserWindowRef"
            )();
        },
        isTestEnvironment(): boolean {
            return getRequiredProvider(
                scope.isTestEnvironment,
                "testEnvironment"
            )();
        },
    };
}
