import {
    getRendererApplicationLifecycleWiringRuntime,
    type RendererApplicationLifecycleWiringRuntime,
} from "./applicationLifecycleWiringRuntime.js";
import type { RendererSetTimeout } from "./runtimeEnvironment.js";

type RendererApplicationLifecycleDocument = Pick<
    Document,
    "addEventListener" | "readyState"
>;

type RendererApplicationLifecycleEventTarget = Pick<
    EventTarget,
    "addEventListener"
>;

type RendererApplicationLifecycleOptions = {
    readonly cleanup: () => void;
    readonly documentTarget: RendererApplicationLifecycleDocument;
    readonly initializeApplication: () => Promise<void>;
    readonly rendererEventTarget: RendererApplicationLifecycleEventTarget;
    readonly runtime?: RendererApplicationLifecycleWiringRuntime | undefined;
    readonly setTimeout: RendererSetTimeout;
};

export function registerRendererApplicationLifecycle(
    options: RendererApplicationLifecycleOptions
): void {
    const runtime =
        options.runtime ?? getRendererApplicationLifecycleWiringRuntime();
    const abortController = runtime.createAbortController();
    const { signal } = abortController;
    const onBeforeUnload = (): void => {
        options.cleanup();
        abortController.abort();
    };

    const onApplicationReady = (): void => {
        void options.initializeApplication();
    };

    options.rendererEventTarget.addEventListener(
        "beforeunload",
        onBeforeUnload,
        { signal }
    );
    options.documentTarget.addEventListener(
        "DOMContentLoaded",
        onApplicationReady,
        { signal }
    );
    if (options.documentTarget.readyState !== "loading") {
        options.setTimeout(onApplicationReady, 0);
    }
}
