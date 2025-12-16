---
lp: 2517
title: Lux Precompile Suite Overview
description: Comprehensive overview of all EVM precompiles for Lux Network including access control, fee management, cross-chain, and cryptography
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Informational
created: 2025-11-14
requires: 2311, 2312, 2313, 2314, 7321, 7322, 7324
tags: [precompile, evm, index]
---

## Abstract

This LP provides a complete index of the Lux Network EVM precompile suite. The suite includes 12 precompiled contracts spanning access control, fee management, native token operations, cross-chain messaging, and cryptographic signature verification. Precompiles are organized into two address ranges: the Lux stateful precompile range (`0x0200...0001` through `0x0200...000D`) and the standard Ethereum precompile range (`0x0...0100` for RIP-7212).

## Motivation

As the Lux Network precompile suite has grown to include 13 precompiled contracts across multiple categories, developers and auditors need a single reference document that provides:

1. **Complete Address Map**: All precompile addresses in one place, eliminating the need to search multiple LPs
2. **Gas Cost Comparison**: Side-by-side gas costs to help developers choose the right precompile for their use case
3. **Security Classification**: Clear distinction between classical, post-quantum, and hybrid cryptographic precompiles
4. **Implementation Status**: Current state of each precompile's development and documentation
5. **Usage Patterns**: Common integration patterns and code examples

Without a central index, developers must navigate dozens of individual LPs to understand the full precompile landscape. This overview serves as the canonical reference for all Lux Network precompiles.

## Precompile Address Map

### Lux Stateful Precompiles

| Address | Name | Purpose | LP Reference | Status |
|---------|------|---------|--------------|--------|
| `0x0200000000000000000000000000000000000001` | DeployerAllowList | Contract deployment permissions | - | Final |
| `0x0200000000000000000000000000000000000002` | TxAllowList | Transaction submission permissions | - | Final |
| `0x0200000000000000000000000000000000000003` | FeeManager | Dynamic fee configuration | LP-2314 | Draft |
| `0x0200000000000000000000000000000000000004` | NativeMinter | Native token minting | - | Final |
| `0x0200000000000000000000000000000000000005` | RewardManager | Validator reward distribution | - | Final |
| `0x0200000000000000000000000000000000000006` | ML-DSA | Post-quantum lattice signatures | LP-2311 | Draft |
| `0x0200000000000000000000000000000000000007` | SLH-DSA | Post-quantum hash-based signatures | LP-2312 | Draft |
| `0x0200000000000000000000000000000000000008` | Warp | Cross-chain BLS messaging | LP-2313 | Draft |
| `0x020000000000000000000000000000000000000A` | Quasar | Quantum consensus certificates | LP-4110 | Draft |
| `0x020000000000000000000000000000000000000B` | Ringtail | PQ threshold signatures (Ring-LWE) | LP-7324 | Draft |
| `0x020000000000000000000000000000000000000C` | FROST | Schnorr threshold signatures | LP-7321 | Draft |
| `0x020000000000000000000000000000000000000D` | CGGMP21 | ECDSA threshold signatures | LP-7322 | Draft |

### Standard Ethereum Precompiles

| Address | Name | Purpose | LP Reference | Status |
|---------|------|---------|--------------|--------|
| `0x0000000000000000000000000000000000000100` | secp256r1 | P-256 ECDSA verification (RIP-7212) | LP-2204 | Final |

## Gas Cost Comparison

### Signature Verification Precompiles

| Precompile | Base Cost | Per-Byte Cost | Example (32B msg) | Security Level |
|------------|-----------|---------------|-------------------|----------------|
| ecrecover (native) | 3,000 | - | 3,000 | Classical |
| secp256r1 | 3,450 | - | 3,450 | Classical |
| ML-DSA | 100,000 | 10 | 100,320 | Post-Quantum (L3) |
| SLH-DSA | 15,000 | 10 | 15,320 | Post-Quantum (L1) |

### Threshold Signature Precompiles

| Precompile | Base Cost | Per-Signer Cost | 3-of-5 Example | Security Level |
|------------|-----------|-----------------|----------------|----------------|
| FROST | 50,000 | 5,000 | 75,000 | Classical |
| CGGMP21 | 75,000 | 10,000 | 125,000 | Classical |
| Ringtail | 150,000 | 10,000 | 200,000 | Post-Quantum |

### Cross-Chain and Consensus Precompiles

| Precompile | Base Cost | Variable Cost | Typical Usage | Notes |
|------------|-----------|---------------|---------------|-------|
| Warp | 50,000 | 1,000/validator | ~60,000 | BLS aggregate verification |
| Quasar | 200,000 | - | 200,000 | Dual-certificate finality |

### Access Control Precompiles

