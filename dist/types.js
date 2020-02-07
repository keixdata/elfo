"use strict";
exports.__esModule = true;
var lodash_1 = require("lodash");
var FilterOperators;
(function (FilterOperators) {
    FilterOperators["="] = "=";
    FilterOperators["!="] = "!=";
    FilterOperators[">"] = ">";
    FilterOperators[">="] = ">=";
    FilterOperators["<"] = "<";
    FilterOperators["<="] = "<=";
    FilterOperators["match"] = "match";
    FilterOperators["startsWith"] = "startsWith";
    FilterOperators["exists"] = "exists";
    FilterOperators["notExists"] = "notExists";
    FilterOperators["geoDistance"] = "geoDistance";
})(FilterOperators = exports.FilterOperators || (exports.FilterOperators = {}));
function isBooleanFilter(filter) {
    return !("attributeName" in filter);
}
exports.isBooleanFilter = isBooleanFilter;
function isAttributeValueFilter(filter) {
    var op = filter.op;
    return (op === "=" ||
        op === "!=" ||
        op === ">" ||
        op === ">=" ||
        op === "<" ||
        op === "<=" ||
        op === "startsWith" ||
        op === "match");
}
exports.isAttributeValueFilter = isAttributeValueFilter;
function isAttributeExistenceFilter(filter) {
    var op = filter.op;
    return op === "exists" || op === "notExists";
}
exports.isAttributeExistenceFilter = isAttributeExistenceFilter;
function isAttributeGeoDistanceFilter(filter) {
    var op = filter.op;
    return op === "geoDistance";
}
exports.isAttributeGeoDistanceFilter = isAttributeGeoDistanceFilter;
function isFilter(filter) {
    return filter.attributeName != null;
}
exports.isFilter = isFilter;
function isOperatorFilterArray(filters) {
    if (filters.length === 0) {
        throw new Error("Invalid filters");
    }
    // It's a value filter if operator is a Filter Operator
    return lodash_1.includes(FilterOperators, filters[0].op);
}
exports.isOperatorFilterArray = isOperatorFilterArray;
