import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const importRenderMap = async () => import("../../../../utils/maps/core/renderMap.js");

describe("renderMap bootstrap", () => {
    beforeEach(() => {
        vi.resetModules();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it("returns early when the map container is missing", async () => {
        const rootRender = vi.fn();
        const createRoot = vi.fn(() => ({ render: rootRender, unmount: vi.fn() }));
        vi.doMock("react-dom/client", () => ({ createRoot }));
        vi.doMock("../../../../utils/maps/components/MapViewRoot/MapViewRoot.jsx", () => ({
            MapViewRoot: () => null,
        }));

        const { renderMap } = await importRenderMap();
        renderMap();
        expect(createRoot).not.toHaveBeenCalled();
    });

    it("mounts a React root once and reuses it on subsequent calls", async () => {
        document.body.innerHTML = '<div id="content-map"></div>';
        const rootRender = vi.fn();
        const rootUnmount = vi.fn();
        const createRoot = vi.fn(() => ({ render: rootRender, unmount: rootUnmount }));
        const stubComponent = vi.fn(() => null);
        vi.doMock("react-dom/client", () => ({ createRoot }));
        vi.doMock("../../../../utils/maps/components/MapViewRoot/MapViewRoot.jsx", () => ({
            MapViewRoot: stubComponent,
        }));

        const { renderMap } = await importRenderMap();
        renderMap();
        expect(createRoot).toHaveBeenCalledTimes(1);
        expect(rootRender).toHaveBeenCalledTimes(1);
        expect(rootRender.mock.calls[0][0]?.type).toBe(stubComponent);

        renderMap();
        expect(createRoot).toHaveBeenCalledTimes(1);
        expect(rootRender).toHaveBeenCalledTimes(2);
        expect(rootUnmount).not.toHaveBeenCalled();
    });

    it("replaces the root if the underlying container element changes", async () => {
        const initialContainer = document.createElement("div");
        initialContainer.id = "content-map";
        document.body.appendChild(initialContainer);

        const rootRender = vi.fn();
        const rootUnmount = vi.fn();
        const createRoot = vi
            .fn(() => ({ render: rootRender, unmount: rootUnmount }))
            .mockName("createRootMock");
        vi.doMock("react-dom/client", () => ({ createRoot }));
        vi.doMock("../../../../utils/maps/components/MapViewRoot/MapViewRoot.jsx", () => ({
            MapViewRoot: () => null,
        }));

        const { renderMap } = await importRenderMap();
        renderMap();
        expect(createRoot).toHaveBeenCalledTimes(1);

        const newContainer = document.createElement("div");
        newContainer.id = "content-map";
        initialContainer.remove();
        document.body.appendChild(newContainer);

        renderMap();
        expect(rootUnmount).toHaveBeenCalledTimes(1);
        expect(createRoot).toHaveBeenCalledTimes(2);
    });
});
