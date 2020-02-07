import { Client } from "@elastic/elasticsearch";
import { includes, keys, map, mapKeys, compact, isNumber } from "lodash";
import { getClient } from "./utils";
import {
  AttributeOperatorFilter,
  isAttributeValueFilter,
  isAttributeExistenceFilter,
  isAttributeGeoDistanceFilter,
  FilterBuilderInput,
  isFilter,
  isOperatorFilterArray,
  OrderBy,
  Filters,
  PaginatedItems
} from "./types";

/**
 * Build the component of an elastic query given an AttributeOperatorFilter
 * @param filter
 * @param attributeName
 */
function queryOperatorFilterBuilder(
  filter: AttributeOperatorFilter,
  attributeName: string
) {
  // Handle value filter
  if (isAttributeValueFilter(filter)) {
    const { op, value } = filter;

    const rangeOperators = {
      ">": "gt",
      ">=": "gte",
      "<": "lt",
      "<=": "lte"
    };

    const isEqualQuery = op === "=";
    const isNotEqualQuery = op === "!=";
    const isRangeQuery = includes(keys(rangeOperators), op);
    const isPrefixQuery = op === "startsWith";
    const isMatchQuery = op === "match";

    if (isEqualQuery) {
      return { filter: { term: { [`${attributeName}.retrieve`]: value } } };
    }
    if (isNotEqualQuery) {
      return { must_not: { term: { [`${attributeName}.retrieve`]: value } } };
    }
    if (isRangeQuery) {
      return {
        filter: {
          range: {
            [`${attributeName}.retrieve`]: { [rangeOperators[op]]: value }
          }
        }
      };
    }
    if (isPrefixQuery) {
      return { filter: { prefix: { [`${attributeName}.retrieve`]: value } } };
    }
    if (isMatchQuery) {
      return { filter: { match: { [attributeName]: value } } };
    }
  }

  // Handle existence filter
  if (isAttributeExistenceFilter(filter)) {
    const { op } = filter;

    const isExistsQuery = op === "exists";
    const isNotExistsQuery = op === "notExists";

    if (isExistsQuery) {
      return { filter: { exists: { field: `${attributeName}.retrieve` } } };
    }
    if (isNotExistsQuery) {
      return { must_not: { exists: { field: `${attributeName}.retrieve` } } };
    }
  }

  // Handle geoDistance filter
  if (isAttributeGeoDistanceFilter(filter)) {
    const { distance, origin, unit } = filter;

    return {
      filter: {
        geo_distance: {
          distance: `${distance}${unit}`,
          [attributeName]: origin
        }
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
const queryFilterBuilder = (
  filter: FilterBuilderInput,
  attributeName?: string
) => {
  const { op, filters } = filter;

  // If it's a Filter type, get the attributeName from that
  if (isFilter(filter)) {
    attributeName = filter.attributeName;
  }

  const attributeNameError = () =>
    new Error("Code error! No attributeName set");

  if (op == null || filters.length === 1) {
    // Operator could be omitted only if there is a single filter
    if (filters.length !== 1) {
      throw new Error("Operator is missing");
    }

    if (isOperatorFilterArray(filters)) {
      if (attributeName == null) {
        throw attributeNameError();
      }
      return queryOperatorFilterBuilder(filters[0], attributeName);
    }
    return queryFilterBuilder(filters[0], attributeName);
  }

  if (op === "or") {
    // If children filters are OperatorFilterArray call the queryOperatorFilterBuilder, else call this recursively
    const should = isOperatorFilterArray(filters)
      ? map(filters, c => {
          if (attributeName == null) {
            throw attributeNameError();
          }
          return { bool: queryOperatorFilterBuilder(c, attributeName) };
        })
      : map(filters, c => ({ bool: queryFilterBuilder(c, attributeName) }));

    return { should, minimum_should_match: 1 };
  }

  if (op === "and") {
    if (isOperatorFilterArray(filters)) {
      return filters.reduce((prev, c) => {
        if (attributeName == null) {
          throw attributeNameError();
        }
        const res = queryOperatorFilterBuilder(c, attributeName);
        if (res.filter) {
          prev.filter = [...(prev.filter || []), res.filter];
        }
        if (res.must_not) {
          prev.must_not = [...(prev.must_not || []), res.must_not];
        }
        return prev;
      }, {} as { filter?: {}[]; must_not?: {}[] });
    }
    return {
      must: map(filters, c => ({ bool: queryFilterBuilder(c, attributeName) }))
    };
  }
};

export interface RetrieveParams {
  client?: Client;
  indexName: string;
  queryString?: string;
  cursor?: any;
  limit?: number;
  orderBy?: OrderBy[];
  filters?: Filters;
}

export async function retrieve<Item = {}>(
  params: RetrieveParams
): Promise<PaginatedItems<Item>> {
  // Build the elastic query component to retrieve the items accordingly to given filters
  const filterComponent = params.filters
    ? { bool: queryFilterBuilder(params.filters) }
    : { match_all: {} };

  // Build the elastic query component to perform a search
  const searchComponent = params.queryString
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

  // Build the elastic query, composing above components
  const query = {
    bool: {
      filter: [filterComponent],
      must: searchComponent
    }
  };

  // Map on attributeName inside orderBy the multifield <attributeName>.retrieve
  // Because we can sort only by this field
  const orderBy = params.orderBy ?? [];
  const orderByMapped = orderBy.map(o => mapKeys(o, (_, k) => `${k}.retrieve`));
  const sort: OrderBy[] = compact([...orderByMapped, { _id: "desc" }]);

  // Build searchAfter, if cursor given
  const searchAfter =
    params.cursor != null
      ? sort.map(v => {
          // Get the cursor attribute value of sort attribute (k)
          const c = params.cursor[keys(v)[0]];

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
          if (isNumber(c)) {
            return Number.isInteger(c) && !Number.isSafeInteger(c)
              ? `-9223372036854775808`
              : c;
          }

          // Just return c.
          return c;
        })
      : undefined;

  const client = params.client ?? getClient();
  const size = params.limit ?? 25;

  const response: any = await client.search({
    index: params.indexName,
    body: {
      query,
      sort,
      size,
      search_after: searchAfter
    }
  });

  if (response.statusCode !== 200) {
    throw new Error(JSON.stringify(response.meta));
  }

  const hits = response.body.hits.hits;
  const total = response.body.hits.total.value;

  const items: Item[] = hits.map(i => i._source);

  // If more items, we have to build the endCursor
  const moreItems = hits.length < total;
  let endCursor = undefined;
  if (moreItems) {
    const cursor = hits[hits.length - 1].sort || [];
    endCursor = sort.reduce(
      (p, v, i) => ({ ...p, [keys(v)[0]]: cursor[i] }),
      {}
    );
  }

  const page: PaginatedItems<Item> = {
    items,
    pageInfo: { endCursor, size: items.length, total }
  };

  return page;
}
