import { Client } from '@elastic/elasticsearch';

export function getClient() {
  const node = process.env.ELASTIC_HOST ?? '127.0.0.1:9200';
  return new Client({ node });
}
