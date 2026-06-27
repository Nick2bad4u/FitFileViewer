import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

const showFitDataMock = vi.hoisted(() =>
    vi.fn<
        (
            data: Record<string, unknown>,
            filePath: string,
            options?: { electronApiScope?: RendererElectronApiScope }
        ) => void
    >()
);

vi.mock(
    import("../../../../../electron-app/utils/rendering/core/showFitData.js"),
    () => ({ showFitData: showFitDataMock })
);

import { renderDecodedFitData } from "../../../../../electron-app/utils/rendering/core/renderDecodedFitData.js";

describe(renderDecodedFitData, () => {
    beforeEach(() => {
        showFitDataMock.mockReset();
    });

    it("passes the explicit Electron API scope through the lazy renderer handoff", async () => {
        expect.assertions(1);

        const data = { recordMesgs: [{ distance: 1000 }] };
        const electronApiScope: RendererElectronApiScope = {
            getElectronAPI: () => ({ notifyFitFileLoaded: vi.fn() }),
        };

        await renderDecodedFitData(data, "C:\\activities\\ride.fit", {
            electronApiScope,
        });

        expect(showFitDataMock).toHaveBeenCalledExactlyOnceWith(
            data,
            "C:\\activities\\ride.fit",
            { electronApiScope }
        );
    });
});
