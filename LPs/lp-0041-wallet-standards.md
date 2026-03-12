---
lp: 41
title: Wallet Standards and Key Derivation
description: BIP-44 derivation paths, address formats, and wallet interoperability across all Lux chain types
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: Interface
created: 2025-01-23
updated: 2026-03-11
tags: [wallet, dev-tools, key-derivation, bip44]
order: 41
---

## Abstract

Defines key derivation paths, address formats, and wallet interoperability standards for all Lux chain types. Lux uses two BIP-44 coin types: **60** (Ethereum) for all EVM-compatible chains and **9000** (Avalanche-inherited) for P-Chain and X-Chain.

## Motivation

Consistent key derivation across chain types ensures:
1. A single mnemonic can derive keys for all Lux chains
2. C-Chain and EVM subnet keys remain fully Ethereum-compatible (MetaMask, Ledger, etc.)
3. P-Chain and X-Chain follow the established Avalanche standard for UTXO-based chains
4. Hardware wallets, browser extensions, and mobile wallets all derive the same addresses

## Specification

### Chain Classification

Lux chains fall into two categories for key derivation:

| Category | Chains | Coin Type | Address Format |
|----------|--------|-----------|----------------|
| **EVM** | C-Chain, Zoo, Hanzo, SPC, Pars, and all EVM subnets | 60 (Ethereum) | `0x`-prefixed hex (EIP-55) |
| **UTXO** | P-Chain, X-Chain | 9000 (Avalanche) | Bech32 (`P-lux1...`, `X-lux1...`) |

### Cryptographic Primitives

All chain types share:

- **Curve**: secp256k1
- **Signature scheme**: ECDSA with Ethereum-style signing (EIP-155 for EVM, standard ECDSA for UTXO)
- **Mnemonic**: BIP-39 (12 or 24 words, English wordlist)
- **Key derivation**: BIP-32 / BIP-44 hierarchical deterministic (HD) wallets

### BIP-44 Derivation Paths

#### EVM Chains (C-Chain + All EVM Subnets)

```
m/44'/60'/0'/0/{index}
```

| Component | Value | Description |
|-----------|-------|-------------|
| Purpose | 44' | BIP-44 (hardened) |
| Coin Type | 60' | Ethereum (SLIP-44) |
| Account | 0' | Default account (hardened) |
| Change | 0 | External/receiving |
| Index | variable | Address index (0, 1, 2, ...) |

**Address derivation**: `keccak256(uncompressed_pubkey[1:])[12:]` — last 20 bytes of Keccak-256 hash of the uncompressed public key (without the `04` prefix byte), represented as `0x`-prefixed hex with optional EIP-55 mixed-case checksum.

**Applies to**: C-Chain (96369), Zoo (200200), Hanzo (36963), SPC (36911), Pars (494949), and any future EVM subnet. All EVM subnets use the **same** derivation path — the chain ID in the transaction distinguishes which chain a signed transaction targets.

**Compatibility**: MetaMask, Ledger, Trezor, imToken, OneKey, and all Ethereum-standard wallets.

#### Ledger Live Alternative Path

```
m/44'/60'/{index}'/0/0
```

Ledger Live uses account-level derivation instead of address-level. Both paths MUST be supported by Lux wallets.

#### P-Chain and X-Chain (UTXO Chains)

```
m/44'/9000'/0'/0/{index}
```

| Component | Value | Description |
|-----------|-------|-------------|
| Purpose | 44' | BIP-44 (hardened) |
| Coin Type | 9000' | Avalanche (SLIP-44, inherited by Lux) |
| Account | 0' | Default account (hardened) |
| Change | 0 | External (0) or internal/change (1) |
| Index | variable | Address index (0, 1, 2, ...) |

**Address derivation**: `ripemd160(sha256(compressed_pubkey))` — RIPEMD-160 of SHA-256 of the 33-byte compressed public key, encoded as Bech32 with chain prefix.

**Address format**: `{chain}-lux1{bech32_payload}`
- P-Chain: `P-lux1abc123...`
- X-Chain: `X-lux1abc123...`

**Note**: The same secp256k1 key at a given path produces different-looking addresses on EVM vs UTXO chains because the address encoding differs. The P/X address for a given key is NOT related to its `0x` EVM address.

### Key Index Conventions

| Index | Purpose | Notes |
|-------|---------|-------|
| 0 | Primary validator / staking key | Used in genesis `initialStakedFunds`; balance LOCKED during validation |
| 1 | Treasury / operations | Unlocked balance for operational use |
| 2-4 | Additional validators | For multi-validator setups |
| 5+ | Application / user keys | General purpose |

### BLS Signer Keys

BLS keys for validators are **NOT** derived via BIP-44. They use HKDF with domain separation:

```
seed = HKDF-SHA256(ikm=entropy, salt="lux-bls-key", info=node_id)
```

BLS keys are 32 bytes (separate from TLS staker keys) and MUST be stored independently.

### Post-Quantum Keys (Ringtail)

Ringtail (ML-DSA) keys for Q-Chain operations use HKDF:

```
seed = HKDF-SHA256(ikm=entropy, salt="lux-ringtail-key", info=node_id)
```

