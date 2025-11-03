import { config } from "./env.config.js";
import { MeiliSearch } from "meilisearch";

export const meiliClient = new MeiliSearch({
    host: config.meili_host,
    //apiKey: config.meili_master_key,//env dev nen chua can => deploy can de protected
});
