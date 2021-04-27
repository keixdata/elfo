import { includes } from "lodash";

export type BooleanOperator = "or" | "and";

export type FilterValueOperator =
  | "="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "match"
  | "contains"
  | "startsWith";

export type FilterExistenceOperator = "exists" | "notExists";
export type FilterGeoDistanceOperator = "geoDistance";

export type FilterOperator =
  | FilterValueOperator
  | FilterExistenceOperator
  | FilterGeoDistanceOperator;

export enum FilterOperators {
  "=" = "=",
  "!=" = "!=",
  ">" = ">",
  ">=" = ">=",
  "<" = "<",
  "<=" = "<=",
  "match" = "match",
  "contains" = "contains",
  "startsWith" = "startsWith",
  "exists" = "exists",
  "notExists" = "notExists",
  "geoDistance" = "geoDistance",
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

export type AttributeOperatorFilter =
  | AttributeValueFilter
  | AttributeExistenceFilter
  | AttributeGeoDistanceFilter;

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

export type ElasticDistanceUnitMiles = "mi" | "miles";
export type ElasticDistanceUnitYards = "yd" | "yards";
export type ElasticDistanceUnitFeet = "ft" | "feet";
export type ElasticDistanceUnitInch = "in" | "inch";
export type ElasticDistanceUnitKM = "km" | "kilometers";
export type ElasticDistanceUnitMeters = "m" | "meters";
export type ElasticDistanceUnitCM = "cm" | "centimeters";
export type ElasticDistanceUnitMM = "mm" | "millimeters";
export type ElasticDistanceUnitNM = "nm" | "nmi" | "nauticalmiles";
export type ElasticDistanceUnit =
  | ElasticDistanceUnitMiles
  | ElasticDistanceUnitYards
  | ElasticDistanceUnitFeet
  | ElasticDistanceUnitInch
  | ElasticDistanceUnitKM
  | ElasticDistanceUnitMeters
  | ElasticDistanceUnitCM
  | ElasticDistanceUnitMM
  | ElasticDistanceUnitNM;

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

export function isBooleanFilter(
  filter: Filter | BooleanFilter
): filter is BooleanFilter {
  return !("attributeName" in filter);
}

export function isAttributeValueFilter(
  filter: AttributeOperatorFilter
): filter is AttributeValueFilter {
  const op = filter.op;
  return (
    op === "=" ||
    op === "!=" ||
    op === ">" ||
    op === ">=" ||
    op === "<" ||
    op === "<=" ||
    op === "startsWith" ||
    op === "contains" ||
    op === "match"
  );
}

export function isAttributeExistenceFilter(
  filter: AttributeOperatorFilter
): filter is AttributeExistenceFilter {
  const op = filter.op;
  return op === "exists" || op === "notExists";
}

export function isAttributeGeoDistanceFilter(
  filter: AttributeOperatorFilter
): filter is AttributeGeoDistanceFilter {
  const op = filter.op;
  return op === "geoDistance";
}

export type FilterBuilderInput =
  | Filters
  | Filter
  | BooleanFilter
  | AttributeFilter;

export function isFilter(filter: FilterBuilderInput): filter is Filter {
  return (filter as Filter).attributeName != null;
}

export function isOperatorFilterArray(
  filters: any
): filters is AttributeOperatorFilter[] {
  if (filters.length === 0) {
    throw new Error("Invalid filters");
  }

  // It's a value filter if operator is a Filter Operator
  return includes(FilterOperators, filters[0].op);
}
