import { describe, it, expect, beforeEach } from "vitest";
import { RelayerService } from "../src/services/RelayerService";
import { Transaction, Address, TransactionComputer } from "@multiversx/sdk-core";
import { UserSigner, Mnemonic, UserVerifier, UserPublicKey } from "@multiversx/sdk-wallet";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { QuotaManager } from "../src/services/QuotaManager";

describe("RelayerService", () => {
    let relayer: RelayerService;
    let quotaManager: QuotaManager;
    let mockProvider: ProxyNetworkProvider;
    let relayerSigner: UserSigner;

    beforeEach(() => {
        mockProvider = {
            sendTransaction: async (tx: any) => "mock-tx-hash",
            queryContract: async (query: any) => {
                // Mock response mimicking a successful query (returning some data)
                return { returnData: ["base64EncodedData"] };
            }
        } as unknown as ProxyNetworkProvider;

        const mnemonic = Mnemonic.generate();
        relayerSigner = new UserSigner(mnemonic.deriveKey(0));
        quotaManager = new QuotaManager(":memory:", 10);

        relayer = new RelayerService(mockProvider, relayerSigner, quotaManager, "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu");
    });

    it("should validate a correct transaction", async () => {
        const mnemonic = Mnemonic.generate();
        const signer = new UserSigner(mnemonic.deriveKey(0));
        const sender = Address.newFromBech32(signer.getAddress().bech32());

        const tx = new Transaction({
            nonce: 1n,
            value: 0n,
            receiver: sender,
            sender: sender,
            gasLimit: 50000n,
            chainID: "D",
            version: 1,
        });

        const computer = new TransactionComputer();
        const signature = await signer.sign(computer.computeBytesForSigning(tx));
        tx.signature = signature;

        // Local verification test
        const publicKey = new UserPublicKey(tx.sender.getPublicKey());
        const verifier = new UserVerifier(publicKey);
        const isValidLocally = verifier.verify(computer.computeBytesForSigning(tx), tx.signature);
        expect(isValidLocally).toBe(true);

        await expect(relayer.validateTransaction(tx)).resolves.toBe(true);
    });

    it("should check eligibility correctly", async () => {
        const sender = Address.newFromBech32("erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu");
        await expect(relayer.checkEligibility(sender)).resolves.toBe(true);
    });

    it("should sign and relay a transaction", async () => {
        const mnemonic = Mnemonic.generate();
        const signer = new UserSigner(mnemonic.deriveKey(0));
        const sender = Address.newFromBech32(signer.getAddress().bech32());

        const tx = new Transaction({
            nonce: 1n,
            value: 0n,
            receiver: sender,
            sender: sender,
            gasLimit: 50000n,
            chainID: "D",
            version: 1,
        });
        const computer = new TransactionComputer();
        const signature = await signer.sign(computer.computeBytesForSigning(tx));
        tx.signature = signature;

        await expect(relayer.signAndRelay(tx)).resolves.toBe("mock-tx-hash");
    });

    it("should reject transaction when quota exceeded", async () => {
        const mnemonic = Mnemonic.generate();
        const signer = new UserSigner(mnemonic.deriveKey(0));
        const sender = Address.newFromBech32(signer.getAddress().bech32());
        const senderBech32 = sender.toBech32();

        // Exhaust quota (limit is 10)
        for (let i = 0; i < 10; i++) {
            quotaManager.incrementUsage(senderBech32);
        }

        const tx = new Transaction({
            nonce: 1n,
            value: 0n,
            receiver: sender,
            sender: sender,
            gasLimit: 50000n,
            chainID: "D",
            version: 1,
        });
        const computer = new TransactionComputer();
        const signature = await signer.sign(computer.computeBytesForSigning(tx));
        tx.signature = signature;

        await expect(relayer.validateTransaction(tx)).resolves.toBe(true);
        await expect(relayer.signAndRelay(tx)).rejects.toThrow("Quota exceeded for this agent");
    });
});
