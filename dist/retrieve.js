"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var lodash_1 = require("lodash");
var utils_1 = require("./utils");
var types_1 = require("./types");
/**
 * Build the component of an elastic query given an AttributeOperatorFilter
 * @param filter
 * @param attributeName
 */
function queryOperatorFilterBuilder(filter, attributeName) {
    var _a, _b, _c, _d, _e, _f, _g;
    // Handle value filter
    if (types_1.isAttributeValueFilter(filter)) {
        var op = filter.op, value = filter.value;
        var rangeOperators = {
            ">": "gt",
            ">=": "gte",
            "<": "lt",
            "<=": "lte"
        };
        var isEqualQuery = op === "=";
        var isNotEqualQuery = op === "!=";
        var isRangeQuery = lodash_1.includes(lodash_1.keys(rangeOperators), op);
        var isPrefixQuery = op === "startsWith";
        var isMatchQuery = op === "match";
        if (isEqualQuery) {
            return { filter: { term: (_a = {}, _a[attributeName + ".retrieve"] = value, _a) } };
        }
        if (isNotEqualQuery) {
            return { must_not: { term: (_b = {}, _b[attributeName + ".retrieve"] = value, _b) } };
        }
        if (isRangeQuery) {
            return {
                filter: {
                    range: (_c = {},
                        _c[attributeName + ".retrieve"] = (_d = {}, _d[rangeOperators[op]] = value, _d),
                        _c)
                }
            };
        }
        if (isPrefixQuery) {
            return { filter: { prefix: (_e = {}, _e[attributeName + ".retrieve"] = value, _e) } };
        }
        if (isMatchQuery) {
            return { filter: { match: (_f = {}, _f[attributeName] = value, _f) } };
        }
    }
    // Handle existence filter
    if (types_1.isAttributeExistenceFilter(filter)) {
        var op = filter.op;
        var isExistsQuery = op === "exists";
        var isNotExistsQuery = op === "notExists";
        if (isExistsQuery) {
            return { filter: { exists: { field: attributeName + ".retrieve" } } };
        }
        if (isNotExistsQuery) {
            return { must_not: { exists: { field: attributeName + ".retrieve" } } };
        }
    }
    // Handle geoDistance filter
    if (types_1.isAttributeGeoDistanceFilter(filter)) {
        var distance = filter.distance, origin_1 = filter.origin, unit = filter.unit;
        return {
            filter: {
                geo_distance: (_g = {
                        distance: "" + distance + unit
                    },
                    _g[attributeName] = origin_1,
                    _g)
            }
        };
    }
    throw new Error("Invalid operator");
}
/**
 * The helper fn to build an elastic query with given filters
 * @param filter
 * @param attributeName
 */