## Implementation

### CLI Key Derivation

```bash
# Derive keys from mnemonic (shows all chain addresses)
lux key derive --mnemonic "word1 word2 ... word12" --count 5

# Output shows:
# Index 0: m/44'/60'/0'/0/0
#   EVM:  0x9011E888251AB053B7bD1cdB598Db4f9DEd94714
#   P:    P-lux1e44zjaddy52vjqa40ws90uwu9c2ryp7e670v66
#   X:    X-lux1e44zjaddy52vjqa40ws90uwu9c2ryp7e670v66
```

**Source**: `~/work/lux/cli/pkg/key/soft_key.go`

### Wallet Standard Contracts

**Location**: `~/work/lux/standard/src/wallets/`

- [`ILuxWallet.sol`](https://github.com/luxfi/standard/blob/main/src/wallets/ILuxWallet.sol) — Base wallet interface
- [`IMultiChainWallet.sol`](https://github.com/luxfi/standard/blob/main/src/wallets/IMultiChainWallet.sol) — Cross-chain wallet support
- [`IWalletFactory.sol`](https://github.com/luxfi/standard/blob/main/src/wallets/IWalletFactory.sol) — Wallet deployment factory

### Chain ID Reference

| Chain | Network | Chain ID | Coin | Derivation |
|-------|---------|----------|------|------------|
| C-Chain | Mainnet | 96369 | LUX | `m/44'/60'/0'/0/i` |
| C-Chain | Testnet | 96368 | LUX | `m/44'/60'/0'/0/i` |
| C-Chain | Devnet | 96370 | LUX | `m/44'/60'/0'/0/i` |
| Zoo | Mainnet | 200200 | ZOO | `m/44'/60'/0'/0/i` |
| Hanzo | Mainnet | 36963 | AI | `m/44'/60'/0'/0/i` |
| SPC | Mainnet | 36911 | SPC | `m/44'/60'/0'/0/i` |
| Pars | Mainnet | 494949 | PARS | `m/44'/60'/0'/0/i` |
| P-Chain | All | N/A | LUX | `m/44'/9000'/0'/0/i` |
| X-Chain | All | N/A | LUX | `m/44'/9000'/0'/0/i` |

## Rationale

### Why Coin Type 60 for EVM Chains?

Lux EVM chains are fully Ethereum-compatible:
- Same curve (secp256k1) and signature scheme (ECDSA)
- Same address format (last 20 bytes of keccak256 of uncompressed pubkey)
- Same transaction signing (EIP-155 with chain ID replay protection)

Using coin type 60 means any Ethereum wallet (MetaMask, Ledger, etc.) works natively with Lux EVM chains — zero configuration needed beyond adding the RPC endpoint and chain ID.

### Why Coin Type 9000 for P/X Chains?

P-Chain and X-Chain use UTXO models inherited from Avalanche's architecture. The address format (Bech32) and transaction structure differ from EVM. Coin type 9000 (SLIP-44 registered for Avalanche) is the established standard for this chain type and maintains compatibility with existing Avalanche wallet tooling.

### Why Not a Custom Lux Coin Type?

A custom coin type would:
- Break compatibility with existing Ethereum wallets
- Require all hardware wallets to add Lux-specific firmware
- Add unnecessary complexity with zero security benefit
- Prevent "add network" flows in MetaMask from working

## Backwards Compatibility

This is a formalization of existing practice. All deployed chains already use these derivation paths. No migration needed.

## Security Considerations

- **Mnemonic index 0** is locked when used in `initialStakedFunds` — do not use for operational transactions
- **Chain ID replay protection** (EIP-155) prevents cross-chain transaction replay between EVM subnets
- **P/X transactions** use the Avalanche serialization format with network ID for replay protection
- **Same mnemonic, different addresses**: Users must understand that P-Chain/X-Chain addresses look different from EVM addresses even when derived from the same seed
- **Hardware wallet signing**: Always verify the derivation path shown on the hardware device matches the expected chain type

## Test Cases

### Derivation Verification

Given mnemonic: (test vector — do NOT use for real funds)

```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
```

Expected addresses at index 0:
- EVM (`m/44'/60'/0'/0/0`): `0x9858EfFD232B4033E47d90003D41EC34EcaEda94`
- P-Chain (`m/44'/9000'/0'/0/0`): `P-lux1...` (implementation-specific Bech32)
- X-Chain (`m/44'/9000'/0'/0/0`): `X-lux1...` (same key, different prefix)

### Cross-Wallet Compatibility

1. Derive key in MetaMask using seed phrase → verify same `0x` address as `lux key derive`
2. Import seed into Lux Wallet → verify P/X addresses match CLI output
3. Sign EVM transaction with Ledger → verify on-chain sender matches derived address

## References

- [BIP-32: Hierarchical Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP-39: Mnemonic code for generating deterministic keys](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP-44: Multi-Account Hierarchy for Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [SLIP-44: Registered coin types for BIP-44](https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
- [EIP-55: Mixed-case checksum address encoding](https://eips.ethereum.org/EIPS/eip-55)
- [EIP-155: Simple replay attack protection](https://eips.ethereum.org/EIPS/eip-155)
