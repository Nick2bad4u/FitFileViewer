import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const electronAppDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = path.join(electronAppDir, "dist");

const directoryCopies = ["assets", "ffv", "icons", "vendor"];
const fileCopies = ["elevProfile.css", "style.css"];

function assertInsideElectronApp(targetPath) {
    const resolvedRoot = path.resolve(electronAppDir);
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
    const source = path.join(electronAppDir, name);
    const destination = path.join(distDir, name);

    if (!fs.existsSync(source)) {
        return;
    }

    assertInsideElectronApp(destination);
    fs.cpSync(source, destination, { force: true, recursive: true });
}

function copyFile(name) {
    const source = path.join(electronAppDir, name);
    const destination = path.join(distDir, name);

    if (!fs.existsSync(source)) {
        return;
    }

    assertInsideElectronApp(destination);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
}

function copyIndexHtml() {
    const source = path.join(electronAppDir, "index.html");
    const destination = path.join(distDir, "index.html");
    const html = fs
        .readFileSync(source, "utf8")
        .replace(
            /"zod": "\.\/node_modules\/zod\/index\.js"/u,
            '"zod": "../node_modules/zod/index.js"'
        );

    assertInsideElectronApp(destination);
    fs.writeFileSync(destination, html);
}

fs.mkdirSync(distDir, { recursive: true });
copyIndexHtml();
for (const name of directoryCopies) {
    copyDirectory(name);
}
for (const name of fileCopies) {
    copyFile(name);
}
