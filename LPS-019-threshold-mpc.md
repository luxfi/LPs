---
title: "LPS-019: Threshold MPC Signature Schemes"
status: Final
author: Lux Industries
date: 2026-03-03
---

# LPS-019: Threshold MPC Signature Schemes

## Abstract

Specification of the threshold multi-party computation (MPC) protocols used across the Lux Teleport omnichain bridge. Three schemes compose orthogonally: FROST for Ed25519 chains, CGGMP21 for secp256k1 chains, and LSS for dynamic resharing across both.

## Motivation

A single compromised key must never control bridge funds. Threshold signatures ensure t-of-n parties must cooperate to produce a valid signature. The on-chain contract verifies a single aggregate signature against the MPC group address — individual signer keys never appear on-chain.

## Specification

### FROST (Flexible Round-Optimized Schnorr Threshold)

- **Curve**: Ed25519, secp256k1 (Schnorr)
- **Rounds**: 2 (optimal)
- **Signature**: 64 bytes (R || s)
- **Gas**: 50,000 base + 5,000 per signer
- **Precompile**: `0x020000000000000000000000000000000000000C`
- **Chains**: Solana, TON, Sui, Aptos, Cosmos, Polkadot, NEAR, Stellar, Cardano, Algorand, Tezos
- **Standard**: IETF draft-irtf-cfrg-frost, BIP-340/341 (Taproot)

### CGGMP21 (Threshold ECDSA)

- **Curve**: secp256k1
- **Rounds**: 5+ (presigning reduces online rounds to 1)
- **Signature**: 65 bytes (r || s || v), standard ECDSA
- **Gas**: 75,000 base + 10,000 per signer
- **Precompile**: `0x020000000000000000000000000000000000000D`
- **Chains**: EVM (all), TRON, XRPL, Bitcoin
- **Feature**: Identifiable aborts — malicious parties detected and excluded

### LSS (Linear Shamir's Secret Sharing)

- **Wraps**: FROST + CGGMP21
- **Feature**: Dynamic resharing without changing group public key
- **Performance**: 0.14ms (3→5 parties), 3.5ms (50→100 parties), linear scaling
- **Use case**: Live signer rotation, adding/removing MPC participants without downtime

### On-Chain Verification

The MPC protocol produces a single standard signature. On-chain contracts verify against the `mpcGroupAddress` — the Ethereum address derived from the threshold aggregate public key. Individual signer addresses are stored for accountability but never used for signature verification.

```
MPC Keygen → group public key → mpcGroupAddress (single address)
MPC Sign (t-of-n cooperate) → single ECDSA/Schnorr signature
On-chain: ecrecover(digest, signature) == mpcGroupAddress
```

### Performance Benchmarks (Apple M1 Max)

| Protocol | Config | Keygen | Signing | Memory |
|----------|--------|--------|---------|--------|
| FROST | 2-of-3 | 24-34ms | 21-28ms | 8 KB |
| FROST | 10-of-15 | 381ms | ~95ms | 12 KB |
| CGGMP21 | 2-of-3 | >60s (Paillier) | ~65ms | 60 KB |
| LSS reshare | 3→5 | 0.14ms | — | 5 KB |
| LSS reshare | 50→100 | 3.5ms | — | 98 KB |

## Security Considerations

- **Threshold**: Minimum 2-of-3 for all bridge operations
- **Timelock**: 7-day delay on signer rotation (OmnichainRouter + Solana bridge)
- **No single point of failure**: Group key requires t parties to sign
- **Identifiable aborts** (CGGMP21): Malicious signers detected and slashed
- **Key refresh**: LSS resharing rotates shares without changing public key
- **Nonce safety**: FROST nonce reuse = key recovery; protocol enforces unique nonces

## References

- LPS-016: OmnichainRouter (verifies MPC group signature)
- LPS-017: Native Bridge Programs (per-chain signature verification)
- Papers: `lux-threshold-mpc.tex`, `lux-lss-mpc.tex`, `lux-universal-threshold-signatures.tex`
- IETF FROST: draft-irtf-cfrg-frost
- CGGMP21: ePrint 2021/060
- Precompiles: FROST (0x000C), CGGMP21 (0x000D), Ringtail (0x000B)
