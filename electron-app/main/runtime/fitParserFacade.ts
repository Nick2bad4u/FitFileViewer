import fitParserModule from "../../fitParser.js";

type FitParserModule = import("../../shared/fitParser").FitParserModule;

export function getFitParserModule(): FitParserModule {
    return fitParserModule;
}
