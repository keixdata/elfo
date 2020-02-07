"use strict";
exports.__esModule = true;
var elasticsearch_1 = require("@elastic/elasticsearch");
function getClient() {
    var _a, _b;
    var host = (_a = process.env.ELASTIC_HOST, (_a !== null && _a !== void 0 ? _a : "127.0.0.1"));
    var port = parseInt((_b = process.env.ELASTIC_PORT, (_b !== null && _b !== void 0 ? _b : "9200")));
    return new elasticsearch_1.Client({ node: host + ":" + port });
}
exports.getClient = getClient;
