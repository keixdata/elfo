import { Client } from "@elastic/elasticsearch";
import { OrderBy, Filters, PaginatedItems } from "./types";
export interface RetrieveParams {
    client?: Client;
    indexName: string;
    queryString?: string;
    fuzziness?: number | 'auto';
    cursor?: any;
    limit?: number;
    orderBy?: OrderBy[];
    filters?: Filters;
}
export declare function retrieve<Item = {}>(params: RetrieveParams): Promise<PaginatedItems<Item>>;
