// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

type RequestDecision = {
    readonly cancel?: boolean;
};

type RequestDetails = {
    readonly url?: unknown;
};

type BeforeRequestListener = (
    details: RequestDetails,
    callback: (decision: RequestDecision) => void
) => void;

type ElectronAccessModule = {
    readonly setElectronOverride: (override: unknown) => void;
};

type SetupBlockedRequestsModule = {
    readonly setupBlockedRequests: () => void;
};

async function importModules(): Promise<{
    readonly electronAccess: ElectronAccessModule;
    readonly setupBlockedRequests: SetupBlockedRequestsModule["setupBlockedRequests"];
}> {
    vi.resetModules();
    const electronAccess = (await import(
        "../../../../electron-app/main/runtime/electronAccess.js"
    )) as ElectronAccessModule;
    const { setupBlockedRequests } = (await import(
        "../../../../electron-app/main/security/setupBlockedRequests.js"
    )) as SetupBlockedRequestsModule;
    return { electronAccess, setupBlockedRequests };
}

function createWebRequestHarness(): {
    readonly emit: (url: unknown) => RequestDecision;
    readonly onBeforeRequest: ReturnType<
        typeof vi.fn<(listener: BeforeRequestListener) => void>
    >;
} {
    let registeredListener: BeforeRequestListener | undefined;
    const onBeforeRequest = vi.fn<(listener: BeforeRequestListener) => void>(
        (listener) => {
            registeredListener = listener;
        }
    );

    return {
        emit: (url) => {
            if (!registeredListener) {
                throw new Error("Expected onBeforeRequest listener");
            }

            let decision: RequestDecision | undefined;
            registeredListener({ url }, (nextDecision) => {
                decision = nextDecision;
            });

            if (!decision) {
                throw new Error("Expected request callback decision");
            }

            return decision;
        },
        onBeforeRequest,
    };
}

describe("setupBlockedRequests", () => {
    it("no-ops when Electron session is unavailable", async () => {
        expect.assertions(1);

        const { electronAccess, setupBlockedRequests } = await importModules();
        electronAccess.setElectronOverride({});

        expect(setupBlockedRequests()).toBeUndefined();
    });

    it("registers a request guard that cancels only blocked hostnames", async () => {
        expect.assertions(3);

        const { electronAccess, setupBlockedRequests } = await importModules();
        const webRequest = createWebRequestHarness();
        electronAccess.setElectronOverride({
            session: {
                defaultSession: {
                    webRequest: {
                        onBeforeRequest: webRequest.onBeforeRequest,
                    },
                },
            },
        });

        setupBlockedRequests();

        expect(webRequest.onBeforeRequest).toHaveBeenCalledOnce();
        expect(
            webRequest.emit("https://ua.harryonline.net/collect")
        ).toStrictEqual({ cancel: true });
        expect(
            [
                "https://example.com/collect",
                "not a url",
                undefined,
            ].map((url) => webRequest.emit(url))
        ).toStrictEqual([
            {},
            {},
            {},
        ]);
    });
});
