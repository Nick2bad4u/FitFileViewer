export * from "./core/index.js";
export * from "./domain/index.js";
export * from "./integration/index.js";
declare namespace _default {
    export { stateCore as core };
    export { stateDomain as domain };
    export { stateIntegration as integration };
}
export default _default;
import * as stateCore from "./core/index.js";
import * as stateDomain from "./domain/index.js";
import * as stateIntegration from "./integration/index.js";
export { getState, setState, subscribe, updateState } from "./core/index.js";
//# sourceMappingURL=index.d.ts.map