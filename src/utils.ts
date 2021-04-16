import { Client } from "@elastic/elasticsearch";
import { createElasticClient } from "@keixdata/common";

export function getClient() {
  return createElasticClient();
}
