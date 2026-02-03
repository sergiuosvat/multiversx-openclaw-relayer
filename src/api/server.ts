import express from "express";
import cors from "cors";
import { RelayerService } from "../services/RelayerService";
import { ChallengeManager } from "../services/ChallengeManager";
import { Transaction } from "@multiversx/sdk-core";

export const createApp = (relayerService: RelayerService, challengeManager: ChallengeManager) => {
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.get("/health", (req, res) => {
        res.status(200).json({ status: "ok" });
    });

    /**
     * Request a PoW challenge for a specific address.
     * Required for agents who are not yet registered.
     */
    app.post("/challenge", (req, res) => {
        const { address } = req.body;
        if (!address) {
            res.status(400).json({ error: "Address is required" });
            return;
        }

        const challenge = challengeManager.getChallenge(address);
        res.status(200).json(challenge);
    });

    app.post("/relay", async (req, res) => {
        try {
            const { transaction, challengeNonce } = req.body;

            if (!transaction) {
                res.status(400).json({ error: "Transaction is required" });
                return;
            }

            let tx: Transaction;
            try {
                tx = Transaction.newFromPlainObject(transaction);
            } catch (err: any) {
                res.status(400).json({ error: "Invalid transaction format", details: err.message });
                return;
            }

            const txHash = await relayerService.signAndRelay(tx, challengeNonce);
            res.status(200).json({ txHash });
        } catch (error: any) {
            console.error("Relay error:", error);
            const message = error.message || "Internal Server Error";

            if (message.includes("Quota exceeded")) {
                res.status(429).json({ error: message });
            } else if (message.includes("verification failed") || message.includes("Unauthorized")) {
                res.status(403).json({ error: message });
            } else if (message.includes("Invalid inner transaction")) {
                res.status(400).json({ error: message });
            } else {
                res.status(500).json({ error: message });
            }
        }
    });

    return app;
};
