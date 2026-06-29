import { describe, expect, it, vi } from "vitest";

type CleanupFunction = () => void;

type AttachExternalLinkHandlersOptions = {
    readonly onOpenExternalError?: (url: string, error: Error) => void;
    readonly root: EventTarget | null | undefined;
};

const mocks = vi.hoisted(() => ({
    attachExternalLinkHandlers:
        vi.fn<
            (options: AttachExternalLinkHandlersOptions) => CleanupFunction
        >(),
    showNotification:
        vi.fn<(message: string, type?: string) => Promise<void>>(),
}));

vi.mock(
    import("../../../../electron-app/utils/ui/links/externalLinkHandlers.js"),
    () => ({
        attachExternalLinkHandlers: mocks.attachExternalLinkHandlers,
    })
);

vi.mock(
    import("../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mocks.showNotification,
    })
);

const { setupExternalLinkHandlers } =
    await import("../../../../electron-app/utils/ui/setupExternalLinkHandlers.js");

function resetExternalLinkHandlerMocks(): CleanupFunction {
    const cleanup = vi.fn<CleanupFunction>();

    mocks.attachExternalLinkHandlers.mockReset();
    mocks.attachExternalLinkHandlers.mockReturnValue(cleanup);
    mocks.showNotification.mockReset();
    mocks.showNotification.mockResolvedValue(undefined);

    return cleanup;
}

describe(setupExternalLinkHandlers, () => {
    it("cleans up existing handlers before attaching document-level handlers", () => {
        expect.assertions(5);

        const nextCleanup = resetExternalLinkHandlerMocks();
        const root =
            document.implementation.createHTMLDocument("external link root");
        let cleanedPrevious = false;
        let installedCleanup: CleanupFunction | null = null;
        const previousCleanup = (): void => {
            cleanedPrevious = true;
        };
        const setCleanup = (cleanup: CleanupFunction | null): void => {
            installedCleanup = cleanup;
        };

        setupExternalLinkHandlers({
            cleanupExternalLinkHandlers: previousCleanup,
            root,
            setCleanup,
        });

        expect({ cleanedPrevious }).toStrictEqual({ cleanedPrevious: true });
        expect(installedCleanup).toBe(nextCleanup);
        expect(mocks.attachExternalLinkHandlers).toHaveBeenCalledOnce();
        const [attachOptions] = mocks.attachExternalLinkHandlers.mock
            .calls[0] as [AttachExternalLinkHandlersOptions];
        expect(attachOptions).toStrictEqual({
            onOpenExternalError: attachOptions.onOpenExternalError,
            root,
        });
        expect(attachOptions.onOpenExternalError).toBeTypeOf("function");
    });

    it("continues attaching handlers when a stale cleanup callback throws", () => {
        expect.assertions(2);

        const nextCleanup = resetExternalLinkHandlerMocks();
        let installedCleanup: CleanupFunction | null = null;
        const previousCleanup = (): void => {
            throw new Error("already detached");
        };
        const setCleanup = (cleanup: CleanupFunction | null): void => {
            installedCleanup = cleanup;
        };

        setupExternalLinkHandlers({
            cleanupExternalLinkHandlers: previousCleanup,
            root: document,
            setCleanup,
        });

        expect(installedCleanup).toBe(nextCleanup);
        expect(mocks.attachExternalLinkHandlers).toHaveBeenCalledOnce();
    });

    it("shows a renderer notification when an external link fails to open", () => {
        expect.assertions(1);

        resetExternalLinkHandlerMocks();
        const shownNotifications: Array<readonly [string, string | undefined]> =
            [];
        let onOpenExternalError:
            | AttachExternalLinkHandlersOptions["onOpenExternalError"]
            | undefined;
        mocks.attachExternalLinkHandlers.mockImplementation((options) => {
            onOpenExternalError = options.onOpenExternalError;
            return vi.fn<CleanupFunction>();
        });
        mocks.showNotification.mockImplementation(async (message, type) => {
            shownNotifications.push([message, type]);
        });

        setupExternalLinkHandlers({
            cleanupExternalLinkHandlers: null,
            root: document,
            setCleanup: vi.fn<(cleanup: CleanupFunction | null) => void>(),
        });
        onOpenExternalError?.(
            "https://example.test",
            new Error("shell denied")
        );

        expect(shownNotifications).toStrictEqual([
            ["Failed to open link in your browser.", "error"],
        ]);
    });
});
