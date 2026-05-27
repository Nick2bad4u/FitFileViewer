import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const docusaurusRoot = fileURLToPath(
    new URL("../docusaurus/", import.meta.url)
);
const requireFromDocusaurus = createRequire(
    new URL("../docusaurus/package.json", import.meta.url)
);
const typedocPackagePath = requireFromDocusaurus.resolve(
    "typedoc/package.json"
);
const typedocCliPath = path.join(
    path.dirname(typedocPackagePath),
    "bin",
    "typedoc"
);

const typedocOnly = process.argv.includes("--typedoc-only");
const steps = [
    {
        args: [
            typedocCliPath,
            "--options",
            "typedoc.json",
        ],
        cwd: docusaurusRoot,
        label: "generate API docs",
    },
    {
        args: [scriptPath("generate-api-categories.mjs")],
        cwd: docusaurusRoot,
        label: "generate API categories",
    },
    ...(typedocOnly
        ? []
        : [
              {
                  args: [scriptPath("run-docusaurus.mjs"), "build"],
                  cwd: repositoryRoot,
                  label: "build Docusaurus site",
              },
          ]),
];

for (const step of steps) {
    console.log(`[build-docs] ${step.label}`);

    const result = spawnSync(process.execPath, step.args, {
        cwd: step.cwd,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        process.exitCode = result.status ?? 1;
        break;
    }
}

function scriptPath(name) {
    return path.join(repositoryRoot, "scripts", name);
}
