const logArea = document.getElementById("harness-log");
let hasReported = false;

const log = (message) => {
    const stamp = new Date().toISOString();
    const line = `[smoke-harness] ${stamp} ${message}`;
    console.log(line);
    if (logArea) {
        logArea.textContent = `${logArea.textContent}${line}\n`;
    }
};

const report = (success, context) => {
    if (hasReported) {
        return;
    }
    hasReported = true;

    const payload = {
        success,
        ...context,
    };

    try {
        globalThis.electronAPI?.reportSmokeTestResult?.(payload);
    } catch (error) {
        console.error("[smoke-harness] Failed to report smoke test result", error);
    }
};

const fail = (stage, error) => {
    const message = error instanceof Error ? error.message : String(error);
    log(`❌ Stage '${stage}' failed: ${message}`);
    report(false, {
        stage,
        message,
    });
};

/**
 * Drive the smoke test without relying on the full UI stack.
 */
async function runSmokeHarness() {
    if (!globalThis.electronAPI) {
        fail("preflight", "electronAPI bridge unavailable");
        return;
    }

    try {
        globalThis.electronAPI.notifySmokeTestReady?.();
    } catch (error) {
        log(`⚠️ notifySmokeTestReady threw: ${error instanceof Error ? error.message : String(error)}`);
    }

    const { openFile, readFile, parseFitFile } = /** @type {any} */ (globalThis.electronAPI);

    if (typeof openFile !== "function" || typeof readFile !== "function" || typeof parseFitFile !== "function") {
        fail("api-check", "Required Electron API methods missing");
        return;
    }

    try {
        log("Requesting forced FIT path through dialog handler…");
        const selection = await openFile();
        const candidate = Array.isArray(selection) ? selection[0] : selection;

        if (typeof candidate !== "string" || candidate.length === 0) {
            fail("open-file", "Dialog returned no file path");
            return;
        }

        log(`Reading FIT sample: ${candidate}`);
        const buffer = await readFile(candidate);
        if (!(buffer instanceof ArrayBuffer)) {
            fail("read-file", "Unexpected response from readFile");
            return;
        }

        log("Parsing FIT payload via main process…");
        const parseResult = await parseFitFile(buffer);
        if (!parseResult || typeof parseResult !== "object") {
            fail("parse-fit-file", "Parser returned empty result");
            return;
        }

        const { data: parsedData, records: legacyRecords } = /** @type {{ data?: { recordMesgs?: any[] }, records?: any[] }} */ (
            parseResult ?? {}
        );
        /** @type {any[]} */
        let records = Array.isArray(parsedData?.recordMesgs) ? parsedData.recordMesgs : [];
        if (records.length === 0 && Array.isArray(legacyRecords)) {
            records = legacyRecords;
        }

        log(`✅ Parsed FIT file with ${records.length} record message(s). Reporting success.`);
        report(true, {
            stage: "harness-complete",
            filePath: candidate,
            recordCount: records.length,
            byteLength: buffer.byteLength ?? 0,
        });
    } catch (error) {
        fail("execution", error);
    }
}

runSmokeHarness().catch((error) => {
    fail("unhandled", error);
});
