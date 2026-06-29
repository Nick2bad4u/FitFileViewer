import { fileURLToPath } from "node:url";
import {
    getIpcSenderPolicyRuntime,
    type IpcSenderPolicyRuntime,
    type IpcSenderPolicyProcessStringName,
} from "./ipcSenderPolicyRuntime.js";
import { path } from "../runtime/nodeModules.js";

interface IpcEventLike {
    sender?: {
        getURL?: () => string;
    };
    senderFrame?: {
        url?: string;
    };
}

function ipcSenderPolicyRuntime(): IpcSenderPolicyRuntime {
    return getIpcSenderPolicyRuntime();
}

export function assertIpcSenderAllowed(event: unknown): void {
    const senderUrl = getIpcSenderUrl(event);
    if (!senderUrl) {
        if (isTestMode()) {
            return;
        }
        throw new Error("IPC sender URL unavailable");
    }

    if (!isAllowedIpcSenderUrl(senderUrl)) {
        throw new Error("IPC sender is not allowed");
    }
}

export function getIpcSenderUrl(event: unknown): string | null {
    const ipcEvent = asIpcEventLike(event);
    const frameUrl = ipcEvent?.senderFrame?.url;
    if (typeof frameUrl === "string" && frameUrl.trim().length > 0) {
        return frameUrl;
    }

    const getURL = ipcEvent?.sender?.getURL;
    if (typeof getURL !== "function") {
        return null;
    }

    try {
        const senderUrl = getURL();
        return typeof senderUrl === "string" && senderUrl.trim().length > 0
            ? senderUrl
            : null;
    } catch {
        return null;
    }
}

function asIpcEventLike(event: unknown): IpcEventLike | null {
    return event && typeof event === "object" ? event : null;
}

export function isAllowedIpcSenderUrl(senderUrl: string): boolean {
    let parsed: URL;
    try {
        parsed = new URL(senderUrl);
    } catch {
        return false;
    }

    if (parsed.protocol !== "file:") {
        return false;
    }

    let senderPath: string;
    try {
        senderPath = fileURLToPath(parsed);
    } catch {
        return false;
    }

    return getAllowedAppRoots().some((root) =>
        isPathWithinRoot(senderPath, root)
    );
}

function getAllowedAppRoots(): string[] {
    const roots: string[] = [];

    try {
        const appPath = ipcSenderPolicyRuntime().appRef()?.getAppPath?.();
        if (typeof appPath === "string" && appPath.trim().length > 0) {
            roots.push(appPath);
        }
    } catch {
        /* ignore */
    }

    const resourcesPath = getProcessStringValue("resourcesPath");
    if (resourcesPath && resourcesPath.trim().length > 0) {
        roots.push(resourcesPath);
    }

    roots.push(path.resolve(__dirname, "..", ".."));

    return [...new Set(roots.map((root) => normalizePath(root)))];
}

function isPathWithinRoot(candidatePath: string, rootPath: string): boolean {
    const candidate = normalizePath(candidatePath);
    const root = normalizePath(rootPath);
    const relative = path.relative(root, candidate);

    return (
        relative === "" ||
        (!relative.startsWith("..") && !path.isAbsolute(relative))
    );
}

function normalizePath(filePath: string): string {
    const resolved = path.resolve(filePath);
    return getProcessStringValue("platform") === "win32"
        ? resolved.toLowerCase()
        : resolved;
}

function isTestMode(): boolean {
    return ipcSenderPolicyRuntime().isTestEnvironment();
}

function getProcessStringValue(
    name: IpcSenderPolicyProcessStringName
): string | undefined {
    return ipcSenderPolicyRuntime().getProcessStringValue(name);
}
