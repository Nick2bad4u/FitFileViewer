"use strict";
{
    let fitParserModule;
    function getFitParserModule() {
        fitParserModule ??= require("../../fitParser");
        return fitParserModule;
    }
    module.exports = { getFitParserModule };
}
