import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { UserSigner } from "@multiversx/sdk-wallet";
import * as fs from "fs";
import { createApp } from "./api/server";
import { config } from "./config";
import { QuotaManager } from "./services/QuotaManager";
import { RelayerService } from "./services/RelayerService";

// Helper to load PEM
const getRelayerSigner = (): UserSigner => {
    if (!fs.existsSync(config.relayerPemPath)) {
        console.warn(`PEM not found at ${config.relayerPemPath}, generating random for DEV...`);
        // For dev/test only if file missing. In prod, we should fail.
        if (process.env.NODE_ENV === "production") {
            throw new Error(`PEM file strictly required in production: ${config.relayerPemPath}`);
        }
        const { Mnemonic } = require("@multiversx/sdk-wallet"); // Lazy load
        return new UserSigner(Mnemonic.generate().deriveKey(0));
    }
    const pemContent = fs.readFileSync(config.relayerPemPath, { encoding: "utf8" });
    return UserSigner.fromPem(pemContent);
};

const main = async () => {
    console.log("Starting MultiversX OpenClaw Relayer...");
    console.log("Config:", JSON.stringify({ ...config, relayerPemPath: "***" }, null, 2));

    const provider = new ProxyNetworkProvider(config.networkProvider);
    const relayerSigner = getRelayerSigner();

    console.log(`Relayer Address: ${relayerSigner.getAddress().bech32()}`);

    const quotaManager = new QuotaManager(config.dbPath, config.quotaLimit);
    const relayerService = new RelayerService(provider, relayerSigner, quotaManager, config.identityRegistryAddress);

    const app = createApp(relayerService);

    app.listen(config.port, () => {
        console.log(`Server listening on port ${config.port}`);
    });
};

if (require.main === module) {
    main().catch(err => {
        console.error("Fatal error:", err);
        process.exit(1);
    });
}
