---
lps: 033
title: Quantum VM
tags: [quantum, q-chain, post-quantum, dilithium, kyber, vm]
description: Q-chain virtual machine for quantum-resistant operations and key management
author: Lux Industries
status: Final
type: Standards Track
category: Virtual Machines
created: 2025-01-01
requires:
  - lps-012 (Post-Quantum Cryptography)
  - lps-029 (NTT Transform)
references:
  - lp-4100 (Q-Chain Specification)
---

# LPS-033: Quantum VM

## Abstract

The Quantum VM runs the Q-chain, a dedicated chain for post-quantum cryptographic operations. All transactions on the Q-chain use CRYSTALS-Dilithium signatures and CRYSTALS-Kyber key encapsulation. The Q-chain serves as the PQ key registry for the entire Lux network, allowing any chain to verify PQ signatures by referencing Q-chain state via Warp messages (LPS-021).

## Specification

### Account Model

Q-chain accounts use Dilithium-3 public keys (1952 bytes) instead of ECDSA:

```
Account {
    pubkey      [1952]byte  // Dilithium-3 public key
    nonce       uint64
    balance     uint256
    codeHash    [32]byte    // for PQ smart contracts
    storageRoot [32]byte
}
```

Account addresses are derived as `keccak256(dilithiumPubkey)[12:]` (20 bytes, compatible with EVM tooling).

### Transaction Format

```
QTx {
    nonce       uint64
    to          [20]byte
    value       uint256
    data        []byte
    gasLimit    uint64
    gasPrice    uint256
    signature   [3293]byte  // Dilithium-3 signature
}
```

Signature verification uses the NTT-accelerated Dilithium verifier (LPS-029).

### PQ Key Registry

The Q-chain maintains a registry mapping addresses (on any Lux chain) to their PQ public keys:

```
Registry {
    mapping(address => DilithiumPubkey) public pqKeys;
    mapping(address => KyberPubkey)     public encryptionKeys;
}
```

Any user can register their PQ keys on the Q-chain. Other chains verify PQ signatures by querying this registry via Warp.

### Precompiles

| Address | Function | Gas |
|---|---|---|
| `0x0300...01` | Dilithium-3 signature verification | 15,000 |
| `0x0300...02` | Kyber-768 key encapsulation | 10,000 |
| `0x0300...03` | Kyber-768 decapsulation | 10,000 |
| `0x0300...04` | NTT forward transform | 5,000 |
| `0x0300...05` | NTT inverse transform | 5,000 |

### Migration Path

Users transition to PQ security:

1. Register Dilithium key on Q-chain, linked to existing ECDSA address
2. Set PQ key as backup signer for multi-sig wallets
3. When ECDSA is deprecated (quantum threat timeline), switch to Q-chain signing exclusively

## Security Considerations

1. **Key size**: Dilithium-3 keys are large (1952 bytes public, 3293 bytes signature). Block size limits account for this.
2. **Hybrid period**: during transition, both ECDSA and Dilithium signatures are accepted. A compromised ECDSA key cannot override a PQ-signed transaction if PQ is registered.
3. **Parameter agility**: the Q-chain VM can be upgraded to new PQ standards (e.g., if NIST revises parameters) via subnet governance.

## Reference

| Resource | Location |
|---|---|
| Quantum VM | `github.com/luxfi/node/vms/qvm/` |
| Dilithium implementation | `github.com/luxfi/node/crypto/dilithium/` |
| Kyber implementation | `github.com/luxfi/node/crypto/kyber/` |
| NTT acceleration | LPS-029 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
