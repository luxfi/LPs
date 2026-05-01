---
lp: 167
title: Agent Payment Standard
tags: [agents, payments, x402, ai, settlement, escrow, streaming, mpp, switchboard]
description: A canonical agent-to-agent payment protocol covering HTTP/402 quotes, ZAP-framed offers, on-chain escrow, streaming sessions, and threshold-signed multi-party settlements
author: kcolbchain (@abhicris) + Lux Core Team
status: Draft
type: Standards Track
category: Markets
created: 2026-05-01
requires:
  - lp-022 (ZAP Wire Protocol)
  - lp-047 (Token Streaming)
  - lp-019 (Threshold MPC for Bridge Signing)
  - lp-088 (ERC-3643 Securities Compliance Framework)
references:
  - x402 (Coinbase, https://x402.org)
  - EIP-712 (Typed structured data signing)
  - HTTP 402 (RFC 9110 §15.5.2)
  - kcolbchain/switchboard (reference implementation)
  - luxfi/zap (transport)
---

# LP-167: Agent Payment Standard

## Abstract

LP-167 defines a single, transport-portable protocol for AI agents to discover, negotiate, and settle payments — for individual API calls, for streaming work over time, or for multi-party flows where N agents split a single inbound payment. The same `PaymentOffer` / `PaymentProof` data model serves four transport layers:

1. **HTTP/402 — discovery.** Compatible with the x402 spec; any HTTP route can demand payment by returning an `accepts[]` envelope and accepting an `X-PAYMENT` header on retry.
2. **ZAP wire (LP-022) — high-volume A2A.** Zero-allocation binary frames for agents on the same Lux subnet exchanging offers and proofs at line rate.
3. **On-chain escrow — settlement.** A trustless `AgentEscrow` contract with timeout, challenge period, and mutual cancel.
4. **Streaming sessions (LP-047) — continuous flow.** Per-second token streams for long-running work, vesting, or subscription flows, with mid-stream upgrade to multi-party (MPP) sessions.

Compliance, identity, and threshold-signing slot in via existing Lux primitives — LP-088 (compliance hooks), LP-001 (security tokens), LP-019 (threshold MPC). Replay protection, expiry, and currency selection are normative parts of the wire format. The reference implementation is [kcolbchain/switchboard](https://github.com/kcolbchain/switchboard).

## Motivation

Every AI agent that wants to call a paid API or hire another agent today rolls its own payment plumbing: bespoke JSON over HTTP, Stripe meters, custom RPC paywalls, ad-hoc ETH transfers. That works for one app. It collapses the moment two agents from different teams need to settle on the fly.

Three rails exist in the wild but none compose:

| Rail | Strength | Gap |
|---|---|---|
| Coinbase x402 | HTTP-native, agent-friendly | no on-chain escrow, no streaming, no MPP, no compliance hook |
| Sablier / token streaming | continuous flow | no HTTP discovery, no per-call quote |
| Raw on-chain transfer | trustless settlement | no negotiation, no agent identity, no quote envelope |

LP-167 is the union: a single `PaymentOffer` data type that any of the four transports can carry, on top of Lux's existing crypto and securities primitives. Agents that learn the data model speak HTTP, ZAP, escrow, and streams without code branches.

## Standards Compatibility

| Spec | Relationship |
|---|---|
| x402 (Coinbase) | LP-167 `accepts[]` envelope is byte-for-byte compatible with x402's `accepts[]`. An LP-167 server can be queried by any x402 client. |
| HTTP 402 (RFC 9110) | LP-167 reuses the existing 402 status; the `WWW-Authenticate: x402` and `X-PAYMENT` headers are normative. |
| EIP-712 | `PaymentOffer` and `PaymentProof` are signed via EIP-712 typed-data structures (canonical domain separator below). |
| ERC-1404 / ERC-3643 (LP-088) | When the asset is a security token, transfers MUST consult the `ComplianceRegistry` before settlement. |
| LP-022 (ZAP Wire) | LP-167 defines two new ZAP message types (`0x70` `PaymentOffer`, `0x71` `PaymentProof`). |
| LP-047 (Token Streaming) | LP-167 streaming sessions are constructed as a `Stream` (LP-047) plus an `OfferRef` linking back to the originating quote. |
| LP-019 (Threshold MPC) | Multi-party offers MAY be signed by a threshold quorum (CGGMP21 ECDSA via LP-155 or FROST via LP-154). |

## Specification

### 1. Agent Identity

An agent identity is a 3-tuple:

```
AgentID := (chainID, address, optional DID)
```

| Field | Type | Notes |
|---|---|---|
| `chainID` | `uint64` | Lux subnet ID, EVM chain ID, or the special value `0` for off-chain agents identified solely by key |
| `address` | `[20]byte` | EVM address derived from the agent's signing key |
| `did` | optional `string` | If present, MUST resolve via LP-060 (DID Specification) |

`AgentID` is canonicalized for hashing as `keccak256(chainID || address || did)` with `did` length-prefixed (`u32` BE).

### 2. PaymentOffer

A `PaymentOffer` is an unsigned commitment by a payee to accept a specific payment in exchange for a specific resource.

#### 2.1 Logical structure

```
PaymentOffer {
    scheme:        u8                // 0=EXACT, 1=STREAMING, 2=MPP, 3-255 reserved
    chain_id:      u64               // settlement chain
    expires_at:    u64               // unix seconds; 0 = no expiry
    recipient:     [20]byte          // payee address
    amount:        [32]byte          // uint256 big-endian, in asset's smallest unit
    currency:      string            // ERC-20 symbol or "LUX" or "ETH"
    asset:         [20]byte          // ERC-20 contract; zero for native
    description:   string            // human-readable
    endpoint:      string            // resource the offer covers (URL, contract method, etc.)
    nonce:         string            // payee-chosen, MUST be unique per offer
}
```

All variable-length strings use UTF-8 with a `u32` BE length prefix on the wire.

#### 2.2 EIP-712 type

```
struct PaymentOffer {
    uint8   scheme;
    uint64  chainId;
    uint64  expiresAt;
    address recipient;
    uint256 amount;
    string  currency;
    address asset;
    string  description;
    string  endpoint;
    string  nonce;
}
```

`PaymentOfferDigest` is `keccak256(EIP-712Encode(domain, PaymentOffer))` where the EIP-712 domain is:

```
{
    name:              "Lux Agent Payments",
    version:           "1",
    chainId:           <PaymentOffer.chain_id>,
    verifyingContract: <AgentEscrow address>
}
```

#### 2.3 ZAP wire encoding (LP-022 message type `0x70`)

Frame layout matches LP-022 §"Frame Format". Payload is fixed-offset:

```
+---------+---------+-----------+-------------+-------------+
| scheme  | chain_id| expires   | recipient   | amount      |
| 1B      | 8B BE   | 8B BE     | 20B         | 32B BE      |
+---------+---------+-----------+-------------+-------------+
| asset   | currency_len | currency      | description_len  |
| 20B     | 4B BE        | UTF-8 var     | 4B BE            |
+---------+--------------+---------------+------------------+
| description | endpoint_len | endpoint  | nonce_len | nonce|
| UTF-8 var   | 4B BE        | UTF-8 var | 4B BE     | UTF-8|
+-------------+--------------+-----------+-----------+------+
```

`expires_at == 0` is the canonical "no expiry" sentinel. `currency`, `description`, `endpoint`, `nonce` MAY be empty (length 0) but the prefix MUST always be present.

A signed offer on the wire is `{ offer_bytes || signature[65] }` where the signature is the EIP-712 sig of `PaymentOfferDigest`.

### 3. PaymentProof

A `PaymentProof` is a signed receipt produced by the payer after settlement.

```
PaymentProof {
    chain_id:    u64
    timestamp:   u64                // unix seconds
    payer:       [20]byte
    tx_hash:     [32]byte           // settlement tx (or escrow create tx for escrow scheme)
    amount:      [32]byte           // uint256 big-endian, MUST match offer
    nonce:       string             // MUST match offer.nonce
}
```

ZAP wire encoding uses message type `0x71`. EIP-712 type:

```
struct PaymentProof {
    uint64  chainId;
    uint64  timestamp;
    address payer;
    bytes32 txHash;
    uint256 amount;
    string  nonce;
}
```

### 4. HTTP/402 Discovery Envelope

A server gates a route by returning HTTP 402 with the body:

```json
{
  "x402Version": 1,
  "accepts": [
    {
      "scheme":            "exact",
      "network":           "lux-c",
      "maxAmountRequired": "1000",
      "asset":             "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      "payTo":             "0x...",
      "resource":          "https://example/v1/infer",
      "description":       "model inference, 1k tokens",
      "mimeType":          "application/json",
      "expiresAt":         1714521600
    }
  ]
}
```

Headers:

| Header | Direction | Required | Purpose |
|---|---|---|---|
| `WWW-Authenticate: x402` | response | yes | discoverability for non-LP-167 clients |
| `x402-version` | response | yes | spec version, currently `1` |
| `Accept-Payment` | request | optional | scheme preference (`exact`, `streaming`, `mpp`) |
| `X-PAYMENT` | request | yes (on retry) | base64-encoded `PaymentProof` for `exact`, or session token for `streaming`/`mpp` |

A client that already holds a valid `PaymentProof` MAY pre-emptively include `X-PAYMENT` on the first request and skip the 402 round-trip. Servers MUST accept this.

### 5. Schemes

#### 5.1 EXACT

Single-shot quote-and-settle. The payer:

1. Receives 402 with `accepts[]`.
2. Picks an accept entry, transfers `amount` of `asset` to `payTo` on `network`.
3. Signs a `PaymentProof` referencing the tx hash.
4. Retries the request with `X-PAYMENT: base64(proof)`.

The server verifies (a) the on-chain transfer, (b) the proof signature matches the payer of that transfer, (c) `nonce` matches the offer it issued, (d) `expiresAt` has not passed.

#### 5.2 STREAMING

Long-running work. Constructed as an LP-047 `Stream` plus an `OfferRef`:

```solidity
struct OfferRef {
    bytes32  offerDigest;     // PaymentOfferDigest
    address  payee;
    address  payer;
    uint256  streamId;        // LP-047 stream
}
```

The payer creates an LP-047 stream from itself to the payee for the duration covering the work. The session token presented in `X-PAYMENT` is `keccak256(offerDigest || streamId)`. The server verifies the stream is live (`balance(payee) > 0`), un-canceled, and points back to its issued offer.

Stream cancellation by the payer terminates the agent's session. The server SHOULD return 402 with a fresh offer to re-up.

#### 5.3 MPP (Multi-Party Payments)

A single inbound payment to a coordinator splits across N agents that contributed. Each agent presents a co-signed `PaymentOffer` whose `amount` is the agent's share and whose `recipient` is a threshold address (LP-019 / LP-076). The coordinator settles once on-chain to the threshold address; the threshold quorum signs a release transaction splitting per the agents' shares.

```
PaymentOffer.scheme = MPP
PaymentOffer.recipient = threshold_address  (controlled by quorum of N agents)
PaymentOffer.description = "session=<id>;split=alice:0.4,bob:0.4,carol:0.2"
```

Replay protection is via the `nonce` field plus the on-chain quorum's monotonically increasing `sessionCounter`.

### 6. AgentEscrow Contract Interface

A reference contract (`AgentEscrow.sol`) provides trustless settlement when neither side trusts the other. Spec excerpt:

```solidity
interface IAgentEscrow {
    function createPayment(
        bytes32 offerDigest,
        address payee,
        uint256 amount,
        address asset,             // 0x0 for native LUX/ETH
        uint64  timeoutBlocks,
        uint64  challengePeriodBlocks
    ) external payable returns (bytes32 requestId);

    function confirmPayment(bytes32 requestId) external;     // payer releases
    function requestRefund(bytes32 requestId) external;      // after timeout
    function cancelPayment(bytes32 requestId) external;      // mutual

    event PaymentCreated(bytes32 indexed requestId, address indexed payer, address indexed payee, uint256 amount, bytes32 offerDigest);
    event PaymentConfirmed(bytes32 indexed requestId);
    event PaymentRefunded(bytes32 indexed requestId);
}
```

`offerDigest` MUST be `PaymentOfferDigest` of the original signed offer. Indexers MAY join `PaymentCreated` to off-chain offers via that digest.

### 7. Compliance Hooks

When `asset` is a security token (ERC-3643, LP-088), the `AgentEscrow.createPayment` and `AgentEscrow.confirmPayment` calls MUST consult `ComplianceRegistry.canTransfer(payer, payee, amount)` before holding or releasing funds. A non-zero restriction code reverts with the canonical error message from LP-088. Agent identities that hold security tokens MUST be registered in the `IdentityRegistry`.

This is the bridge that lets a regulated workflow (security-token-denominated agent work) execute on the same protocol as commodity USDC payments.

### 8. Threshold-Signed Offers

For MPP and high-value flows, a `PaymentOffer` MAY be signed by a quorum of agent keys via LP-019 / LP-155 (CGGMP21 ECDSA) or LP-154 (FROST Schnorr). The signature on the wire is replaced with the threshold signature (still 65 bytes for ECDSA; 64 + 1 recovery id for Schnorr). Verification follows the curve specified in `PaymentOffer.scheme` extension byte (reserved for future use); for v1, ECDSA is implied.

The threshold quorum SHOULD be defined by an on-chain registry (per-session) so a verifier can resolve which keys participated.

### 9. Replay Protection

| Field | Role |
|---|---|
| `PaymentOffer.nonce` | payee-chosen UUIDv4 or monotonic counter, scoped to (payee, endpoint) |
| `PaymentOffer.expires_at` | hard expiry |
| `PaymentProof.tx_hash` | settlement uniqueness — payer cannot reuse a proof against multiple offers |
| `AgentEscrow.requestId` | derived from `keccak256(payer, payee, nonce, block.timestamp)` |

A server MUST reject any `PaymentProof` whose `nonce` it has already recorded as redeemed. A `PaymentProof` is one-shot.

### 10. Cross-chain settlement

When `PaymentOffer.chain_id` differs from the chain hosting the `AgentEscrow`, settlement MAY use LP-016 (OmnichainRouter) or LP-017 (Native Bridge Programs for Teleport). The proof's `tx_hash` MUST reference the destination-chain settlement; the server validates via Warp messaging (LP-021) or a light-client query.

### 11. Currency selection

`PaymentOffer.currency` is informative; `PaymentOffer.asset` is normative. Servers SHOULD list multiple `accepts[]` entries when willing to take more than one asset (e.g., USDC on Lux-C, USDT on Lux-C, native LUX). Clients pick the cheapest fit.

`asset == 0x0` is the canonical sentinel for native chain currency.

## Reference Implementation

[kcolbchain/switchboard](https://github.com/kcolbchain/switchboard) — Python + Solidity, MIT.

- `switchboard/x402_middleware.py` — server-side HTTP/402 middleware, FastAPI/Flask drop-in.
- `switchboard/zap_transport.py` — `PaymentOffer` / `PaymentProof` ZAP wire encode/decode (uses [luxfi/zap](https://github.com/luxfi/zap) `zap_py`).
- `switchboard/gas_tracker.py` + `gas_budget.py` — per-hour / per-day client-side spend caps.
- `switchboard/nonce_manager.py` — client-side nonce manager with reorg protection.
- `contracts/AgentEscrow.sol` + `src/payment_protocol.py` — on-chain escrow + Python client.
- `web/` — public side-by-side explorer for x402 / MPP / AP2 / Circle / on-chain escrow.

The implementation has been audited internally; an external audit is expected during the LP-167 Final review phase.

## Security Considerations

### Replay & double-spend
Mitigated by `nonce`, `tx_hash`, `expires_at`, and the server-side proof-redemption ledger (§9). A compromised payee key can sign duplicate offers but cannot redeem the same proof twice against a compliant server.

### Front-running
A passive observer of an unsigned `PaymentOffer` cannot front-run settlement because the proof ties to the payer's address. A passive observer of an in-flight `PaymentProof` cannot replay because the server records `nonce` redemption atomically.

### Key compromise
A compromised payer key allows arbitrary spend up to its balance — this is unavoidable for hot-wallet agents. Mitigation: use the gas-budget tracker (`switchboard.gas_budget`) to cap per-hour and per-day burn before submission, and prefer threshold-signed offers for high-value flows.

### Long-lived offers
An offer with a far-future `expires_at` is an open option for the payer. Servers SHOULD set short expiries (~5 minutes for `EXACT`, session-bounded for `STREAMING`). Clients that hold long-lived offers SHOULD treat them as bearer instruments and protect them accordingly.

### Compliance bypass
Settlement of a security-token offer that skips `ComplianceRegistry.canTransfer` is a normative violation. Implementations MUST treat compliance failures as a hard error, not a warning.

### MPP collusion
A subset of MPP participants colluding to claim a larger share than agreed is bounded by the threshold-quorum requirement. The on-chain release transaction MUST be co-signed by the agreed quorum size; a sub-quorum cannot release.

## Backwards Compatibility

LP-167 v1 is additive:
- Servers that don't speak LP-167 are unaffected.
- x402 v1 clients can hit LP-167 servers transparently (the `accepts[]` envelope is wire-compatible).
- LP-167 clients fall back to plain x402 when the server doesn't advertise LP-167-specific features.

The new ZAP message types (`0x70`, `0x71`) are reserved by this LP and require no protocol-level changes to LP-022.

## Test Vectors

Reference test vectors live in `kcolbchain/switchboard/tests/fixtures/zap_wire/`:

| Vector | What it covers |
|---|---|
| `offer_minimal.bin` | EXACT scheme, no expiry, empty optional strings |
| `offer_full.bin` | STREAMING scheme, uint256-max amount, USDC on Lux-C, full description and endpoint |
| `proof_canonical.bin` | Production-shape `PaymentProof` for the matching offer |

Each vector includes the matching JSON shape and the EIP-712 `PaymentOfferDigest` so any third-party implementation can verify byte-equivalence.

## Roadmap

| Phase | Status | Date |
|---|---|---|
| Reference middleware (`switchboard/x402_middleware.py`) | shipped | 2026-04-29 |
| Reference escrow + payment client | shipped | 2026-04-21 |
| ZAP wire encoding | in PR ([switchboard #21](https://github.com/kcolbchain/switchboard/pull/21)) | 2026-04-29 |
| Go interop test vectors | in flight | 2026-05 |
| MPP session contract | spec'd; impl pending | Q3 2026 |
| External security audit | scheduled | Q3 2026 |
| Move LP-167 to `Final` | after audit + 2 independent implementations | Q4 2026 |

## References

- LP-001 Digital Securities Standard
- LP-019 Threshold MPC for Bridge Signing
- LP-022 ZAP Wire Protocol
- LP-047 Token Streaming
- LP-088 ERC-3643 Securities Compliance Framework
- LP-154 FROST Threshold Schnorr
- LP-155 CGGMP21 Threshold ECDSA
- [Coinbase x402 spec](https://x402.org)
- [EIP-712 Typed Structured Data](https://eips.ethereum.org/EIPS/eip-712)
- [HTTP 402 Payment Required (RFC 9110 §15.5.2)](https://www.rfc-editor.org/rfc/rfc9110.html#name-402-payment-required)
- [kcolbchain/switchboard](https://github.com/kcolbchain/switchboard)
- [luxfi/zap](https://github.com/luxfi/zap)