| Precompile | Read Cost | Write Cost | Notes |
|------------|-----------|------------|-------|
| DeployerAllowList | 2,500 | 20,000 | Role-based access |
| TxAllowList | 2,500 | 20,000 | Role-based access |
| FeeManager | 2,100 | 45,000 | Admin-only writes |
| NativeMinter | 2,500 | 20,000 | Minter role required |
| RewardManager | 2,500 | 20,000 | Reward distribution |

## Security Classification

### Classical Cryptography (Vulnerable to Quantum Computers)

| Precompile | Algorithm | Security Assumption | Quantum Risk |
|------------|-----------|---------------------|--------------|
| secp256r1 | ECDSA P-256 | Discrete Log | HIGH - Shor's algorithm |
| FROST | Schnorr | Discrete Log | HIGH - Shor's algorithm |
| CGGMP21 | ECDSA | Discrete Log | HIGH - Shor's algorithm |
| Warp | BLS12-381 | Discrete Log / Pairing | HIGH - Shor's algorithm |

### Post-Quantum Cryptography (Quantum-Resistant)

| Precompile | Algorithm | Security Assumption | NIST Level |
|------------|-----------|---------------------|------------|
| ML-DSA | Dilithium (FIPS 204) | Module-LWE / Module-SIS | Level 3 (192-bit) |
| SLH-DSA | SPHINCS+ (FIPS 205) | Hash collision resistance | Level 1 (128-bit) |
| Ringtail | Ring-LWE threshold | Ring-LWE / Ring-SIS | Level 3 (128-bit PQ) |

### Hybrid Security (Classical + Post-Quantum)

| Precompile | Classical Component | PQ Component | Use Case |
|------------|--------------------|--------------|---------|
| Quasar | BLS aggregate (Round 1) | ML-DSA (Round 2) | Consensus finality |

## Precompile Categories

### 1. Access Control Precompiles

These precompiles manage permissions for chain operations:

**DeployerAllowList** (`0x...0001`):
- Controls which addresses can deploy contracts
- Roles: None, Enabled, Admin
- Use case: Permissioned chains, enterprise deployments

**TxAllowList** (`0x...0002`):
- Controls which addresses can submit transactions
- Roles: None, Enabled, Admin
- Use case: Restricted chains, compliance requirements

### 2. Economic Precompiles

These precompiles manage chain economics:

**FeeManager** (`0x...0003`):
- Dynamic EIP-1559 fee configuration
- Gas limits, base fees, block gas costs
- Admin-controlled with rate limiting
- See LP-2314 for full specification

**NativeMinter** (`0x...0004`):
- Mint native tokens to addresses
- Minter role required
- Use case: Bridge deposits, rewards

**RewardManager** (`0x...0005`):
- Configure validator reward distribution
- Set reward addresses and percentages
- Admin-controlled

### 3. Cross-Chain Precompiles

**Warp Messaging** (`0x...0008`):
- BLS signature aggregation for cross-chain messages
- Verifies validator-signed inter-chain communication
- 67% stake threshold for validity
- See LP-2313 for full specification

### 4. Consensus Precompiles

**Quasar** (`0x...000A`):
- Quantum-finality consensus certificates
- Dual verification: BLS (Round 1) + ML-DSA (Round 2)
- Sub-second finality (target: 500ms)
- See LP-4110 for full specification

### 5. Post-Quantum Signature Precompiles

**ML-DSA** (`0x...0006`):
- NIST FIPS 204 (Dilithium) signatures
- Level 3 security (192-bit equivalent)
- 1952-byte public keys, 3309-byte signatures
- ~108us verification time
- See LP-2311 for full specification

**SLH-DSA** (`0x...0007`):
- NIST FIPS 205 (SPHINCS+) hash-based signatures
- Level 1 security (128-bit equivalent)
- 32-byte public keys, 7856-byte signatures
- ~286us verification time
- See LP-2312 for full specification

### 6. Threshold Signature Precompiles

**FROST** (`0x...000C`):
- Schnorr threshold signatures (BIP-340 compatible)
- Two-round protocol
- Bitcoin Taproot compatible
- See LP-7321 for full specification

**CGGMP21** (`0x...000D`):
- ECDSA threshold signatures with identifiable aborts
- UC-secure with malicious party detection
- Ethereum/Bitcoin ECDSA compatible
- See LP-7322 for full specification

**Ringtail** (`0x...000B`):
- Post-quantum threshold signatures (Ring-LWE)
- Two-round protocol without trusted dealer
- Quantum-safe multi-party signing
- See LP-7324 for full specification

## Implementation Status

