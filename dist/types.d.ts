export declare type BooleanOperator = "or" | "and";
export declare type FilterValueOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "match" | "startsWith";
export declare type FilterExistenceOperator = "exists" | "notExists";
export declare type FilterGeoDistanceOperator = "geoDistance";
export declare type FilterOperator = FilterValueOperator | FilterExistenceOperator | FilterGeoDistanceOperator;
export declare enum FilterOperators {
    "=" = "=",
    "!=" = "!=",
    ">" = ">",
    ">=" = ">=",
    "<" = "<",
    "<=" = "<=",
    "match" = "match",
    "startsWith" = "startsWith",
    "exists" = "exists",
    "notExists" = "notExists",
    "geoDistance" = "geoDistance"
}
export interface Filters {
    op?: BooleanOperator;
    filters: (Filter | BooleanFilter)[];
}
export interface Filter {
    attributeName: string;
    op?: BooleanOperator;
    filters: AttributeFilter[] | AttributeOperatorFilter[];
}
export interface BooleanFilter {
    op: BooleanOperator;
    filters: (Filter | BooleanFilter)[];
}
export interface AttributeFilter {
    op?: BooleanOperator;
    filters: AttributeFilter[] | AttributeOperatorFilter[];
}
export declare type AttributeOperatorFilter = AttributeValueFilter | AttributeExistenceFilter | AttributeGeoDistanceFilter;
export interface AttributeValueFilter {
    op: FilterValueOperator;
    value: string | number;
}
export interface AttributeExistenceFilter {
    op: FilterExistenceOperator;
}
export interface AttributeGeoDistanceFilter {
    op: FilterGeoDistanceOperator;
    origin: Coordinates;
    distance: number;
    unit: ElasticDistanceUnit;
}
export interface Coordinates {
    lat: number;
    lon: number;
}
export declare type ElasticDistanceUnitMiles = "mi" | "miles";
export declare type ElasticDistanceUnitYards = "yd" | "yards";
export declare type ElasticDistanceUnitFeet = "ft" | "feet";
export declare type ElasticDistanceUnitInch = "in" | "inch";
export declare type ElasticDistanceUnitKM = "km" | "kilometers";
export declare type ElasticDistanceUnitMeters = "m" | "meters";
export declare type ElasticDistanceUnitCM = "cm" | "centimeters";
export declare type ElasticDistanceUnitMM = "mm" | "millimeters";
export declare type ElasticDistanceUnitNM = "nm" | "nmi" | "nauticalmiles";
export declare type ElasticDistanceUnit = ElasticDistanceUnitMiles | ElasticDistanceUnitYards | ElasticDistanceUnitFeet | ElasticDistanceUnitInch | ElasticDistanceUnitKM | ElasticDistanceUnitMeters | ElasticDistanceUnitCM | ElasticDistanceUnitMM | ElasticDistanceUnitNM;
export interface OrderBy {
    [key: string]: "asc" | "desc";
}
export interface PageInfo {
    endCursor?: any;
    size?: number;
    total?: number;
}
export interface PaginatedItems<Item> {
    pageInfo?: PageInfo;
    items: Item[];
}
export declare function isBooleanFilter(filter: Filter | BooleanFilter): filter is BooleanFilter;
export declare function isAttributeValueFilter(filter: AttributeOperatorFilter): filter is AttributeValueFilter;
export declare function isAttributeExistenceFilter(filter: AttributeOperatorFilter): filter is AttributeExistenceFilter;
export declare function isAttributeGeoDistanceFilter(filter: AttributeOperatorFilter): filter is AttributeGeoDistanceFilter;
export declare type FilterBuilderInput = Filters | Filter | BooleanFilter | AttributeFilter;
export declare function isFilter(filter: FilterBuilderInput): filter is Filter;
export declare function isOperatorFilterArray(filters: any): filters is AttributeOperatorFilter[];
