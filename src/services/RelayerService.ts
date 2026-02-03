import { Transaction, Address, TransactionComputer } from "@multiversx/sdk-core";
import { UserVerifier, UserSigner, UserPublicKey } from "@multiversx/sdk-wallet";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { QuotaManager } from "./QuotaManager";

export class RelayerService {
    private provider: ProxyNetworkProvider;
    private relayerSigner: UserSigner;
    private quotaManager: QuotaManager;

    constructor(provider: ProxyNetworkProvider, relayerSigner: UserSigner, quotaManager: QuotaManager) {
        this.provider = provider;
        this.relayerSigner = relayerSigner;
        this.quotaManager = quotaManager;
    }

    async validateTransaction(tx: Transaction): Promise<boolean> {
        try {
            const publicKey = new UserPublicKey(tx.sender.getPublicKey());
            const verifier = new UserVerifier(publicKey);

            const computer = new TransactionComputer();
            const message = computer.computeBytesForSigning(tx);
            const isValid = verifier.verify(message, tx.signature);

            return isValid;
        } catch (error) {
            console.error("Validation error:", error);
            return false;
        }
    }

    async checkEligibility(sender: Address): Promise<boolean> {
        // TODO: Query Identity Registry contract
        return true;
    }

    async signAndRelay(tx: Transaction): Promise<string> {
        // 1. Check Quota
        const sender = tx.sender;
        if (!this.quotaManager.checkLimit(sender.toBech32())) {
            throw new Error("Quota exceeded for this agent");
        }

        // 2. Validate inner transaction (optional but good practice)
        if (!(await this.validateTransaction(tx))) {
            throw new Error("Invalid inner transaction signature");
        }

        // 3. Wrap as Relayed V3
        const relayerAddress = this.relayerSigner.getAddress();
        tx.relayer = Address.newFromBech32(relayerAddress.bech32());

        // Ensure version is correct.
        if (tx.version < 2) {
            tx.version = 2;
        }

        const computer = new TransactionComputer();
        const relayerSignature = await this.relayerSigner.sign(computer.computeBytesForSigning(tx));
        tx.relayerSignature = relayerSignature;

        // 4. Broadcast
        try {
            const hash = await this.provider.sendTransaction(tx);
            this.quotaManager.incrementUsage(sender.toBech32());
            return hash;
        } catch (error) {
            console.error("Broadcast failed:", error);
            throw error;
        }
    }
}
