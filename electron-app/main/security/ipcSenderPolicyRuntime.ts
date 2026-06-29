import { appRef as runtimeAppRef } from "../runtime/electronAccess.js";
import {
    getProcessStringValue as getRuntimeProcessStringValue,
    isTestEnvironment as isRuntimeTestEnvironment,
    type RuntimeProcessStringPropertyName,
} from "../../utils/runtime/processEnvironment.js";

type IpcSenderPolicyRuntimeProvider<T> = T | undefined;

export type IpcSenderPolicyProcessStringName =
    RuntimeProcessStringPropertyName;

type AppLike = {
    getAppPath?: () => string;
};

export interface IpcSenderPolicyRuntimeScope {
    readonly appRef: IpcSenderPolicyRuntimeProvider<
        () => AppLike | undefined
    >;
    readonly getProcessStringValue: IpcSenderPolicyRuntimeProvider<
        (name: IpcSenderPolicyProcessStringName) => string | undefined
    >;
    readonly isTestEnvironment: IpcSenderPolicyRuntimeProvider<() => boolean>;
}

export interface IpcSenderPolicyRuntime {
    readonly appRef: () => AppLike | undefined;
    readonly getProcessStringValue: (
        name: IpcSenderPolicyProcessStringName
    ) => string | undefined;
    readonly isTestEnvironment: () => boolean;
}

const defaultIpcSenderPolicyRuntimeScope: IpcSenderPolicyRuntimeScope = {
    appRef: runtimeAppRef,
    getProcessStringValue: getRuntimeProcessStringValue,
    isTestEnvironment: isRuntimeTestEnvironment,
};

function getRequiredProvider<T>(
    provider: IpcSenderPolicyRuntimeProvider<T>,
    providerName: string
): T {
    if (typeof provider === "function") {
        return provider;
    }

    throw new TypeError(
        `ipcSenderPolicyRuntime requires ${providerName} provider`
    );
}

export function getIpcSenderPolicyRuntime(
    scope: IpcSenderPolicyRuntimeScope = defaultIpcSenderPolicyRuntimeScope
): IpcSenderPolicyRuntime {
    return {
        appRef(): AppLike | undefined {
            return getRequiredProvider(scope.appRef, "appRef")();
        },
        getProcessStringValue(name): string | undefined {
            return getRequiredProvider(
                scope.getProcessStringValue,
                "processStringValue"
            )(name);
        },
        isTestEnvironment(): boolean {
            return getRequiredProvider(
                scope.isTestEnvironment,
                "testEnvironment"
            )();
        },
    };
}
