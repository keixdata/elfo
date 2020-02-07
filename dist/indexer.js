"use strict";
/*
  How to realize an autocomplete search system
  --------
  The available approches:
  https://hackernoon.com/elasticsearch-building-autocomplete-functionality-494fcf81a7cf

  es completion suggester VS edge ngrams
  We choose edge ngrams because completion suggester relies on word typed order that is not
  our desired behaviour

  Check this out to see how to realize the ngrams autocomplete search system
  https://qbox.io/blog/multi-field-partial-word-autocomplete-in-elasticsearch-using-ngrams

  -------------------

  MULTI FIELD SCORE BOOST SOLUTION

  Instead of use the _all field for search query, we map on every index 5 properties (_search1, ..., _search5)
  In each one all fields that have the same search priority will be copied.
  This way we could run a score weighted search.
  If query string match _search1 in doc A e _search2 in doc B, doc A will have an higher searching score.

 */
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
exports.__esModule = true;
var utils_1 = require("./utils");
/**
 * Search priority level, less the level, higher importance
 */
var SearchPriorityLevel;
(function (SearchPriorityLevel) {
    SearchPriorityLevel[SearchPriorityLevel["NONE"] = 0] = "NONE";
    SearchPriorityLevel[SearchPriorityLevel["LEVEL_1"] = 1] = "LEVEL_1";
    SearchPriorityLevel[SearchPriorityLevel["LEVEL_2"] = 2] = "LEVEL_2";
    SearchPriorityLevel[SearchPriorityLevel["LEVEL_3"] = 3] = "LEVEL_3";
    SearchPriorityLevel[SearchPriorityLevel["LEVEL_4"] = 4] = "LEVEL_4";
    SearchPriorityLevel[SearchPriorityLevel["LEVEL_5"] = 5] = "LEVEL_5";
})(SearchPriorityLevel = exports.SearchPriorityLevel || (exports.SearchPriorityLevel = {}));
/**
 * Helper fn to map an elastic index property
 * @param options
 */
function setProperty(options) {
    var _a, _b, _c, _d;
    var type = (_a = options.type, (_a !== null && _a !== void 0 ? _a : "text"));
    var searchPriority = (_b = options.searchPriority, (_b !== null && _b !== void 0 ? _b : 3));
    var customOptions = (_c = options.customOptions, (_c !== null && _c !== void 0 ? _c : {}));
    var copyTo = searchPriority !== SearchPriorityLevel.NONE
        ? { copy_to: "_search" + searchPriority }
        : {};
    var customfieldsSetting = options.customFields
        ? { fields: options.customFields }
        : {};
    var fieldsSetting = type !== "geo_point"
        ? {
            fields: __assign(__assign({}, (_d = options.customFields, (_d !== null && _d !== void 0 ? _d : {}))), { 
                // Add a field to enable sorting on each indexed field
                retrieve: type === "text"
                    ? { type: "keyword", ignore_above: 256 }
                    : { type: type } })
        }
        : { fields: customfieldsSetting };
    return __assign(__assign(__assign({ type: type }, copyTo), fieldsSetting), customOptions);
}
exports.setProperty = setProperty;
/**
 * Index mapping setting to enable autocomplete search
 */
var autocompleteSearchSettings = {
    max_ngram_diff: 20,
    analysis: {
        filter: {
            nGram_filter: {
                type: "nGram",
                min_gram: 1,
                max_gram: 20,
                token_chars: ["letter", "digit"]
            }
        },
        analyzer: {
            nGram_analyzer: {
                type: "custom",
                tokenizer: "whitespace",
                filter: ["lowercase", "asciifolding", "nGram_filter"]
            },
            whitespace_analyzer: {
                type: "custom",
                tokenizer: "whitespace",
                filter: ["lowercase", "asciifolding"]
            },
            email_analyzer: {
                type: "custom",
                tokenizer: "uax_url_email",
                filter: ["lowercase"]
            }
        }
    }
};
/**
 * Helper fn to build the config (settings, mappings) to create an elastic index
 * @param options
 */
function buildIndexConfig(options) {
    var _a, _b;
    var customSettings = (_a = options.customSettings, (_a !== null && _a !== void 0 ? _a : {}));
    var searchable = (_b = options.searchable, (_b !== null && _b !== void 0 ? _b : true));
    var settings = searchable
        ? { settings: __assign(__assign({}, autocompleteSearchSettings), customSettings) }
        : customSettings;
    var searchableFieldParams = {
        type: "text",
        analyzer: "nGram_analyzer",
        search_analyzer: "whitespace_analyzer"
    };
    var search = searchable
        ? {
            _search1: searchableFieldParams,
            _search2: searchableFieldParams,
            _search3: searchableFieldParams,
            _search4: searchableFieldParams,
            _search5: searchableFieldParams
        }
        : {};
    var mappings = {
        dynamic: false,
        properties: __assign(__assign({}, options.properties), search)
    };
    return __assign(__assign({}, settings), { mappings: mappings });
}
exports.buildIndexConfig = buildIndexConfig;
function createIndex(options) {
    var _a;
    var name = options.name, config = options.config;
    var client = (_a = options.client, (_a !== null && _a !== void 0 ? _a : utils_1.getClient()));
    return client.indices.create({ index: name, body: config });
}
exports.createIndex = createIndex;
function deleteIndex(options) {
    var _a;
    var name = options.name;
    var client = (_a = options.client, (_a !== null && _a !== void 0 ? _a : utils_1.getClient()));
    return client.indices["delete"]({ index: name });
}
exports.deleteIndex = deleteIndex;
