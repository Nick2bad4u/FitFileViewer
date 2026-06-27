import {
    getState,
    setState,
    subscribe,
    subscribeSingleton,
} from "../core/stateManager.js";

export type RendererStateGetter = (path?: string) => unknown;
export type RendererStateSetter = (
    path: string,
    value: unknown,
    options?: {
        readonly merge?: boolean;
        readonly silent?: boolean;
        readonly source?: string;
    }
) => void;
export type RendererStateSubscriber = (
    path: string,
    callback: (newValue: unknown, oldValue?: unknown, path?: string) => void
) => unknown;
export type RendererStateSubscribeSingleton = (
    path: string,
    key: string,
    callback: (newValue: unknown, oldValue?: unknown, path?: string) => void
) => unknown;

export type RendererStateManagerAccess = {
    getState: RendererStateGetter;
    setState: RendererStateSetter;
    subscribe: RendererStateSubscriber;
};

type RendererStateManagerCandidate = Partial<RendererStateManagerAccess>;

export function getRendererCoreStateManager():
    | RendererStateManagerAccess
    | undefined {
    return toRendererStateManagerAccess({
        getState,
        setState,
        subscribe,
    });
}

export function getRendererCoreSubscribeSingleton():
    | RendererStateSubscribeSingleton
    | undefined {
    return subscribeSingleton;
}

export function getRequiredRendererCoreStateManager(): RendererStateManagerAccess {
    return {
        getState,
        setState,
        subscribe,
    };
}

export function toRendererStateManagerAccess(
    candidate: unknown
): RendererStateManagerAccess | undefined {
    if (candidate === null || typeof candidate !== "object") {
        return undefined;
    }

    const stateManager = candidate as RendererStateManagerCandidate;
    const { getState, setState, subscribe } = stateManager;

    return typeof getState === "function" &&
        typeof setState === "function" &&
        typeof subscribe === "function"
        ? { getState, setState, subscribe }
        : undefined;
}
