import type { RendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";

export type ListenForThemeChange = (
    onThemeChange: (theme: string) => void,
    options?: { electronApiScope?: RendererElectronApiScope | undefined }
) => void;

export type ShowNotification = (
    message: string,
    type?: string,
    timeout?: number
) => Promise<void> | void;

export type ShowUpdateNotification = (
    message: string,
    type?: string,
    duration?: number,
    withAction?: boolean | string
) => void;
