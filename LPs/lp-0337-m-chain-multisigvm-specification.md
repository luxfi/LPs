---
lp: 0337
title: M-Chain (MultisigVM) Specification [DEPRECATED]
description: DEPRECATED - Traditional n-of-m multisig is handled natively by P-Chain and X-Chain. Threshold cryptography operations are handled by T-Chain (ThresholdVM).
author: Lux Protocol Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Withdrawn
type: Standards Track
category: Core
created: 2025-12-11
withdrawal-reason: Architecture consolidation - P-Chain/X-Chain provide native multisig, T-Chain provides threshold signatures
superseded-by: lp-0330
---

# LP-0337: M-Chain (MultisigVM) Specification [DEPRECATED]

## Deprecation Notice

**This LP has been WITHDRAWN and is no longer part of the Teleport Bridge System architecture.**

### Reason for Deprecation

The M-Chain concept has been deprecated for the following reasons:

1. **Native P-Chain Multisig**: Lux Network's P-Chain already provides native n-of-m multisig authorization for subnet operations, validator management, and governance transactions. See the P-Chain documentation for multisig workflows.

2. **Native X-Chain Multisig**: The X-Chain supports multisig UTXO transactions natively for asset transfers.

3. **T-Chain for Threshold Operations**: Threshold cryptography (t-of-n signatures where no party holds the complete key) is handled by T-Chain (ThresholdVM) as specified in [LP-0330](./lp-0330-t-chain-thresholdvm-specification.md).

4. **No Separate Chain Needed**: Adding a dedicated M-Chain for explicit multisig would duplicate functionality already available on P-Chain and X-Chain, adding unnecessary complexity.

### Migration Guide

For implementations that were planning to use M-Chain:

| Use Case | Recommended Solution |
|----------|---------------------|
| Subnet governance | P-Chain native multisig |
| Validator management | P-Chain native multisig |
| Asset transfers with multisig | X-Chain UTXO multisig |
| Bridge governance | T-Chain threshold signatures with explicit signer tracking |
| DAO treasury | T-Chain with linked governance keys |
| Gnosis Safe compatibility | Deploy Safe contracts on C-Chain |

### P-Chain Native Multisig

The P-Chain supports N-of-M authorization natively:

```bash
# Create a multisig subnet with 2-of-3 authorization
lux subnet create mySubnet --control-keys "P-lux1...,P-lux2...,P-lux3..." --threshold 2

# Sign a transaction with multisig
lux key sign tx.json --key-name signer1
lux key sign tx.json --key-name signer2

# Commit the signed transaction
lux subnet commit tx.json
```

### T-Chain for Threshold Signatures

For threshold operations where no single party holds the complete key:

```go
// T-Chain managed key with explicit signer tracking
type ManagedKey struct {
    KeyID        KeyID              // "governance-treasury"
    PublicKey    []byte             // Aggregated public key
    Algorithm    SignatureAlgorithm // CGG21 for ECDSA
    Threshold    uint32             // t: minimum signers required
    TotalParties uint32             // n: total parties holding shares
    PartyIDs     []party.ID         // Current signer set (explicit)
    Generation   uint32             // Incremented on reshare
}
```

### References

- [LP-0330: T-Chain ThresholdVM Specification](./lp-0330-t-chain-thresholdvm-specification.md) - Threshold cryptography
- [LP-0329: Teleport Bridge System Index](./lp-0329-teleport-bridge-system-index.md) - System overview
- [P-Chain Multisig Documentation](https://docs.lux.network/reference/luxd/p-chain/multisig)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
