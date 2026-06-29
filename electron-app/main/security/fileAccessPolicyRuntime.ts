import { isNodeEnvironment as isRuntimeNodeEnvironment } from "../../utils/runtime/processEnvironment.js";

type FileAccessPolicyRuntimeProvider<T> = T | undefined;

export interface FileAccessPolicyRuntimeScope {
    readonly isNodeEnvironment: FileAccessPolicyRuntimeProvider<
        (expected: string) => boolean
    >;
}

export interface FileAccessPolicyRuntime {
    readonly isNodeEnvironment: (expected: string) => boolean;
}

const defaultFileAccessPolicyRuntimeScope: FileAccessPolicyRuntimeScope = {
    isNodeEnvironment: isRuntimeNodeEnvironment,
};

function getRequiredProvider<T>(
    provider: FileAccessPolicyRuntimeProvider<T>,
    providerName: string
): T {
    if (typeof provider === "function") {
        return provider;
    }

    throw new TypeError(
        `fileAccessPolicyRuntime requires ${providerName} provider`
    );
}

export function getFileAccessPolicyRuntime(
    scope: FileAccessPolicyRuntimeScope = defaultFileAccessPolicyRuntimeScope
): FileAccessPolicyRuntime {
    return {
        isNodeEnvironment(expected): boolean {
            return getRequiredProvider(
                scope.isNodeEnvironment,
                "nodeEnvironment"
            )(expected);
        },
    };
}
