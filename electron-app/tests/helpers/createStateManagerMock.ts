import type { StateUpdateOptions } from "../../utils/state/core/stateManager.js";

type Listener = (newValue: unknown, oldValue: unknown | undefined, path: string) => void;

type StoredValue = Record<string, unknown> | undefined;

type SubscribeResult = () => void;

interface MutableStore {
    root: Record<string, unknown>;
    listeners: Map<string, Set<Listener>>;
}

interface SetStateArgs {
    path: string;
    value: unknown;
    options?: StateUpdateOptions;
}

const clone = <T>(value: T): T => {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as T;
};

const createEmptyStore = (): MutableStore => ({
    root: {},
    listeners: new Map(),
});

function ensurePlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getByPath(store: StoredValue, path?: string): unknown {
    if (!path || !store) {
        return store;
    }

    const segments = path.split(".").filter(Boolean);
    let cursor: unknown = store;
    for (const segment of segments) {
        if (!ensurePlainObject(cursor)) {
            return undefined;
        }
        cursor = cursor[segment];
    }
    return cursor;
}

function setByPath(store: Record<string, unknown>, path: string, value: unknown, merge?: boolean) {
    const segments = path.split(".").filter(Boolean);
    if (segments.length === 0) {
        if (merge && ensurePlainObject(store) && ensurePlainObject(value)) {
            Object.assign(store, value);
        } else if (ensurePlainObject(value)) {
            for (const key of Object.keys(store)) {
                delete store[key];
            }
            Object.assign(store, value);
        }
        return;
    }

    let cursor: Record<string, unknown> = store;
    for (let index = 0; index < segments.length - 1; index++) {
        const segment = segments[index];
        const next = cursor[segment];
        if (!ensurePlainObject(next)) {
            cursor[segment] = {};
        }
        cursor = cursor[segment] as Record<string, unknown>;
    }

    const finalKey = segments.at(-1) as string;
    if (merge && ensurePlainObject(cursor[finalKey]) && ensurePlainObject(value)) {
        cursor[finalKey] = { ...(cursor[finalKey] as Record<string, unknown>), ...value };
        return;
    }

    cursor[finalKey] = value as never;
}

function notifyListeners(store: MutableStore, path: string, newValue: unknown, oldValue: unknown) {
    const listeners = store.listeners.get(path);
    if (!listeners) {
        return;
    }
    for (const listener of listeners) {
        try {
            listener(newValue, oldValue, path);
        } catch {
            /* noop */
        }
    }
}

export interface StateManagerMock {
    getState(path?: string): unknown;
    setState(path: string, value: unknown, options?: StateUpdateOptions): void;
    updateState(path: string, patch: Record<string, unknown>, options?: StateUpdateOptions): void;
    subscribe(path: string, listener: Listener): SubscribeResult;
    reset(): void;
    snapshot(): Record<string, unknown>;
}

export function createStateManagerMock(initialState: Record<string, unknown> = {}): StateManagerMock {
    const store = createEmptyStore();
    store.root = clone(initialState);

    const setStateInternal = ({ path, value, options }: SetStateArgs) => {
        const prevSnapshot = clone(store.root);
        setByPath(store.root, path, value, options?.merge);
        notifyListeners(store, path, getByPath(store.root, path), getByPath(prevSnapshot, path));
    };

    return {
        getState(path?: string) {
            return typeof path === "string" && path.length > 0 ? getByPath(store.root, path) : store.root;
        },
        setState(path: string, value: unknown, options?: StateUpdateOptions) {
            setStateInternal({ path, value, options });
        },
        updateState(path: string, patch: Record<string, unknown>, options?: StateUpdateOptions) {
            const existingValue = ensurePlainObject(getByPath(store.root, path)) ? (getByPath(store.root, path) as Record<string, unknown>) : {};
            const nextValue = { ...existingValue, ...patch };
            setStateInternal({ path, value: nextValue, options });
        },
        subscribe(path: string, listener: Listener): SubscribeResult {
            const current = store.listeners.get(path) ?? new Set<Listener>();
            current.add(listener);
            store.listeners.set(path, current);
            return () => {
                const listeners = store.listeners.get(path);
                if (!listeners) {
                    return;
                }
                listeners.delete(listener);
                if (listeners.size === 0) {
                    store.listeners.delete(path);
                }
            };
        },
        reset() {
            store.root = {};
            store.listeners.clear();
        },
        snapshot() {
            return clone(store.root);
        },
    };
}
