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

import { Client } from "@elastic/elasticsearch";

export interface PropertyOptions {
  type?: string;
  searchPriority?: SearchPriorityLevel;
  customFields?: { [key: string]: any };
  customOptions?: { [key: string]: any };
}

/**
 * Search priority level, less the level, higher importance
 */
export enum SearchPriorityLevel {
  "NONE" = 0,
  "LEVEL_1" = 1,
  "LEVEL_2" = 2,
  "LEVEL_3" = 3,
  "LEVEL_4" = 4,
  "LEVEL_5" = 5,
}

/**
 * Helper fn to map an elastic index property
 * @param options
 */
export function setProperty(options: PropertyOptions) {
  const type = options.type ?? "text";
  const searchPriority = options.searchPriority ?? 3;
  const customOptions = options.customOptions ?? {};

  const copyTo =
    searchPriority !== SearchPriorityLevel.NONE
      ? { copy_to: `_search${searchPriority}` }
      : {};

  const customfieldsSetting = options.customFields
    ? { fields: options.customFields }
    : {};

  const fieldsSetting =
    type !== "geo_point"
      ? {
          fields: {
            ...(options.customFields ?? {}),

            // Add a field to enable sorting on each indexed field
            retrieve:
              type === "text"
                ? { type: "keyword", ignore_above: 256 }
                : { type },
          },
        }
      : { fields: customfieldsSetting };

  return { type, ...copyTo, ...fieldsSetting, ...customOptions };
}

/**
 * Index mapping setting to enable autocomplete search
 */
const autocompleteSearchSettings = {
  max_ngram_diff: 20,
  analysis: {
    filter: {
      ngram_filter: {
        type: "ngram",
        min_gram: 1,
        max_gram: 20,
        token_chars: ["letter", "digit"],
      },
    },
    analyzer: {
      ngram_analyzer: {
        type: "custom",
        tokenizer: "whitespace",
        filter: ["lowercase", "asciifolding", "ngram_filter"],
      },
      whitespace_analyzer: {
        type: "custom",
        tokenizer: "whitespace",
        filter: ["lowercase", "asciifolding"],
      },
      email_analyzer: {
        type: "custom",
        tokenizer: "uax_url_email",
        filter: ["lowercase"],
      },
    },
  },
};

export interface BuildIndexConfigOptions {
  properties: { [key: string]: any };
  searchable?: boolean;
  customSettings?: { [key: string]: any };
}

/**
 * Helper fn to build the config (settings, mappings) to create an elastic index
 * @param options
 */
export function buildIndexConfig(options: BuildIndexConfigOptions) {
  const customSettings = options.customSettings ?? {};
  const searchable = options.searchable ?? true;

  const settings = searchable
    ? { settings: { ...autocompleteSearchSettings, ...customSettings } }
    : customSettings;

  const searchableFieldParams = {
    type: "text",
    analyzer: "ngram_analyzer",
    search_analyzer: "whitespace_analyzer",
  };

  const search = searchable
    ? {
        _search1: searchableFieldParams,
        _search2: searchableFieldParams,
        _search3: searchableFieldParams,
        _search4: searchableFieldParams,
        _search5: searchableFieldParams,
      }
    : {};

  const mappings = {
    dynamic: false,
    properties: { ...options.properties, ...search },
  };

  return { ...settings, mappings };
}

export interface CreateIndexOptions {
  name: string;
  client: Client;
  config: { settings?: {}; mappings: {} };
}

export function createIndex(options: CreateIndexOptions) {
  const { name, config } = options;
  const client = options.client;
  return client.indices.create({ index: name, body: config });
}

export interface DeleteIndexOptions {
  name: string;
  client: Client;
}

export function deleteIndex(options: DeleteIndexOptions) {
  const { name } = options;
  const client = options.client;
  return client.indices.delete({ index: name });
}
