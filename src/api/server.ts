import express from "express";
import cors from "cors";
import { RelayerService } from "../services/RelayerService";
import { Transaction } from "@multiversx/sdk-core";

export const createApp = (relayerService: RelayerService) => {
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.get("/health", (req, res) => {
        res.status(200).json({ status: "ok" });
    });

    app.post("/relay", async (req, res) => {
        try {
            const txData = req.body;

            if (!txData || typeof txData !== "object") {
                res.status(400).json({ error: "Invalid transaction payload" });
                return;
            }

            // Reconstruct transaction from plain object
            // We assume the client sends a plain object manageable by Transaction.newFromPlainObject
            // or we might need to be careful about what newFromPlainObject expects.
            // Let's wrap in try/catch specifically for parsing.
            let tx: Transaction;
            try {
                tx = Transaction.newFromPlainObject(txData);
            } catch (err: any) {
                res.status(400).json({ error: "Invalid transaction format", details: err.message });
                return;
            }

            const txHash = await relayerService.signAndRelay(tx);
            res.status(200).json({ txHash });
        } catch (error: any) {
            console.error("Relay error:", error);
            const message = error.message || "Internal Server Error";

            if (message.includes("Quota exceeded")) {
                res.status(429).json({ error: message });
            } else if (message.includes("Invalid inner transaction")) {
                res.status(400).json({ error: message });
            } else {
                res.status(500).json({ error: message });
            }
        }
    });

    return app;
};
