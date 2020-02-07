import { Client } from "@elastic/elasticsearch";

export function getClient() {
  const host = process.env.ELASTIC_HOST ?? "127.0.0.1";
  const port = parseInt(process.env.ELASTIC_PORT ?? "9200");
  return new Client({ node: `${host}:${port}` });
}
