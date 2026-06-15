import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
    repositoryRoot,
    rootElectronBuilderConfigPath,
} from "./lib/workspaces.mjs";

const electronBuilderCliPath = fileURLToPath(
    import.meta.resolve("electron-builder/cli.js")
);
export const electronBuilderBaseArgs = [
    "--projectDir",
    ".",
    "--config",
    rootElectronBuilderConfigPath,
];
export { electronBuilderCliPath };

const macosNotarizationCredentialSets = [
    [
        "APPLE_ID",
        "APPLE_APP_SPECIFIC_PASSWORD",
        "APPLE_TEAM_ID",
    ],
    [
        "APPLE_API_KEY",
        "APPLE_API_KEY_ID",
        "APPLE_API_ISSUER",
    ],
    ["APPLE_KEYCHAIN_PROFILE"],
];

const signingEnvironmentNames = [
    "APPLE_API_ISSUER",
    "APPLE_API_KEY",
    "APPLE_API_KEY_ID",
    "APPLE_APP_SPECIFIC_PASSWORD",
    "APPLE_ID",
    "APPLE_KEYCHAIN",
    "APPLE_KEYCHAIN_PROFILE",
    "APPLE_TEAM_ID",
    "CSC_IDENTITY_AUTO_DISCOVERY",
    "CSC_INSTALLER_KEY_PASSWORD",
    "CSC_INSTALLER_LINK",
    "CSC_KEY_PASSWORD",
    "CSC_LINK",
    "CSC_NAME",
    "WIN_CSC_LINK",
    "WIN_CSC_NAME",
];

export function parseArgs(argv) {
    const builderArgs = [];
    let nodeEnv;

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--node-env") {
            nodeEnv = argv[index + 1];
            if (!nodeEnv || nodeEnv.startsWith("-")) {
                throw new Error("--node-env requires a value");
            }

            index += 1;
            continue;
        }

        if (arg.startsWith("--node-env=")) {
            nodeEnv = arg.slice("--node-env=".length);
            if (!nodeEnv) {
                throw new Error("--node-env must not be empty");
            }

            continue;
        }

        builderArgs.push(arg);
    }

    return { builderArgs, nodeEnv };
}

export function getCodeSigningValidationErrors(
    environment = process.env,
    platform = process.platform
) {
    if (environment.REQUIRE_CODE_SIGNING !== "true") {
        return [];
    }

    if (platform === "win32") {
        return [
            ...requireOneOf(environment, ["WIN_CSC_LINK", "CSC_LINK"]),
            ...requireEnvironmentNames(environment, ["CSC_KEY_PASSWORD"]),
        ];
    }

    if (platform === "darwin") {
        const missingNotarizationCredentials =
            macosNotarizationCredentialSets.every(
                (credentialSet) =>
                    requireEnvironmentNames(environment, credentialSet).length >
                    0
            );

        return [
            ...requireEnvironmentNames(environment, [
                "CSC_LINK",
                "CSC_KEY_PASSWORD",
                "CSC_INSTALLER_LINK",
                "CSC_INSTALLER_KEY_PASSWORD",
            ]),
            ...(missingNotarizationCredentials
                ? [
                      "one macOS notarization credential set is required: APPLE_ID/APPLE_APP_SPECIFIC_PASSWORD/APPLE_TEAM_ID, APPLE_API_KEY/APPLE_API_KEY_ID/APPLE_API_ISSUER, or APPLE_KEYCHAIN_PROFILE",
                  ]
                : []),
        ];
    }

    return [];
}

export function getElectronBuilderEnvironment(
    environment = process.env,
    platform = process.platform
) {
    if (
        environment.REQUIRE_CODE_SIGNING !== "true" ||
        isEnvironmentFlagEnabled(environment.FFV_FORCE_UNSIGNED_PACKAGE)
    ) {
        return getUnsignedElectronBuilderEnvironment(environment);
    }

    const signingErrors = getCodeSigningValidationErrors(environment, platform);

    if (signingErrors.length > 0) {
        throw new Error(
            [
                "Code signing is required for this build, but the signing environment is incomplete.",
                ...signingErrors.map((error) => `- ${error}`),
            ].join("\n")
        );
    }

    return environment;
}

export function getUnsignedElectronBuilderEnvironment(environment) {
    const signingEnvironmentNameSet = new Set(signingEnvironmentNames);
    const unsignedEnvironment = Object.fromEntries(
        Object.entries(environment).filter(
            ([name]) => !signingEnvironmentNameSet.has(name)
        )
    );

    return {
        ...unsignedEnvironment,
        CSC_IDENTITY_AUTO_DISCOVERY: "false",
        REQUIRE_CODE_SIGNING: "false",
    };
}

export function runElectronBuilder(
    argv = process.argv.slice(2),
    commandRunner = spawnSync,
    environment = process.env,
    options = {}
) {
    const { builderArgs, nodeEnv } = parseArgs(argv);
    const builderEnvironment = getElectronBuilderEnvironment(
        environment,
        options.platform ?? process.platform
    );
    const commandEnvironment = nodeEnv
        ? { ...builderEnvironment, NODE_ENV: nodeEnv }
        : builderEnvironment;
    const result = commandRunner(
        process.execPath,
        [
            electronBuilderCliPath,
            ...electronBuilderBaseArgs,
            ...builderArgs,
        ],
        {
            cwd: repositoryRoot,
            env: commandEnvironment,
            stdio: "inherit",
        }
    );

    if (result.error) {
        throw result.error;
    }

    return result.status ?? 1;
}

function isEnvironmentFlagEnabled(value) {
    return (
        typeof value === "string" &&
        [
            "1",
            "true",
            "yes",
        ].includes(value.toLowerCase())
    );
}

function hasEnvironmentValue(environment, name) {
    return (
        typeof environment[name] === "string" && environment[name].trim() !== ""
    );
}

function requireEnvironmentNames(environment, names) {
    return names
        .filter((name) => !hasEnvironmentValue(environment, name))
        .map((name) => `${name} is required`);
}

function requireOneOf(environment, names) {
    return names.some((name) => hasEnvironmentValue(environment, name))
        ? []
        : [`one of ${names.join(" or ")} is required`];
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runElectronBuilder();
}
