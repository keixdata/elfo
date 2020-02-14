import { getClient } from "../src/utils";
import {
  createIndex,
  buildIndexConfig,
  setProperty,
  deleteIndex
} from "../src/indexer";
import { retrieve } from "../src/retrieve";
import { times, every, includes } from "lodash";

// TODO: Add test for geoDistance operator

const indexName = "elfo-test";
const client = getClient();
const items = times(10, n => ({
  string: `${n < 5 ? "my" : "your"}String${n} is awesome`,
  number: n,
  exists: n % 2 == 0 ? true : null
}));

beforeAll(async () => {
  // Create elastic index
  const config = buildIndexConfig({
    properties: {
      string: setProperty({}),
      number: setProperty({ type: "integer" }),
      exists: setProperty({ type: "boolean" })
    }
  });
  await createIndex({ name: indexName, config, client });

  // Populate it
  await Promise.all(
    items.map(item => client.index({ index: indexName, body: item }))
  );

  // Force index refresh to be sure items are actually indexed
  await client.indices.refresh({ index: indexName });
});

afterAll(async () => {
  await deleteIndex({ name: indexName, client });
});

test("it should retrieve all items (10)", async () => {
  const page = await retrieve({ client, indexName });
  expect(page.items.length).toEqual(10);
});

test("it should retrieve paginated items", async () => {
  const page = await retrieve({ client, indexName, limit: 3 });
  const cursor = page.pageInfo?.endCursor;
  expect(page.items.length).toEqual(3);
  expect(cursor == null).toBeFalsy();

  const secondPage = await retrieve({ client, indexName, cursor });
  const secondCursor = secondPage.pageInfo?.endCursor;
  expect(secondPage.items.length).toEqual(7);
  expect(secondCursor == null).toBeTruthy();
});

test("it should retrieve items ordered", async () => {
  const page = await retrieve({
    client,
    indexName,
    orderBy: [{ number: "asc" }]
  });
  const expected = times(10, n => n);
  expect(page.items.map(i => i["number"])).toEqual(expected);
});

test("it should search for items by queryString", async () => {
  const page = await retrieve({
    client,
    indexName,
    queryString: "8"
  });
  expect(page.items.map(i => i["number"] == 8)).not.toEqual(
    expect.arrayContaining([false])
  );
});

test("it should retrieve items filtered by = operator", async () => {
  const page = await retrieve({
    client,
    indexName,
    filters: {
      filters: [{ attributeName: "number", filters: [{ op: "=", value: 5 }] }]
    }
  });
  expect(page.items.map(i => i["number"] == 5)).not.toEqual(
    expect.arrayContaining([false])
  );
});

test("it should retrieve items filtered by != operator", async () => {
  const page = await retrieve({
    client,
    indexName,
    filters: {
      filters: [{ attributeName: "number", filters: [{ op: "!=", value: 5 }] }]
    }
  });
  expect(page.items.map(i => i["number"])).not.toEqual(
    expect.arrayContaining([5])
  );
});

test("it should retrieve items filtered by >, < operators", async () => {
  const page = await retrieve({
    client,
    indexName,
    filters: {
      filters: [
        {
          attributeName: "number",
          op: "and",
          filters: [
            { op: ">", value: 3 },
            { op: "<", value: 6 }
          ]
        }
      ]
    }
  });
  expect(page.items.map(i => i["number"] > 3 && i["number"] < 6)).not.toEqual(
    expect.arrayContaining([false])
  );
});

test("it should retrieve items filtered by >=, <= operators", async () => {
  const page = await retrieve({
    client,
    indexName,
    filters: {
      filters: [
        {
          attributeName: "number",
          op: "and",
          filters: [
            { op: ">=", value: 3 },
            { op: "<=", value: 6 }
          ]
        }
      ]
    }
  });
  expect(page.items.map(i => i["number"] >= 3 && i["number"] <= 6)).not.toEqual(
    expect.arrayContaining([false])
  );
});

test("it should retrieve items filtered by match operator", async () => {
  const matchValue = "myString0";
  const page = await retrieve({
    client,
    indexName,
    filters: {
      filters: [
        {
          attributeName: "string",
          filters: [{ op: "match", value: matchValue }]
        }
      ]
    }
  });
  expect(
    page.items.map(i => includes(i["string"].split(" "), matchValue))
  ).not.toEqual(expect.arrayContaining([false]));
});

test("it should retrieve items filtered by startsWith operator", async () => {
  const matchValue = "myString";
  const page = await retrieve({
    client,
    indexName,
    filters: {
      filters: [
        {
          attributeName: "string",
          filters: [{ op: "startsWith", value: matchValue }]
        }
      ]
    }
  });
  expect(page.items.map(i => i["string"].startsWith(matchValue))).not.toEqual(
    expect.arrayContaining([false])
  );
});

test("it should retrieve items filtered by exists operator", async () => {
  const page = await retrieve({
    client,
    indexName,
    filters: {
      filters: [
        {
          attributeName: "exists",
          filters: [{ op: "exists" }]
        }
      ]
    }
  });
  expect(page.items.map(i => i["exists"] == true)).not.toEqual(
    expect.arrayContaining([false])
  );
});

test("it should retrieve items filtered by notExists operator", async () => {
  const page = await retrieve({
    client,
    indexName,
    filters: {
      filters: [
        {
          attributeName: "exists",
          filters: [{ op: "notExists" }]
        }
      ]
    }
  });
  expect(page.items.map(i => i["exists"] == null)).not.toEqual(
    expect.arrayContaining([false])
  );
});

test("it should retrieve items filtered by complex nested filter", async () => {
  // Test the following condition
  // (exists and (number < 0 or number >= 4)) or (startsWith("myString") and number == 3)
  const page = await retrieve({
    client,
    indexName,
    filters: {
      op: "or",
      filters: [
        {
          op: "and",
          filters: [
            {
              attributeName: "exists",
              filters: [{ op: "exists" }]
            },
            {
              attributeName: "number",
              op: "or",
              filters: [
                { op: "<", value: 0 },
                { op: ">=", value: 4 }
              ]
            }
          ]
        },
        {
          op: "and",
          filters: [
            {
              attributeName: "string",
              filters: [{ op: "startsWith", value: "myString" }]
            },
            { attributeName: "number", filters: [{ op: "=", value: 3 }] }
          ]
        }
      ]
    }
  });

  const checkItemConditions = item =>
    (item["exists"] && (item["number"] < 0 || item["number"] >= 4)) ||
    (item["string"].startsWith("myString") && item["number"] == 3);

  expect(page.items.map(i => checkItemConditions(i))).not.toEqual(
    expect.arrayContaining([false])
  );
});
