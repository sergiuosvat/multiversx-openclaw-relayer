# Production Readiness Implementation Plan

**Goal:** Transform the Relayer Library into a production-ready Service with API, Config, and Verification.

**Architecture:**
- **Service Layer:** `express` API for receiving transactions.
- **Config:** `dotenv` based configuration with `src/config.ts`.
- **Logic:** Real on-chain verification in `checkEligibility`.

**Tech Stack:** `express`, `dotenv`, `@multiversx/sdk-core`

---

### Task 1: Configuration & Cleanup

**Files:**
- Create: `src/config.ts`
- Modify: `src/services/QuotaManager.ts`, `src/services/RelayerService.ts`
- Test: `test/Config.test.ts` (New)

**Step 1: Install dependencies**
Run: `npm install dotenv`
Run: `npm install -D @types/node`
(DONE)

**Step 2: Create config module**
Create `src/config.ts` exporting:
- `NETWORK_PROVIDER`
- `RELAYER_PEM`
- `IDENTITY_REGISTRY`
- `QUOTA_LIMIT` (default 10)
- `DB_PATH`
(DONE)

**Step 3: Refactor Services to use Config**
Update `QuotaManager` and `RelayerService` to use values from `config.ts` instead of hardcoded strings/numbers.
(DONE)

**Step 4: Verify Refactor**
Run: `npm test`
Expected: PASS (existing tests should still pass with default/mocked config)
(DONE)


### Task 2: API Server Implementation

**Files:**
- Create: `src/api/server.ts`, `src/index.ts`
- Test: `test/Server.test.ts`

**Step 1: Install Express types**
Run: `npm install -D @types/express @types/supertest supertest`

**Step 2: Create Server Structure**
Implement `src/api/server.ts` with:
- `POST /relay`: Accepts `{ transaction: plainObject }`.
- `GET /health`: Returns 200 OK.

**Step 3: Integrate RelayerService**
In `/relay` handler:
- Reconstruct `Transaction` from body.
- Call `relayerService.signAndRelay`.
- Return hash or error.

**Step 4: Write Server Tests**
Create `test/Server.test.ts` using `supertest` to verify endpoints.


### Task 3: Real Agent Verification

**Files:**
- Modify: `src/services/RelayerService.ts`
- Test: `test/RelayerService.test.ts`

**Step 1: Implement Smart Contract Query**
In `checkEligibility`:
- Use `SmartContract` from `sdk-core`.
- Query `getAgentId(address)` (or relevant view).
- Return true if valid ID returned.

**Step 2: Mock Network Call in Tests**
Update `test/RelayerService.test.ts` to mock the network provider response for the SC query during tests (mocking the `queryContract` call).
