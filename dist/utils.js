"use strict";
exports.__esModule = true;
var elasticsearch_1 = require("@elastic/elasticsearch");
function getClient() {
    var _a;
    var node = (_a = process.env.ELASTIC_HOST, (_a !== null && _a !== void 0 ? _a : '127.0.0.1:9200'));
    return new elasticsearch_1.Client({ node: node });
}
exports.getClient = getClient;
