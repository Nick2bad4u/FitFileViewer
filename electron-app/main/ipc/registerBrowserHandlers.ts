import {
    validateFitBrowserRelativePath,
    validateFitBrowserRootFolderPath,
} from "../../shared/fitBrowserPathPolicy.js";
import { createElectronConf } from "../runtime/electronConfAccess.js";
import { approveFilePath } from "../security/fileAccessPolicy.js";

type DialogOpenFolderResponse =
    import("../../shared/ipc").DialogOpenFolderResponse;
type FitBrowserEntry = import("../../shared/ipc").FitBrowserEntry;
type FitBrowserEnabledResponse =
    import("../../shared/ipc").FitBrowserEnabledResponse;
type FitBrowserGetFolderResponse =
    import("../../shared/ipc").FitBrowserGetFolderResponse;
type FitBrowserInvokeChannel =
    import("../../shared/ipc").FitBrowserInvokeChannel;
type FitBrowserListFolderRequest =
    import("../../shared/ipc").FitBrowserListFolderRequest;
type FitBrowserListFolderResponse =
    import("../../shared/ipc").FitBrowserListFolderResponse;
type FitBrowserResponsePayload =
    import("../../shared/ipc").FitBrowserResponsePayload;
type FitBrowserSetEnabledRequest =
    import("../../shared/ipc").FitBrowserSetEnabledRequest;
type FitBrowserSetFolderRequest =
    import("../../shared/ipc").FitBrowserSetFolderRequest;
type FitBrowserSetFolderResponse =
    import("../../shared/ipc").FitBrowserSetFolderResponse;
type OpenDialogOptions = import("electron").OpenDialogOptions;
type OpenDialogReturnValue = import("electron").OpenDialogReturnValue;

interface DialogApi {
    showOpenDialog: (
        options: OpenDialogOptions
    ) => Promise<OpenDialogReturnValue>;
}

interface StatLike {
    isDirectory: () => boolean;
}

interface DirentLike {
    isDirectory?: () => boolean;
    isFile?: () => boolean;
    name?: unknown;
}

interface FsApi {
    promises?: {
        readdir?: (
            folder: string,
            options: { withFileTypes: true }
        ) => Promise<DirentLike[]>;
        stat?: (path: string) => Promise<StatLike>;
    };
}

interface PathApi {
    isAbsolute: (path: string) => boolean;
    resolve: (...paths: string[]) => string;
    sep: string;
}

interface BrowserConstants {
    SETTINGS_CONFIG_NAME: string;
}

type BrowserConfValue = boolean | string | null;

interface BrowserConfStore {
    get: (key: string, fallback?: BrowserConfValue) => BrowserConfValue;
    set: (key: string, value: boolean | string) => void;
}

interface BrowserConfModule {
    Conf: new (options: { name: string }) => BrowserConfStore;
}

interface ValidateFolderOptions {
    approveFolder?: boolean;
    requireTrustedFolder?: boolean;
}

type RegisterBrowserIpcHandler = (
    event: unknown,
    ...args: unknown[]
) => FitBrowserResponsePayload | Promise<FitBrowserResponsePayload>;

type RegisterBrowserIpcHandle = (
    channel: FitBrowserInvokeChannel,
    handler: RegisterBrowserIpcHandler
) => void;

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;
type ReaddirFunction = NonNullable<NonNullable<FsApi["promises"]>["readdir"]>;
type StatFunction = NonNullable<NonNullable<FsApi["promises"]>["stat"]>;

interface BrowserDirectoryApis {
    readdir: ReaddirFunction;
    stat: StatFunction;
}

interface BrowserEntryParams {
    baseRel: string;
    dirent: DirentLike;
    logWithContext: LogWithContext | undefined;
    path: PathApi;
    root: string;
}

interface BrowserListParams {
    abs: string;
    apis: BrowserDirectoryApis;
    listRelPath: string;
    logWithContext: LogWithContext | undefined;
    path: PathApi;
    root: string;
}

interface RegisterBrowserHandlersOptions {
    CONSTANTS: BrowserConstants;
    confModule?: BrowserConfModule;
    dialogRef: () => DialogApi | null | undefined;
    fs: FsApi | null | undefined;
    logWithContext?: LogWithContext;
    path: PathApi;
    registerIpcHandle: RegisterBrowserIpcHandle;
}

