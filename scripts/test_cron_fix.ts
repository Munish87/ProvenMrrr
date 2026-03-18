import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { TrustMRRImporter } from "../lib/services/trustmrrImporter";

async function run() {
    console.log("Starting local test of TrustMRRImporter...");
    const res = await TrustMRRImporter.importStartups();
    console.log("Result:", res);
}

run();
