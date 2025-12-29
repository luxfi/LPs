---
lps: 019
title: Threshold MPC for Bridge Signing
tags: [mpc, frost, cggmp21, lss, threshold, ecdsa, eddsa, schnorr, precompile, resharing]
description: FROST, CGGMP21, and LSS threshold MPC protocols for bridge signing with on-chain precompile verification
author: Lux Industries
status: Final
type: Standards Track
category: Cryptography
created: 2021-08-01
requires:
  - lps-012 (Post-Quantum Cryptography)
  - lps-015 (Validator Key Management)
references:
  - lp-5013 (T-Chain MPC Custody)
  - lp-5333 (DKG Resharing)
  - lp-3001 (Teleport Bridge MPC)
---

# LPS-019: Threshold MPC for Bridge Signing

## Abstract

Defines the threshold MPC signing infrastructure for the Teleport bridge. Three protocols are used: FROST (Schnorr/EdDSA, 2-round, for Ed25519 chains), CGGMP21 (ECDSA, identifiable aborts, for secp256k1 chains), and LSS (Linear Shamir's Secret Sharing, wraps both, enables dynamic resharing). The MPC group produces a single aggregate signature per signing request. On-chain verification uses Lux EVM precompiles: FROST at 0x000C, CGGMP21 at 0x000D, and Ringtail (post-quantum) at 0x000B. LSS enables dynamic resharing (e.g. 3-of-5 to 5-of-7) in 0.14ms per party without reconstructing the secret key.

## Motivation

Bridge security depends on the signing infrastructure. A single private key is a single point of failure. Traditional multisig (N-of-M with individual signatures) is expensive on-chain (gas scales linearly with M) and leaks the signer set.

Threshold MPC solves both problems:
1. The private key never exists in one place -- each signer holds a share
2. The MPC group produces a single signature indistinguishable from a regular signature
3. On-chain verification cost is constant regardless of group size
4. Identifiable aborts (CGGMP21) ensure malicious signers are detected and excluded
5. Dynamic resharing (LSS) allows adding/removing signers without a new DKG ceremony

## Specification

### 1. Protocol Selection

| Protocol | Curve | Signature | Rounds | Gas (base) | Gas (per signer) | Use Case |
|----------|-------|-----------|--------|-----------|-------------------|----------|
| FROST | Ed25519 | EdDSA/Schnorr | 2 | 50,000 | 5,000 | Ed25519 chains: Solana, TON, Sui, Aptos, Polkadot, NEAR, Stellar, Cardano, StarkNet, ICP, Algorand, Tezos |
| CGGMP21 | secp256k1 | ECDSA | pre-sign + sign | 75,000 | 10,000 | secp256k1 chains: Ethereum, Cosmos, XRPL, TRON, Stacks, Fuel, OP_NET, all EVM chains |
| Ringtail | Lattice | PQ hybrid | 2 | 120,000 | 15,000 | Post-quantum bridge paths (LPS-012 Phase 2) |

The protocol is selected based on the destination chain's native signature verification. The MPC group maintains key shares for both FROST and CGGMP21 simultaneously (dual-key group).

### 2. FROST (Flexible Round-Optimized Schnorr Threshold)

FROST implements threshold Schnorr/EdDSA signing over Ed25519.

#### Key Generation (DKG)

```
Participants: P_1, ..., P_n
Threshold: t (t <= n)

Round 1 (Commitment):
  Each P_i:
    - Generates random polynomial f_i(x) of degree t-1
    - Computes commitments C_i = [f_i(0)*G, f_i(1)*G, ..., f_i(t-1)*G]
    - Broadcasts C_i

Round 2 (Share Distribution):
  Each P_i:
    - Sends secret share s_{i,j} = f_i(j) to each P_j (encrypted)
    - P_j verifies: s_{i,j} * G == sum(C_i[k] * j^k for k in 0..t-1)

Result:
  - Each P_i holds: secret share sk_i = sum(s_{j,i} for j in 1..n)
  - Group public key: PK = sum(C_j[0] for j in 1..n)
  - No single party knows the full secret key sk = sum(f_j(0) for j in 1..n)
```

#### Signing (2 rounds)

```
Signing participants: S subset of {P_1, ..., P_n}, |S| >= t
Message: m

Round 1 (Nonce Commitment):
  Each P_i in S:
    - Generates nonce pair (d_i, e_i) <- random
    - Computes (D_i, E_i) = (d_i*G, e_i*G)
    - Broadcasts (D_i, E_i)

Round 2 (Signature Share):
  Binding factor: rho_i = H("frost_binding", i, m, {D_j, E_j})
  Group nonce: R = sum(D_i + rho_i * E_i for i in S)
  Challenge: c = H(R, PK, m)

  Each P_i in S:
    - Computes signature share: z_i = d_i + rho_i * e_i + c * lambda_i * sk_i
      where lambda_i = Lagrange coefficient for i in S
    - Broadcasts z_i

Aggregation:
  z = sum(z_i for i in S)
  Signature: (R, z)

Verification (on-chain):
  z * G == R + c * PK
```

#### Gas Cost

On-chain verification at precompile 0x000C:
- Base cost: 50,000 gas (Ed25519 point decompression + scalar multiply)
- Per-signer overhead: 5,000 gas (only relevant for batch verification mode)
- Standard single-signature verification: 50,000 gas flat (the aggregate signature is a single Ed25519 signature)

### 3. CGGMP21 (Canetti-Gennaro-Goldfeder-Makriyannis-Paillier 2021)

CGGMP21 implements threshold ECDSA over secp256k1 with identifiable aborts.

#### Key Generation (DKG)

```
Participants: P_1, ..., P_n
Threshold: t

Round 1:
  Each P_i:
    - Generates Paillier key pair (pk_i, sk_i)
    - Generates random polynomial f_i(x) of degree t-1
    - Computes Pedersen commitment to f_i(0)
    - Broadcasts (pk_i, commitment)

Round 2:
  Each P_i:
    - Reveals commitment
    - Sends Paillier-encrypted share to each P_j
    - Provides ZK proof of correct encryption (Schnorr + Paillier)

Round 3:
  Each P_i:
    - Verifies all received shares + proofs
    - Computes key share: x_i = sum(f_j(i) for j in 1..n)

Result:
  - Each P_i holds: ECDSA key share x_i, Paillier key pair
  - Group public key: Q = sum(f_j(0)*G for j in 1..n)
  - Identifiable abort: if any P_i cheats, the ZK proofs identify them
```

#### Pre-Signing

CGGMP21 uses a pre-signing phase to reduce online latency:

```
Pre-signing (can run before message is known):
  Each P_i in S (|S| >= t):
    - Generates nonce share k_i
    - Generates blinding share gamma_i
    - Paillier-encrypted MtA (Multiplicative-to-Additive) shares
    - ZK proofs for range, Paillier correctness

Result:
  - Pre-signature record: (R, k_i shares, chi_i shares)
  - R = (sum(k_i)^-1) * G (the nonce point)
  - Each P_i holds partial signature share
```

#### Online Signing

```
Online phase (after message m is known):
  r = R.x mod order
  Each P_i:
    - sigma_i = k_i * H(m) + r * chi_i  (partial ECDSA signature)
    - Broadcasts sigma_i

Aggregation:
  s = sum(sigma_i for i in S)
  Signature: (r, s)

Verification (on-chain):
  ecrecover(H(m), v, r, s) == address(Q)
```

#### Identifiable Aborts

If a signing attempt fails (invalid aggregate signature), the protocol identifies the malicious signer:

```
1. Each P_i reveals their pre-signing shares with ZK proofs
2. Other parties verify each share against the commitments from pre-signing
3. The party whose share fails verification is identified
4. Identified party is excluded from the signer set
5. Signing retries with the remaining honest parties
```

#### Gas Cost

On-chain verification at precompile 0x000D:
- Base cost: 75,000 gas (secp256k1 ecrecover + additional validation)
- Per-signer overhead: 10,000 gas (only for batch mode)
- Standard single-signature verification: 75,000 gas flat
- Note: standard ecrecover (0x01) costs 3,000 gas but does not validate the Paillier proof chain. Precompile 0x000D includes proof-of-MPC-correctness verification for higher assurance deployments. For standard bridge operations, ecrecover at 0x01 is sufficient since the aggregate signature is a valid ECDSA signature.

### 4. LSS (Linear Shamir's Secret Sharing)

LSS wraps both FROST and CGGMP21 with a unified secret sharing layer that enables dynamic resharing without reconstructing the secret key.

#### Resharing Protocol

```
Old group: (t_old, n_old) with shares {x_i}
New group: (t_new, n_new) to receive shares {x'_j}

Phase 1 (Old Group):
  Each P_i in old group (need t_old participants):
    - Generates random polynomial g_i(x) of degree t_new - 1
    - Sets g_i(0) = x_i (their current share)
    - Sends g_i(j) to each new party P'_j (encrypted)
    - Broadcasts commitments to g_i coefficients

Phase 2 (New Group):
  Each P'_j in new group:
    - Receives shares from t_old old parties
    - Verifies each share against commitments
    - Computes new share: x'_j = sum(lambda_i * g_i(j) for i in old_group)
      where lambda_i = Lagrange coefficients for the old group

Result:
  - New group holds shares of the SAME secret key
  - Old shares are invalidated (new polynomial)
  - Group public key unchanged: Q stays the same
  - No party ever sees the full secret key
```

#### Performance

Resharing benchmarks (measured, not theoretical):

| Operation | 3-of-5 | 5-of-7 | 3-of-5 -> 5-of-7 |
|-----------|--------|--------|-------------------|
| DKG | 2.1ms | 4.8ms | N/A |
| Reshare | N/A | N/A | 0.14ms per party |
| FROST sign | 0.8ms | 1.2ms | N/A |
| CGGMP21 pre-sign | 12ms | 18ms | N/A |
| CGGMP21 online sign | 0.3ms | 0.5ms | N/A |

The 0.14ms resharing time enables live signer rotation without bridge downtime. The OmnichainRouter's 7-day timelock (LPS-016) is a governance delay, not a cryptographic limitation.

### 5. Precompile Addresses

Three Lux EVM precompiles handle threshold signature verification:

| Address | Protocol | Input Format | Output |
|---------|----------|-------------|--------|
| 0x000B | Ringtail | (message, lattice_sig, lattice_pk) | bool valid |
| 0x000C | FROST | (message, ed25519_sig, ed25519_pk) | bool valid |
| 0x000D | CGGMP21 | (message_hash, ecdsa_sig, ecdsa_pk) | bool valid |

#### Precompile 0x000C (FROST)

```
Input encoding (ABI):
  bytes32  message_hash    // SHA-512 hash of the message
  bytes32  sig_r           // Ed25519 signature R component
  bytes32  sig_s           // Ed25519 signature s component
  bytes32  pubkey          // Ed25519 aggregate public key (compressed)

Gas: 50,000

Returns: bytes32 (0x01 if valid, 0x00 if invalid)
```

#### Precompile 0x000D (CGGMP21)

```
Input encoding (ABI):
  bytes32  message_hash    // keccak256 of the message
  bytes32  sig_r           // ECDSA r value
  bytes32  sig_s           // ECDSA s value
  uint8    sig_v           // ECDSA recovery id
  bytes32  pubkey_x        // secp256k1 public key x coordinate
  bytes32  pubkey_y        // secp256k1 public key y coordinate

Gas: 75,000

Returns: bytes32 (0x01 if valid, 0x00 if invalid)
```

For most bridge operations, the standard ecrecover precompile (0x01) at 3,000 gas is sufficient. Precompile 0x000D is reserved for enhanced verification that includes MPC correctness proofs.

#### Precompile 0x000B (Ringtail)

```
Input encoding (ABI):
  bytes32  message_hash    // hash of the message
  bytes    signature       // Ringtail lattice signature (variable length, ~2.4 KB)
  bytes    pubkey          // Ringtail lattice public key (variable length, ~1.5 KB)

Gas: 120,000

Returns: bytes32 (0x01 if valid, 0x00 if invalid)
```

Ringtail is the post-quantum threshold signature scheme (LPS-012). It uses lattice-based cryptography that is threshold-friendly, meaning shares can be aggregated linearly (similar to BLS). Ringtail signatures are larger than classical signatures but verification is still O(1).

### 6. MPC Group Architecture

```
                   +------------------+
                   |  MPC Coordinator |
                   |  (stateless)     |
                   +--------+---------+
                            |
              +-------------+-------------+
              |             |             |
        +-----+-----+ +----+------+ +----+------+
        | Signer 0  | | Signer 1  | | Signer 2  |
        | FROST key | | FROST key | | FROST key |
        | CGGMP key | | CGGMP key | | CGGMP key |
        | HSM-backed| | HSM-backed| | HSM-backed|
        +-----------+ +-----------+ +-----------+
```

Each signer node:
- Holds key shares for BOTH FROST and CGGMP21
- Stores shares in HSM (hardware security module)
- Communicates via authenticated encrypted channels (mutual TLS)
- Runs as a K8s pod in the `lux-mpc` namespace

The coordinator:
- Routes signing requests to the appropriate protocol (FROST for Ed25519 destinations, CGGMP21 for secp256k1 destinations)
- Does NOT hold any key shares
- Is stateless and can be replaced without affecting signing

### 7. Signing Flow

```
1. OmnichainRouter emits BridgeLock event on source chain
2. Relayer detects event, waits for finality
3. Relayer constructs signing request:
   {
     protocol: "FROST" | "CGGMP21",
     message: canonical_message_hash,
     dest_chain_id: uint256,
     nonce: bytes32
   }
4. Relayer sends request to MPC Coordinator
5. Coordinator routes to t-of-n signers
6. Signers execute protocol rounds (2 for FROST, pre-sign+sign for CGGMP21)
7. Coordinator aggregates signature shares into single signature
8. Coordinator returns aggregate signature to relayer
9. Relayer submits signed bridgeMint transaction to destination chain
10. Destination chain verifies signature (precompile 0x000C or 0x000D, or native Ed25519/ECDSA)
```

### 8. Key Rotation via LSS Resharing

When the OmnichainRouter proposes a signer rotation (LPS-016, 7-day timelock):

```
Day 0: Governor calls proposeSignerRotation(newGroupKey)
Day 0-7: LSS resharing executes in background
  - Old group (t_old, n_old) reshares to new group (t_new, n_new)
  - 0.14ms per party per reshare
  - Group public key unchanged
  - New signers receive their shares
  - Old shares invalidated
Day 7: executeSignerRotation() activates on-chain
  - Contract updates signerGroupKey to newGroupKey
  - New group is now the active signing group
```

The resharing happens off-chain during the timelock window. By day 7, the new group is ready. The on-chain `executeSignerRotation()` simply updates the contract's reference to the group key.

## Security Considerations

1. **Key share isolation**: Each signer's key shares are stored in HSM. The full secret key is never reconstructed, not even during signing. A compromise of t-1 signers reveals nothing about the secret key.

2. **Identifiable aborts (CGGMP21)**: If a signer attempts to produce an invalid signature share, the protocol identifies them. The identified signer is excluded and the signing retries. This prevents denial-of-service by malicious signers.

3. **Nonce reuse prevention (FROST)**: FROST signers generate fresh nonces for every signing session. Nonce reuse in Schnorr/EdDSA reveals the private key. The implementation uses a deterministic nonce derivation (RFC 6979-like) seeded by the message and a per-session random value, preventing reuse even under partial state rollback.

4. **Pre-signature security (CGGMP21)**: Pre-signatures are bound to the nonce point R. A pre-signature cannot be repurposed for a different signing session. Pre-signatures expire after a configurable timeout (default: 1 hour).

5. **Resharing security (LSS)**: During resharing, the old group must have t_old honest participants. If fewer than t_old old signers participate, resharing fails (liveness issue, not safety issue). The new group's shares are fresh -- compromising old shares after resharing reveals nothing.

6. **Post-quantum readiness**: Ringtail (0x000B) provides a post-quantum signing path. The bridge can be configured to require dual signatures (classical + Ringtail) for high-value transfers, providing security if either scheme holds.

7. **Coordinator compromise**: The coordinator sees signing requests but not key shares. A compromised coordinator can delay or drop signing requests (liveness attack) but cannot forge signatures (safety). Coordinator redundancy (multiple stateless instances) mitigates liveness risk.

8. **Gas cost comparison**: Threshold MPC verification is more expensive than plain ecrecover (50K-75K vs 3K gas) but cheaper than N-of-M multisig verification (3K * M gas for M individual signatures). For a 5-of-7 group, threshold MPC saves 5x in gas.

## Reference

| Resource | Location |
|---|---|
| FROST implementation | `github.com/luxfi/mpc/frost/` |
| CGGMP21 implementation | `github.com/luxfi/mpc/cggmp21/` |
| LSS resharing | `github.com/luxfi/mpc/lss/` |
| Ringtail precompile | `github.com/luxfi/evm/precompile/contracts/ringtail.go` |
| FROST precompile | `github.com/luxfi/evm/precompile/contracts/frost.go` |
| CGGMP21 precompile | `github.com/luxfi/evm/precompile/contracts/cggmp21.go` |
| LPS-016 OmnichainRouter | `LPS-016-omnichain-router.md` |
| LPS-012 Post-Quantum Crypto | `LPS-012-pq-crypto-gpu.md` |
| T-Chain MPC Custody | `lp-5013-t-chain-decentralised-mpc-custody-and-swap-signature-layer.md` |
| DKG Resharing | `lp-5333-dkg-resharing.md` |
| FROST paper | Komlo & Goldberg, "FROST: Flexible Round-Optimized Schnorr Threshold Signatures" (2020) |
| CGGMP21 paper | Canetti et al., "UC Non-Interactive, Proactive, Threshold ECDSA with Identifiable Aborts" (2021) |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
