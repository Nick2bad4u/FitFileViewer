import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const electronAppDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = path.join(electronAppDir, "dist");

function assertInsideElectronApp(targetPath) {
    const resolvedRoot = path.resolve(electronAppDir);
    const resolvedTarget = path.resolve(targetPath);
    const relativePath = path.relative(resolvedRoot, resolvedTarget);

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(`Refusing to remove outside electron-app: ${targetPath}`);
    }
}

assertInsideElectronApp(distDir);
fs.rmSync(distDir, { force: true, recursive: true });