| Precompile | Go Implementation | Solidity Interface | Tests | Documentation |
|------------|-------------------|-------------------|-------|---------------|
| DeployerAllowList | Complete | Complete | Complete | Complete |
| TxAllowList | Complete | Complete | Complete | Complete |
| FeeManager | Complete | Complete | Complete | LP-2314 |
| NativeMinter | Complete | Complete | Complete | Complete |
| RewardManager | Complete | Complete | Complete | Complete |
| ML-DSA | Complete | Complete | Complete | LP-2311 |
| SLH-DSA | Complete | Complete | Complete | LP-2312 |
| Warp | Complete | Complete | Complete | LP-2313 |
| Quasar | Complete | Complete | Complete | LP-4110 |
| Ringtail | Complete | Complete | Complete | LP-7324 |
| FROST | Complete | Complete | Complete | LP-7321 |
| CGGMP21 | Complete | Complete | Complete | LP-7322 |
| secp256r1 | Complete | Complete | Complete | LP-2204 |

## Activation Forks

| Fork Name | Precompiles Activated | Target |
|-----------|----------------------|--------|
| Genesis | DeployerAllowList, TxAllowList, FeeManager, NativeMinter, RewardManager | Mainnet |
| Teleport | Warp | Cross-chain |
| Quantum | ML-DSA, SLH-DSA, Ringtail, FROST, CGGMP21, Quasar | Post-quantum |
| Granite | secp256r1 | Biometric wallets |

## Usage Patterns

### Hybrid Signature Verification

For maximum security, combine classical and post-quantum signatures:

```solidity
function verifyHybrid(
    bytes calldata ecdsaSig,
    bytes calldata mldsaSig,
    bytes calldata message
) internal view returns (bool) {
    // Classical signature (current security)
    bool classical = verifyECDSA(message, ecdsaSig);

    // Post-quantum signature (future security)
    bool quantum = IMLDSA(0x0200...0006).verify(pubKey, message, mldsaSig);

    // Both must pass
    return classical && quantum;
}
```text

### Threshold Wallet Selection

Choose threshold scheme based on requirements:

```solidity
// For Bitcoin/Taproot compatibility
IFROST frost = IFROST(0x020000000000000000000000000000000000000C);

// For Ethereum ECDSA compatibility
ICGGMP21 cggmp = ICGGMP21(0x020000000000000000000000000000000000000D);

// For post-quantum security
IRingtail ringtail = IRingtail(0x020000000000000000000000000000000000000B);
```text

### Cross-Chain Message Verification

```solidity
IWarp warp = IWarp(0x0200000000000000000000000000000000000008);

function receiveMessage(
    bytes32 messageHash,
    uint32 sourceChainId,
    bytes calldata aggregateSig,
    bytes calldata validatorBitset
) external {
    require(
        warp.verifyMessage(messageHash, sourceChainId, aggregateSig, validatorBitset),
        "Invalid cross-chain signature"
    );
    // Process message...
}
```

## Related LPs

### Precompile Specifications

- **LP-2311**: ML-DSA Signature Verification Precompile
- **LP-2312**: SLH-DSA Signature Verification Precompile
- **LP-2313**: Warp Messaging Precompile
- **LP-2314**: Fee Manager Precompile
- **LP-7321**: FROST Threshold Signature Precompile
- **LP-7322**: CGGMP21 Threshold ECDSA Precompile
- **LP-7324**: Ringtail Threshold Signature Precompile
- **LP-4110**: Quasar Consensus Protocol

### Supporting Standards

- **LP-2204**: secp256r1 Curve Integration (RIP-7212)
- **LP-4200**: Post-Quantum Cryptography Suite
- **LP-4201**: Hybrid Classical-Quantum Transitions
- **LP-6022**: Warp Messaging 2.0

### Cryptographic Foundations

- **LP-4316**: ML-DSA Post-Quantum Digital Signatures (FIPS 204)
- **LP-4317**: SLH-DSA Stateless Hash-Based Signatures (FIPS 205)
- **LP-4318**: ML-KEM Post-Quantum Key Encapsulation (FIPS 203)

## Security Considerations

### Address Space

All Lux precompiles use the `0x0200...` prefix to avoid collisions with:
- Ethereum precompiles (`0x01` - `0x0a`)
- Future Ethereum precompiles (`0x0b` - `0xff`)
- RIP precompiles (`0x0...0100` range)

### Gas Costs

Gas costs are calibrated to:
- Prevent DoS attacks via expensive operations
- Reflect actual computational cost
- Enable practical use within block gas limits

### Quantum Migration

The precompile suite provides a migration path:
1. **Current**: Use classical signatures (ecrecover, secp256r1, FROST, CGGMP21)
2. **Transition**: Use hybrid signatures (classical + PQ)
3. **Future**: Use pure post-quantum (ML-DSA, SLH-DSA, Ringtail)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
