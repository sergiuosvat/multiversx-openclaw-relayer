import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { RelayerAddressManager } from "./services/RelayerAddressManager";
import * as fs from "fs";
import { createApp } from "./api/server";
import { config } from "./config";
import { QuotaManager } from "./services/QuotaManager";
import { ChallengeManager } from "./services/ChallengeManager";
import { RelayerService } from "./services/RelayerService";


const main = async () => {
    console.log("Starting MultiversX OpenClaw Relayer...");
    console.log("Config:", JSON.stringify({ ...config, relayerPemPath: "***" }, null, 2));

    const provider = new ProxyNetworkProvider(config.networkProvider);

    // Initialize Address Manager
    const relayerAddressManager = new RelayerAddressManager(config.relayerWalletsDir);

    const quotaManager = new QuotaManager(config.dbPath, config.quotaLimit);
    const challengeManager = new ChallengeManager(config.challengeTimeout, config.challengeDifficulty);
    const relayerService = new RelayerService(
        provider,
        relayerAddressManager,
        quotaManager,
        challengeManager,
        [config.identityRegistryAddress, config.reputationRegistryAddress, config.validationRegistryAddress].filter(a => !!a)
    );

    const app = createApp(relayerService, challengeManager);

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
