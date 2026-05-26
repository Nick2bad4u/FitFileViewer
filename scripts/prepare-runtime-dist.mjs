import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const appDir = path.join(repositoryRoot, "electron-app");
const distDir = path.join(appDir, "dist");

const directoryCopies = ["assets", "ffv", "icons"];
const fileCopies = ["elevProfile.css", "style.css"];

function assertInsideElectronApp(targetPath) {
    const resolvedRoot = path.resolve(appDir);
    const resolvedTarget = path.resolve(targetPath);
    const relativePath = path.relative(resolvedRoot, resolvedTarget);

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(`Refusing to operate outside electron-app: ${targetPath}`);
    }
}

function copyDirectory(name) {
    const source = path.join(appDir, name);
    const destination = path.join(distDir, name);

    if (!fs.existsSync(source)) {
        return;
    }

    assertInsideElectronApp(destination);
    fs.cpSync(source, destination, { force: true, recursive: true });
}

function copyFile(name) {
    const source = path.join(appDir, name);
    const destination = path.join(distDir, name);

    if (!fs.existsSync(source)) {
        return;
    }

    assertInsideElectronApp(destination);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
}

function assertNoNodeModulesReference(filePath, content) {
    if (content.includes("node_modules")) {
        throw new Error(
            `${path.relative(appDir, filePath)} must not reference node_modules directly`
        );
    }
}

function copyIndexHtml() {
    const source = path.join(appDir, "index.html");
    const destination = path.join(distDir, "index.html");
    const html = fs.readFileSync(source, "utf8");

    assertNoNodeModulesReference(source, html);
    assertInsideElectronApp(destination);
    fs.writeFileSync(destination, html);
    assertNoNodeModulesReference(destination, html);
}

fs.mkdirSync(distDir, { recursive: true });
copyIndexHtml();
for (const name of directoryCopies) {
    copyDirectory(name);
}
for (const name of fileCopies) {
    copyFile(name);
}