var queryFilterBuilder = function (filter, attributeName) {
    var op = filter.op, filters = filter.filters;
    // If it's a Filter type, get the attributeName from that
    if (types_1.isFilter(filter)) {
        attributeName = filter.attributeName;
    }
    var attributeNameError = function () {
        return new Error("Code error! No attributeName set");
    };
    if (op == null || filters.length === 1) {
        // Operator could be omitted only if there is a single filter
        if (filters.length !== 1) {
            throw new Error("Operator is missing");
        }
        if (types_1.isOperatorFilterArray(filters)) {
            if (attributeName == null) {
                throw attributeNameError();
            }
            return queryOperatorFilterBuilder(filters[0], attributeName);
        }
        return queryFilterBuilder(filters[0], attributeName);
    }
    if (op === "or") {
        // If children filters are OperatorFilterArray call the queryOperatorFilterBuilder, else call this recursively
        var should = types_1.isOperatorFilterArray(filters)
            ? lodash_1.map(filters, function (c) {
                if (attributeName == null) {
                    throw attributeNameError();
                }
                return { bool: queryOperatorFilterBuilder(c, attributeName) };
            })
            : lodash_1.map(filters, function (c) { return ({ bool: queryFilterBuilder(c, attributeName) }); });
        return { should: should, minimum_should_match: 1 };
    }
    if (op === "and") {
        if (types_1.isOperatorFilterArray(filters)) {
            return filters.reduce(function (prev, c) {
                if (attributeName == null) {
                    throw attributeNameError();
                }
                var res = queryOperatorFilterBuilder(c, attributeName);
                if (res.filter) {
                    prev.filter = __spreadArrays((prev.filter || []), [res.filter]);
                }
                if (res.must_not) {
                    prev.must_not = __spreadArrays((prev.must_not || []), [res.must_not]);
                }
                return prev;
            }, {});
        }
        return {
            must: lodash_1.map(filters, function (c) { return ({ bool: queryFilterBuilder(c, attributeName) }); })
        };
    }
};
function retrieve(params) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function () {
        var filterComponent, searchComponent, query, orderBy, orderByMapped, sort, searchAfter, client, limit, response, hits, total, items, moreItems, endCursor, cursor_1, itemsSliced, page;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    filterComponent = params.filters
                        ? { bool: queryFilterBuilder(params.filters) }
                        : { match_all: {} };
                    searchComponent = params.queryString
                        ? {
                            multi_match: {
                                query: params.queryString,
                                fields: [
                                    "_search1^5",
                                    "_search2^4",
                                    "_search3^3",
                                    "_search4^2",
                                    "_search5^1"
                                ],
                                type: "most_fields",
                                fuzziness: "AUTO"
                            }
                        }
                        : null;
                    query = {
                        bool: {
                            filter: [filterComponent],
                            must: searchComponent
                        }
                    };
                    orderBy = (_a = params.orderBy, (_a !== null && _a !== void 0 ? _a : []));
                    orderByMapped = orderBy.map(function (o) { return lodash_1.mapKeys(o, function (_, k) { return k + ".retrieve"; }); });
                    sort = lodash_1.compact(__spreadArrays(orderByMapped, [{ _id: "desc" }]));
                    searchAfter = params.cursor != null
                        ? sort.map(function (v) {
                            // Get the cursor attribute value of sort attribute (k)
                            var c = params.cursor[lodash_1.keys(v)[0]];
                            // If c is undefined the given cursor is malformed
                            if (c == null) {
                                throw new Error("The given cursor is malformed!");
                            }
                            // TODO: The following bug affected elastic 6.x, check for 7.x
                            // WORKAROUND FIX FOR BIGINT BUG
                            // JS cannot represent the bigint 9223372036854775807 because all numbers are 64bit double,
                            // If we query elastic sorting for an optional number-like field (int, float, date, ...),
                            // so if you store that value on a JS variable it will be stored as 9223372036854776000
                            // when the field is missing, elastic return a sort value of 9223372036854775807 that it's the
                            // When we build the searchAfter we could set the js bugged number causing elastic to raise a bigint error.
                            // biggest number it can represent.
                            // Check also:
                            // We fixed the issue with the next workaround, passing the bigint as string when number is 9223372036854776000
                            // https://discuss.elastic.co/t/sort-by-dynamic-fields-and-use-search-after/86275/2
                            // https://github.com/elastic/elasticsearch/issues/28806
                            // https://github.com/elastic/elasticsearch-js/issues/662
                            if (lodash_1.isNumber(c)) {
                                return Number.isInteger(c) && !Number.isSafeInteger(c)
                                    ? "-9223372036854775808"
                                    : c;
                            }
                            // Just return c.
                            return c;
                        })
                        : undefined;
                    client = (_b = params.client, (_b !== null && _b !== void 0 ? _b : utils_1.getClient()));
                    limit = (_c = params.limit, (_c !== null && _c !== void 0 ? _c : 25));
                    return [4 /*yield*/, client.search({
                            index: params.indexName,
                            body: {
                                query: query,
                                sort: sort,
                                // Get 1 more element to check if next result page available
                                size: limit != 0 ? limit + 1 : limit,
                                search_after: searchAfter
                            }
                        })];
                case 1:
                    response = _d.sent();
                    if (response.statusCode !== 200) {
                        throw new Error(JSON.stringify(response.meta));
                    }
                    hits = response.body.hits.hits;
                    total = response.body.hits.total.value;
                    items = hits.map(function (i) { return i._source; });
                    moreItems = items.length > limit;
                    endCursor = undefined;
                    if (moreItems) {
                        cursor_1 = hits[limit - 1].sort || [];
                        endCursor = sort.reduce(function (p, v, i) {
                            var _a;
                            return (__assign(__assign({}, p), (_a = {}, _a[lodash_1.keys(v)[0]] = cursor_1[i], _a)));
                        }, {});
                    }
                    itemsSliced = items.slice(0, limit);
                    page = {
                        items: itemsSliced,
                        pageInfo: { endCursor: endCursor, size: itemsSliced.length, total: total }
                    };
                    return [2 /*return*/, page];
            }
        });
    });
}
exports.retrieve = retrieve;
