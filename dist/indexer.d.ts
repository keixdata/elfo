import { Client } from "@elastic/elasticsearch";
export interface PropertyOptions {
    type?: string;
    searchPriority?: SearchPriorityLevel;
    customFields?: {
        [key: string]: any;
    };
    customOptions?: {
        [key: string]: any;
    };
}
/**
 * Search priority level, less the level, higher importance
 */
export declare enum SearchPriorityLevel {
    "NONE" = 0,
    "LEVEL_1" = 1,
    "LEVEL_2" = 2,
    "LEVEL_3" = 3,
    "LEVEL_4" = 4,
    "LEVEL_5" = 5
}
/**
 * Helper fn to map an elastic index property
 * @param options
 */
export declare function setProperty(options: PropertyOptions): {
    fields: {
        retrieve: {
            type: string;
            ignore_above: number;
        } | {
            type: string;
            ignore_above?: undefined;
        };
    };
    copy_to: string;
    type: string;
} | {
    fields: {
        fields: {
            [key: string]: any;
        };
    } | {
        fields?: undefined;
    };
    copy_to: string;
    type: string;
} | {
    fields: {
        retrieve: {
            type: string;
            ignore_above: number;
        } | {
            type: string;
            ignore_above?: undefined;
        };
    };
    copy_to?: undefined;
    type: string;
} | {
    fields: {
        fields: {
            [key: string]: any;
        };
    } | {
        fields?: undefined;
    };
    copy_to?: undefined;
    type: string;
};
export interface BuildIndexConfigOptions {
    properties: {
        [key: string]: any;
    };
    searchable?: boolean;
    customSettings?: {
        [key: string]: any;
    };
}
/**
 * Helper fn to build the config (settings, mappings) to create an elastic index
 * @param options
 */
export declare function buildIndexConfig(options: BuildIndexConfigOptions): {
    mappings: {
        dynamic: boolean;
        properties: {
            _search1: {
                type: string;
                analyzer: string;
                search_analyzer: string;
            };
            _search2: {
                type: string;
                analyzer: string;
                search_analyzer: string;
            };
            _search3: {
                type: string;
                analyzer: string;
                search_analyzer: string;
            };
            _search4: {
                type: string;
                analyzer: string;
                search_analyzer: string;
            };
            _search5: {
                type: string;
                analyzer: string;
                search_analyzer: string;
            };
        } | {
            _search1?: undefined;
            _search2?: undefined;
            _search3?: undefined;
            _search4?: undefined;
            _search5?: undefined;
        };
    };
};
export interface CreateIndexOptions {
    name: string;
    client?: Client;
    config: {
        settings?: {};
        mappings: {};
    };
}
export declare function createIndex(options: CreateIndexOptions): Promise<import("@elastic/elasticsearch").ApiResponse<any, any>>;
export interface DeleteIndexOptions {
    name: string;
    client?: Client;
}
export declare function deleteIndex(options: DeleteIndexOptions): Promise<import("@elastic/elasticsearch").ApiResponse<any, any>>;
