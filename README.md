# MultiversX OpenClaw Relayer

A secure, high-performance general relayer service for OpenClaw agents on MultiversX.

## Features

- **Relayed V3 Support**: Wraps signed transactions into Relayed V3 transactions for gasless execution.
- **Identity Verification**: Enforces MX-8004 Registry checks to ensure only authorized agents can relay.
- **Sponsorship Logic**: Manages gas sponsorship for eligible agents.
- **TDD Architecture**: Built with Vitest and strict TDD practices.

## Installation

```bash
npm install
```

## Configuration

Set up your `.env` file:
```
NETWORK_PROVIDER=https://devnet-gateway.multiversx.com
RELAYER_PEM_PATH=./relayer.pem
IDENTITY_REGISTRY_ADDRESS=erd1...
```

## Usage (Library)

```typescript
import { RelayerService } from "./src/services/RelayerService";
// ... setup provider and signer ...
const relayer = new RelayerService(provider, signer);

const isValid = await relayer.validateTransaction(tx);
const txHash = await relayer.signAndRelay(tx);
```

## Testing

Run the test suite:
```bash
npm test
```