const CONF_KEY_ENABLED = "fitBrowser.enabled";
const CONF_KEY_ROOT_FOLDER = "fitBrowser.rootFolder";
const CONF_KEY_ROOT_FOLDER_MODE = "fitBrowser.rootFolderMode";
const APPROVED_BROWSER_FOLDER_KEYS = new Set<string>();

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

function normalizeAbsoluteFolder(
    value: unknown,
    path: Pick<PathApi, "isAbsolute">
): string | null {
    let folder: string;
    try {
        folder = validateFitBrowserRootFolderPath(value);
    } catch {
        return null;
    }
    return path.isAbsolute(folder) ? folder : null;
}

function createBrowserListResponse(
    root: FitBrowserGetFolderResponse,
    relPath = "",
    entries: FitBrowserEntry[] = []
): FitBrowserListFolderResponse {
    return { entries, relPath, root };
}

function getBrowserDirectoryApis(
    fs: FsApi | null | undefined
): BrowserDirectoryApis | null {
    const readdir = fs?.promises?.readdir;
    const stat = fs?.promises?.stat;
    return typeof readdir === "function" && typeof stat === "function"
        ? { readdir, stat }
        : null;
}

async function isReadableDirectory(
    abs: string,
    stat: StatFunction
): Promise<boolean> {
    const s = await stat(abs);
    return Boolean(s && typeof s.isDirectory === "function" && s.isDirectory());
}

function createBrowserEntryFromDirent({
    baseRel,
    dirent,
    logWithContext,
    path,
    root,
}: BrowserEntryParams): FitBrowserEntry | null {
    const name = dirent && typeof dirent.name === "string" ? dirent.name : "";
    if (!name || name === "." || name === "..") {
        return null;
    }

    const childRel = baseRel ? `${baseRel}/${name}` : name;
    const childAbs = resolveWithinRoot(root, childRel, path);
    if (!childAbs) {
        return null;
    }

    if (typeof dirent.isDirectory === "function" && dirent.isDirectory()) {
        return {
            fullPath: childAbs,
            kind: "dir",
            name,
            relPath: childRel,
        };
    }

    if (typeof dirent.isFile !== "function" || !dirent.isFile()) {
        return null;
    }

    const lower = name.toLowerCase();
    if (!lower.endsWith(".fit")) {
        return null;
    }

    // Approve the file for subsequent readFile() use.
    try {
        approveFilePath(childAbs);
    } catch (error) {
        logWithContext?.("warn", "Failed to approve FIT file for browser", {
            error: getErrorMessage(error),
            filePath: childAbs,
        });
    }

    return {
        fullPath: childAbs,
        kind: "file",
        name,
        relPath: childRel,
    };
}

