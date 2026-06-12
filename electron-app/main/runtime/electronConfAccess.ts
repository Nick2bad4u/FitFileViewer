import { loadNodeModule } from "./nodeModules.js";

type ElectronConfConstructor<TStore> = new (options?: {
    name?: string;
}) => TStore;

interface ElectronConfModuleLike<TStore> {
    Conf?: ElectronConfConstructor<TStore>;
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
    return (
        Boolean(value) &&
        (typeof value === "object" || typeof value === "function")
    );
}

export function resolveElectronConfConstructor<
    TStore,
>(): ElectronConfConstructor<TStore> | null {
    const mod = loadNodeModule<ElectronConfModuleLike<TStore>>("electron-conf");
    if (!isObjectLike(mod)) {
        return null;
    }

    const Conf = Reflect.get(mod, "Conf");
    return typeof Conf === "function"
        ? (Conf as ElectronConfConstructor<TStore>)
        : null;
}

export function createElectronConf<TStore>(options?: {
    name?: string;
}): TStore | null {
    const Conf = resolveElectronConfConstructor<TStore>();
    if (!Conf) {
        return null;
    }

    return new Conf(options);
}
