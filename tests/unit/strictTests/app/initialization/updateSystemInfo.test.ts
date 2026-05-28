import { describe, expect, it, vi } from "vitest";

type SystemInfoModule =
    typeof import("../../../../../electron-app/utils/app/initialization/updateSystemInfo.js");

const completeSystemInfo = {
    author: "FitFileViewer Team",
    chrome: "128.0",
    electron: "38.0.0",
    license: "MIT",
    node: "22.0.0",
    platform: "win32 (x64)",
    version: "1.0.0",
} satisfies Record<string, string>;

async function importSystemInfoModule(): Promise<SystemInfoModule> {
    return import("../../../../../electron-app/utils/app/initialization/updateSystemInfo.js");
}

function createFields(count = 7): void {
    document.body.innerHTML = "";
    const container = document.createElement("div");

    for (let i = 0; i < count; i++) {
        const span = document.createElement("span");
        span.className = "system-info-value";
        container.appendChild(span);
    }
    document.body.appendChild(container);
}

describe("updateSystemInfo", () => {
    it("maps fields in order to DOM and returns true", async () => {
        expect.assertions(2);

        document.body.innerHTML = "";
        vi.resetModules();
        createFields(7);

        const { updateSystemInfo } = await importSystemInfoModule();
        const ok = updateSystemInfo(completeSystemInfo);

        expect(ok ? "updated" : "failed").toBe("updated");

        const values = Array.from(
            document.querySelectorAll(".system-info-value"),
            (element) => element.textContent
        );

        expect(values).toStrictEqual([
            "1.0.0",
            "38.0.0",
            "22.0.0",
            "128.0",
            "win32 (x64)",
            "FitFileViewer Team",
            "MIT",
        ]);
    });

    it("warns when DOM count mismatches and still sets available", async () => {
        expect.assertions(2);

        document.body.innerHTML = "";
        vi.resetModules();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        createFields(5);
        const { updateSystemInfo } = await importSystemInfoModule();

        try {
            const ok = updateSystemInfo({
                ...completeSystemInfo,
                author: "6",
                chrome: "4",
                electron: "2",
                license: "7",
                node: "3",
                platform: "5",
                version: "1",
            });

            expect(ok ? "updated" : "failed").toBe("updated");
            expect(warnSpy).toHaveBeenCalledWith(
                "[SystemInfo] Expected 7 .system-info-value elements, but found 5. Check the HTML structure to ensure all system info fields are present."
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it("returns false with invalid info object and when no DOM elements", async () => {
        expect.assertions(2);

        document.body.innerHTML = "";
        vi.resetModules();

        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { updateSystemInfo } = await importSystemInfoModule();

        try {
            expect(updateSystemInfo(null) ? "updated" : "failed").toBe(
                "failed"
            );

            createFields(0);

            expect(updateSystemInfo({}) ? "updated" : "failed").toBe("failed");
        } finally {
            errorSpy.mockRestore();
            warnSpy.mockRestore();
        }
    });

    it("clears cache and re-initializes on next call", async () => {
        expect.assertions(1);

        document.body.innerHTML = "";
        vi.resetModules();
        createFields(7);

        const { clearSystemInfoCache, updateSystemInfo } =
            await importSystemInfoModule();

        updateSystemInfo({
            author: "F",
            chrome: "D",
            electron: "B",
            license: "G",
            node: "C",
            platform: "E",
            version: "A",
        });

        createFields(7);
        clearSystemInfoCache();

        updateSystemInfo({
            chrome: "Q",
            electron: "Y",
            license: "N",
            node: "Z",
            author: "O",
            platform: "P",
            version: "X",
        });

        const values = Array.from(
            document.querySelectorAll(".system-info-value"),
            (element) => element.textContent
        );

        expect(values[0]).toBe("X");
    });
});
