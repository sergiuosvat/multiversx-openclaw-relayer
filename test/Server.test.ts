import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/api/server";
import { RelayerService } from "../src/services/RelayerService";
import { Transaction } from "@multiversx/sdk-core";

// Mock RelayerService
const mockSignAndRelay = vi.fn();
const mockRelayerService = {
    signAndRelay: mockSignAndRelay
} as unknown as RelayerService;

describe("API Server", () => {
    const app = createApp(mockRelayerService);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("GET /health should return 200", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });

    it("POST /relay should return 400 for invalid body", async () => {
        const res = await request(app).post("/relay").send(null);
        expect(res.status).toBe(400);
    });

    it("POST /relay should call signAndRelay and return hash", async () => {
        mockSignAndRelay.mockResolvedValue("tx-hash-123");

        // Minimal plain object that looks like a transaction
        // Transaction.newFromPlainObject needs a few fields
        const plainTx = {
            nonce: 10,
            value: "1000",
            receiver: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
            sender: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
            gasPrice: 1000000000,
            gasLimit: 50000,
            chainID: "D",
            version: 1
        };

        const res = await request(app).post("/relay").send(plainTx);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ txHash: "tx-hash-123" });
        expect(mockSignAndRelay).toHaveBeenCalled();
    });

    it("POST /relay should return 429 when quota exceeded", async () => {
        mockSignAndRelay.mockRejectedValue(new Error("Quota exceeded for this agent"));

        const plainTx = {
            nonce: 10,
            value: "0",
            receiver: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
            sender: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
            gasPrice: 1000000000,
            gasLimit: 50000,
            chainID: "D",
            version: 1,
            data: "base64EncodedData"
        };

        const res = await request(app).post("/relay").send(plainTx);

        expect(res.status).toBe(429);
        expect(res.body.error).toContain("Quota exceeded");
    });
});
