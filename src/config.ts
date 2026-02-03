import dotenv from "dotenv";
import path from "path";

// Load .env file from root
dotenv.config({ path: path.join(__dirname, "../../.env") });

export interface AppConfig {
    networkProvider: string;
    identityRegistryAddress: string;
    quotaLimit: number;
    dbPath: string;
    relayerPemPath: string;
    port: number;
}

export const config: AppConfig = {
    networkProvider: process.env.NETWORK_PROVIDER || "https://devnet-gateway.multiversx.com",
    identityRegistryAddress: process.env.IDENTITY_REGISTRY_ADDRESS || "",
    quotaLimit: parseInt(process.env.QUOTA_LIMIT || "10", 10),
    dbPath: process.env.DB_PATH || ":memory:",
    relayerPemPath: process.env.RELAYER_PEM_PATH || "relayer.pem",
    port: parseInt(process.env.PORT || "3000", 10)
};