async function listBrowserFolderEntries({
    abs,
    apis,
    listRelPath,
    logWithContext,
    path,
    root,
}: BrowserListParams): Promise<FitBrowserListFolderResponse> {
    if (!(await isReadableDirectory(abs, apis.stat))) {
        return createBrowserListResponse(root);
    }

    const out: FitBrowserEntry[] = [];
    const dirents = await apis.readdir(abs, { withFileTypes: true });
    const baseRel = listRelPath
        .trim()
        .replaceAll("\\", "/")
        .replace(/^\/+/, "");

    for (const dirent of dirents) {
        const entry = createBrowserEntryFromDirent({
            baseRel,
            dirent,
            logWithContext,
            path,
            root,
        });
        if (entry) {
            out.push(entry);
        }
    }

    out.sort((a, b) => {
        if (a.kind !== b.kind) {
            return a.kind === "dir" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    // Hard cap to avoid renderer-driven perf issues.
    return {
        entries: out.slice(0, 500),
        relPath: baseRel,
        root,
    };
}

/**
 * IPC handlers for the built-in FIT file browser tab.
 */
export function registerBrowserHandlers({
    registerIpcHandle,
    dialogRef,
    fs,
    path,
    CONSTANTS,
    logWithContext,
    confModule,
}: RegisterBrowserHandlersOptions): void {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    const tryGetConf = (): BrowserConfStore | null => {
        try {
            if (confModule) {
                const { Conf } = confModule;
                return new Conf({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
            }
            return createElectronConf<BrowserConfStore>({
                name: CONSTANTS.SETTINGS_CONFIG_NAME,
            });
        } catch (error) {
            logWithContext?.(
                "warn",
                "Failed to initialize electron-conf for fitBrowser",
                {
                    error: getErrorMessage(error),
                }
            );
            return null;
        }
    };

    const readRootFolder = (): FitBrowserGetFolderResponse => {
        const conf = tryGetConf();
        if (!conf) {
            return null;
        }
        return normalizeAbsoluteFolder(
            conf.get(CONF_KEY_ROOT_FOLDER, null),
            path
        );
    };

    const readEnabled = (): FitBrowserEnabledResponse => {
        const conf = tryGetConf();
        if (!conf) {
            return true;
        }
        const value = conf.get(CONF_KEY_ENABLED, true);
        return value === true;
    };

    const writeRootFolder = (folder: string): void => {
        const conf = tryGetConf();
        if (!conf) {
            return;
        }
        try {
            conf.set(CONF_KEY_ROOT_FOLDER, folder);
        } catch (error) {
            logWithContext?.(
                "warn",
                "Failed to persist fitBrowser root folder",
                {
                    error: getErrorMessage(error),
                }
            );
        }
    };

    const writeRootFolderMode = (mode: "auto" | "manual"): void => {
        const conf = tryGetConf();
        if (!conf) {
            return;
        }
        const normalized = mode === "manual" ? "manual" : "auto";
        try {
            conf.set(CONF_KEY_ROOT_FOLDER_MODE, normalized);
        } catch (error) {
            logWithContext?.(
                "warn",
                "Failed to persist fitBrowser root folder mode",
                {
                    error: getErrorMessage(error),
                }
            );
        }
    };

    const writeEnabled = (enabled: boolean): void => {
        const conf = tryGetConf();
        if (!conf) {
            return;
        }
        try {
            conf.set(CONF_KEY_ENABLED, enabled);
        } catch (error) {
            logWithContext?.(
                "warn",
                "Failed to persist fitBrowser enabled flag",
                {
                    error: getErrorMessage(error),
                }
            );
        }
    };

    const validateAndPersistFolder = async (
        folder: string,
        options: ValidateFolderOptions = {}
    ): Promise<FitBrowserSetFolderResponse> => {
        const normalized = normalizeAbsoluteFolder(folder, path);
        if (!normalized) {
            return false;
        }

        const stat = fs?.promises?.stat;
        if (typeof stat !== "function") {
            return false;
        }

        try {
            const s = await stat(normalized);
            if (!s || typeof s.isDirectory !== "function" || !s.isDirectory()) {
                return false;
            }

            if (
                options.requireTrustedFolder &&
                !isTrustedBrowserFolder(normalized)
            ) {
                return false;
            }

            if (options.approveFolder) {
                approveBrowserFolder(normalized, path);
            }

            writeRootFolder(normalized);
            // Any explicit folder change is considered a manual selection.
            writeRootFolderMode("manual");
            return true;
        } catch {
            return false;
        }
    };

    registerIpcHandle(
        "browser:isEnabled",
        (): FitBrowserEnabledResponse => readEnabled()
    );

    registerIpcHandle(
        "browser:setEnabled",
        (_event, enabled: unknown): FitBrowserEnabledResponse => {
            const requestedEnabled: FitBrowserSetEnabledRequest =
                enabled === true;
            writeEnabled(requestedEnabled);
            return readEnabled();
        }
    );

    registerIpcHandle(
        "browser:getFolder",
        (): FitBrowserGetFolderResponse => readRootFolder()
    );

    registerIpcHandle(
        "browser:setFolder",
        async (
            _event,
            folder: unknown
        ): Promise<FitBrowserSetFolderResponse> => {
            const folderPath: FitBrowserSetFolderRequest =
                typeof folder === "string" ? folder : "";
            return validateAndPersistFolder(folderPath, {
                requireTrustedFolder: true,
            });
        }
    );

    registerIpcHandle(
        "dialog:openFolder",
        async (): Promise<DialogOpenFolderResponse> => {
            const dialog = typeof dialogRef === "function" ? dialogRef() : null;
            if (!dialog || typeof dialog.showOpenDialog !== "function") {
                return null;
            }

            const result = await dialog.showOpenDialog({
                properties: ["openDirectory"],
                title: "Select FIT Files Folder",
            });

            if (
                !result ||
                result.canceled ||
                !Array.isArray(result.filePaths) ||
                result.filePaths.length === 0
            ) {
                return null;
            }

            const folder = normalizeAbsoluteFolder(result.filePaths[0], path);
            if (!folder) {
                return null;
            }

            const persisted = await validateAndPersistFolder(folder, {
                approveFolder: true,
            });
            return persisted ? folder : null;
        }
    );

    registerIpcHandle(
        "browser:listFolder",
        async (
            _event,
            relPath: unknown = ""
        ): Promise<FitBrowserListFolderResponse> => {
            if (!readEnabled()) {
                return createBrowserListResponse(readRootFolder());
            }
            const root = readRootFolder();
            if (!root) {
                return createBrowserListResponse(root);
            }

            let listRelPath: FitBrowserListFolderRequest;
            try {
                listRelPath = validateFitBrowserRelativePath(relPath);
            } catch {
                return createBrowserListResponse(root);
            }

            const abs = resolveWithinRoot(root, listRelPath, path);
            if (!abs) {
                return createBrowserListResponse(root);
            }

            const apis = getBrowserDirectoryApis(fs);
            if (!apis) {
                return createBrowserListResponse(root);
            }

            try {
                return await listBrowserFolderEntries({
                    abs,
                    apis,
                    listRelPath,
                    logWithContext,
                    path,
                    root,
                });
            } catch (error) {
                logWithContext?.("warn", "Failed to list fitBrowser folder", {
                    error: getErrorMessage(error),
                    relPath,
                    root,
                });
                return createBrowserListResponse(root);
            }
        }
    );

    function isTrustedBrowserFolder(folder: string): boolean {
        if (isApprovedBrowserFolder(folder, path)) {
            return true;
        }

        const currentRoot = readRootFolder();
        return (
            typeof currentRoot === "string" &&
            getBrowserFolderKey(currentRoot, path) ===
                getBrowserFolderKey(folder, path)
        );
    }
}

function approveBrowserFolder(
    folder: string,
    path: Pick<PathApi, "resolve">
): void {
    APPROVED_BROWSER_FOLDER_KEYS.add(getBrowserFolderKey(folder, path));
}

function isApprovedBrowserFolder(
    folder: string,
    path: Pick<PathApi, "resolve">
): boolean {
    return APPROVED_BROWSER_FOLDER_KEYS.has(getBrowserFolderKey(folder, path));
}

function getBrowserFolderKey(
    folder: string,
    path: Pick<PathApi, "resolve">
): string {
    const resolved = path.resolve(folder);
    return isWindowsStylePath(resolved) ? resolved.toLowerCase() : resolved;
}

function isWindowsStylePath(folder: string): boolean {
    return /^[A-Za-z]:[/\\]/u.test(folder) || /^[/\\]{2}/u.test(folder);
}

function resolveWithinRoot(
    root: string,
    rel: unknown,
    path: Pick<PathApi, "resolve" | "sep">
): string | null {
    const safeRel = typeof rel === "string" ? rel.trim() : "";
    if (!safeRel) {
        return path.resolve(root);
    }

    const normalized = safeRel.replaceAll("\\", "/").replace(/^\/+/, "");
    const parts = normalized.split("/").filter((p) => p.length > 0);

    if (parts.some((p) => p === "." || p === "..")) {
        return null;
    }

    const abs = path.resolve(root, ...parts);
    const rootAbs = path.resolve(root);
    const rootPrefix = rootAbs.endsWith(path.sep)
        ? rootAbs
        : `${rootAbs}${path.sep}`;

    if (abs !== rootAbs && !abs.startsWith(rootPrefix)) {
        return null;
    }

    return abs;
}
