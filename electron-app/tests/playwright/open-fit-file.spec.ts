import { test, expect, _electron as electron } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const REPO_ROOT = path.resolve(PROJECT_ROOT, '..');
const SAMPLE_FIT = path.join(REPO_ROOT, 'fit-test-files', '17326739450_ACTIVITY.fit');

if (!fs.existsSync(SAMPLE_FIT)) {
    throw new Error(`Sample FIT file missing at ${SAMPLE_FIT}`);
}

test.describe('Electron file handling smoke test', () => {
    test('renderer can read and decode FIT file via preload API', async () => {
        const electronApp = await electron.launch({
            args: ['.'],
            cwd: PROJECT_ROOT,
            env: {
                ...process.env,
                ELECTRON_DISABLE_SECURITY_WARNINGS: '1',
                FFV_E2E_OPEN_FILE_PATH: SAMPLE_FIT,
                NODE_ENV: 'production',
            },
        });

        const window = await electronApp.firstWindow();
        await window.waitForEvent('domcontentloaded');

        const hasElectronApi = await window.evaluate(() => typeof (globalThis as any).electronAPI === 'object');
        expect(hasElectronApi).toBeTruthy();

        const selectedPath = await window.evaluate(async () => {
            const api = (globalThis as any).electronAPI;
            const result = await api.openFile();
            return Array.isArray(result) ? result[0] : result;
        });
        expect(selectedPath).toBeTruthy();
        expect(String(selectedPath).toLowerCase()).toContain('.fit');

        const byteLength = await window.evaluate(async (filePath) => {
            const api = (globalThis as any).electronAPI;
            const buffer = await api.readFile(filePath);
            return buffer.byteLength;
        }, selectedPath);
        expect(byteLength).toBeGreaterThan(0);

        const parseSummary = await window.evaluate(async (filePath) => {
            const api = (globalThis as any).electronAPI;
            const buffer = await api.readFile(filePath);
            const parsed = await api.parseFitFile(buffer);
            const data = parsed?.data ?? parsed;
            const recordCandidates =
                Array.isArray(data?.recordMesgs) && data.recordMesgs.length > 0
                    ? data.recordMesgs
                    : Array.isArray(data?.records)
                    ? data.records
                    : [];
            return {
                hasData: Boolean(data),
                recordCount: recordCandidates.length,
            };
        }, selectedPath);

        expect(parseSummary.hasData).toBeTruthy();
        expect(parseSummary.recordCount).toBeGreaterThan(0);

        await electronApp.close();
    });
});
