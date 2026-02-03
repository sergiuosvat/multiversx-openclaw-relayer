import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/api/server";
import { RelayerService } from "../src/services/RelayerService";
import { ChallengeManager } from "../src/services/ChallengeManager";

// Mock RelayerService
const mockSignAndRelay = vi.fn();
const mockRelayerService = {
    signAndRelay: mockSignAndRelay
} as unknown as RelayerService;

// Mock ChallengeManager
const mockGetChallenge = vi.fn();
const mockChallengeManager = {
    getChallenge: mockGetChallenge
} as unknown as ChallengeManager;

describe("API Server", () => {
    const app = createApp(mockRelayerService, mockChallengeManager);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("GET /health should return 200", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });

    it("POST /challenge should return a challenge", async () => {
        mockGetChallenge.mockReturnValue({ address: "abc", salt: "123", difficulty: 18 });
        const res = await request(app).post("/challenge").send({ address: "abc" });
        expect(res.status).toBe(200);
        expect(res.body.salt).toBe("123");
    });

    it("POST /relay should return 400 for invalid body", async () => {
        const res = await request(app).post("/relay").send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Transaction is required");
    });

    it("POST /relay should call signAndRelay and return hash", async () => {
        mockSignAndRelay.mockResolvedValue("tx-hash-123");

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

        const res = await request(app).post("/relay").send({
            transaction: plainTx,
            challengeNonce: "solved-nonce"
        });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ txHash: "tx-hash-123" });
        expect(mockSignAndRelay).toHaveBeenCalledWith(expect.anything(), "solved-nonce");
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
            version: 1
        };

        const res = await request(app).post("/relay").send({ transaction: plainTx });

        expect(res.status).toBe(429);
        expect(res.body.error).toContain("Quota exceeded");
    });
});
