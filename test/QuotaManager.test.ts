import { describe, it, expect } from "vitest";
import { QuotaManager } from "../src/services/QuotaManager";

describe("QuotaManager", () => {
    it("should initialize correctly", () => {
        const quota = new QuotaManager(":memory:");
        expect(quota).toBeDefined();
    });

    it("should allow first transaction", () => {
        const quota = new QuotaManager(":memory:");
        expect(quota.checkLimit("erd1test...")).toBe(true);
    });

    it("should increment usage", () => {
        const quota = new QuotaManager(":memory:");
        expect(() => quota.incrementUsage("erd1test...")).not.toThrow();
    });
});
