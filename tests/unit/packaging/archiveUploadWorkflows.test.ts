import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const archiveUploadWorkflowPaths = [
    ".github/workflows/upload-linux-ia.yml",
    ".github/workflows/upload-macos-ia.yml",
    ".github/workflows/upload-windows-ia.yml",
] as const;

describe("Archive.org upload workflows", () => {
    it.each(archiveUploadWorkflowPaths)(
        "%s allows large releases to finish and reports upload failures",
        (workflowPath) => {
            expect.assertions(3);

            const workflow = readFileSync(
                path.join(process.cwd(), workflowPath),
                "utf8"
            );

            expect(workflow).toContain("timeout-minutes: 60");
            expect(workflow).toContain("Nick2bad4u/internet-archive-upload@");
            expect(workflow).not.toContain("continue-on-error: true");
        }
    );
});
