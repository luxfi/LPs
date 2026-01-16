---
lp: 6410
title: LuxDA Bus Namespace Model
description: LuxDA Bus Namespace Model specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines the namespace model for LuxDA Bus, including namespace ID derivation, ownership, policy management, and governance mechanisms. Namespaces are the fundamental organizational unit for ordered message delivery.

## Motivation

Applications using LuxDA Bus need isolated, ordered messaging channels with configurable access control. The namespace model must:

1. Enable permissionless namespace creation
2. Support flexible access control (public, permissioned, private)
3. Allow policy evolution without breaking references
4. Integrate with identity and crypto policy systems

## Specification

### 1. Namespace ID Derivation

#### 1.1 Standard Derivation

```
NamespaceId := SHA3-256(
    "lux.ns.v1" ||
    owner.address ||
    salt ||
    creationBlock
)[0:20]
```

- `owner.address`: 20-byte Ethereum-style address
- `salt`: 32-byte random value chosen by creator
- `creationBlock`: 8-byte block number at creation
- Result: 20-byte namespace ID (160 bits)

#### 1.2 Deterministic Derivation

For system namespaces and derived channels:

```
NamespaceId := SHA3-256(
    "lux.ns.derived.v1" ||
    parentNamespace ||
    derivationPath
)[0:20]
```

Examples:
- DM namespace: `H("lux.ns.dm.v1" || sort(addr1, addr2))`
- Group namespace: `H("lux.ns.group.v1" || groupId)`
- DKG namespace: `H("lux.ns.dkg.v1" || parentNamespace)`

#### 1.3 Reserved Namespaces

| Prefix | Range | Purpose |
|--------|-------|---------|
| `0x00` | `0x00...00` - `0x00...FF` | System namespaces |
| `0x01` | `0x01...00` - `0x01...FF` | Chain-specific reserved |
| `0xFF` | `0xFF...00` - `0xFF...FF` | Test/development |

### 2. Namespace Policy

#### 2.1 Policy Structure

```go
type NamespacePolicy struct {
    Version        uint16           `json:"version"`
    Owner          Identity         `json:"owner"`
    Writers        WriterSet        `json:"writers"`
    RateLimit      RateLimitConfig  `json:"rateLimit"`
    EncryptionMode EncryptionMode   `json:"encryptionMode"`
    TFHEOrch       bool             `json:"tfheOrch"`
    RetentionClass RetentionClass   `json:"retentionClass"`
    PQMode         PQMode           `json:"pqMode"`
    CustomParams   map[string]any   `json:"customParams,omitempty"`
}

type WriterSet struct {
    Mode    WriterMode   `json:"mode"`    // Open, Allowlist, TokenGated
    List    []Identity   `json:"list,omitempty"`
    TokenGate *TokenGate `json:"tokenGate,omitempty"`
}

type RateLimitConfig struct {
    MessagesPerSecond uint32 `json:"messagesPerSecond"`
    BytesPerSecond    uint64 `json:"bytesPerSecond"`
    BurstMessages     uint32 `json:"burstMessages"`
}
```

#### 2.2 Writer Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `Open` | Anyone can write | Public channels |
| `Allowlist` | Explicit list of writers | Private groups |
| `TokenGated` | Writers must hold token | Token-gated communities |
| `OwnerOnly` | Only owner can write | Announcement channels |

#### 2.3 Encryption Modes

| Mode | Description | Key Management |
|------|-------------|----------------|
| `Plaintext` | No encryption | N/A |
| `E2EE_DM` | DM encryption | PQXDH per-session |
| `E2EE_MLS` | Group encryption | MLS epoch keys |
| `TFHE` | Homomorphic encryption | Threshold committee |

#### 2.4 PQ Modes

| Mode | KEMs Allowed | Signatures Allowed |
|------|--------------|-------------------|
| `Classical` | X25519 | Ed25519 |
| `Hybrid` | X-Wing, X25519+ML-KEM | Ed25519+ML-DSA |
| `PQOnly` | ML-KEM | ML-DSA, SLH-DSA |

### 3. Namespace Lifecycle

#### 3.1 Creation

```
CreateNamespace(salt, policy) -> (namespaceId, policyHash)
```

1. Derive `namespaceId` from sender and salt
2. Validate policy against schema
3. Store policy commitment on-chain
4. Emit `NamespaceCreated(namespaceId, owner, policyHash)` event

#### 3.2 Policy Updates

```
UpdatePolicy(namespaceId, newPolicy, ownerSig) -> policyHash
```

Constraints:
- Only owner can update policy
- Version MUST increment
- Some fields are immutable after creation (e.g., `encryptionMode`)
- Update emits `PolicyUpdated(namespaceId, version, policyHash)` event

#### 3.3 Ownership Transfer

```
TransferOwnership(namespaceId, newOwner, ownerSig) -> void
```

- Requires current owner signature
- Emits `OwnershipTransferred(namespaceId, oldOwner, newOwner)` event

### 4. Access Control

#### 4.1 Write Authorization

Before accepting a header:

```python
def authorize_write(header, policy):
    sender = recover_signer(header)

    if policy.writers.mode == "Open":
        return True

    if policy.writers.mode == "OwnerOnly":
        return sender == policy.owner

    if policy.writers.mode == "Allowlist":
        return sender in policy.writers.list

    if policy.writers.mode == "TokenGated":
        return check_token_balance(sender, policy.writers.tokenGate)

    return False
```

#### 4.2 Read Authorization

Read access is determined by encryption mode:

| Encryption Mode | Who Can Read |
|----------------|--------------|
| `Plaintext` | Anyone |
| `E2EE_DM` | Session participants |
| `E2EE_MLS` | Group members with epoch key |
| `TFHE` | Decryption committee (conditional) |

### 5. Policy Registry

#### 5.1 On-Chain Registry

```solidity
interface INamespaceRegistry {
    function createNamespace(
        bytes32 salt,
        bytes calldata policy,
        bytes calldata ownerSig
    ) external returns (bytes20 namespaceId);

    function updatePolicy(
        bytes20 namespaceId,
        bytes calldata newPolicy,
        bytes calldata ownerSig
    ) external;

    function getPolicy(bytes20 namespaceId)
        external view returns (bytes memory policy);

    function getPolicyHash(bytes20 namespaceId)
        external view returns (bytes32 policyHash);

    event NamespaceCreated(
        bytes20 indexed namespaceId,
        address indexed owner,
        bytes32 policyHash
    );

    event PolicyUpdated(
        bytes20 indexed namespaceId,
        uint16 version,
        bytes32 policyHash
    );
}
```

#### 5.2 Policy Validation

```go
func ValidatePolicy(policy *NamespacePolicy) error {
    if policy.Version == 0 {
        return ErrInvalidVersion
    }
    if policy.Owner.IsEmpty() {
        return ErrMissingOwner
    }
    if policy.RateLimit.MessagesPerSecond > MaxRateLimit {
        return ErrRateLimitTooHigh
    }
    if policy.TFHEOrch && policy.EncryptionMode != TFHE {
        return ErrInvalidTFHEConfig
    }
    return nil
}
```

### 6. Governance

#### 6.1 System Namespace Governance

System namespaces (prefix `0x00`) are governed by:
- Multi-sig of protocol foundation
- On-chain governance vote for major changes
- Timelock for policy updates

#### 6.2 Application Namespace Governance

Application namespaces support:
- Owner-controlled updates (default)
- Multi-sig ownership
- DAO governance integration
- Immutable policies (renounced ownership)

### 7. Wire Format

#### 7.1 Policy Encoding

```
PolicyV1 := {
    version:        uint16 (2 bytes)
    owner:          Identity (var)
    writersMode:    uint8 (1 byte)
    writersData:    bytes (var)
    rateLimit:      RateLimitConfig (12 bytes)
    encryptionMode: uint8 (1 byte)
    tfheOrch:       bool (1 byte)
    retentionClass: uint8 (1 byte)
    pqMode:         uint8 (1 byte)
    customLen:      uint16 (2 bytes)
    customData:     bytes (var)
}
```

#### 7.2 Namespace ID in Headers

Headers reference namespaces by their 20-byte ID:

```
Header.namespaceId: bytes20
```

## Rationale

### Why 20-Byte Namespace IDs?

- Matches Ethereum address length for tooling compatibility
- 160 bits provides sufficient collision resistance
- Compact enough for header inclusion

### Why On-Chain Policy Registry?

- Enables token-gated access control
- Provides canonical policy state
- Allows smart contract integration
- Supports governance mechanisms

### Why Immutable Encryption Mode?

Changing encryption mode mid-stream would:
- Break existing message decryption
- Confuse key management
- Create security vulnerabilities

Instead, create a new namespace with different encryption.

## Security Considerations

### Namespace Squatting

**Attack**: Register namespaces to prevent legitimate use
**Mitigation**: Require stake or fee for creation; enable dispute resolution

### Policy Tampering

**Attack**: Modify policy to add unauthorized writers
**Mitigation**: Owner signature required; on-chain commitment

### Replay Attacks

**Attack**: Replay old policy to gain access
**Mitigation**: Version numbers; policy hash in headers

## Test Plan

### Unit Tests

1. **Derivation Determinism**: Same inputs produce same namespace ID
2. **Collision Resistance**: 10^6 random inputs produce unique IDs
3. **Policy Validation**: Invalid policies are rejected

### Integration Tests

1. **Create and Query**: Create namespace; query policy; verify match
2. **Policy Update**: Update policy; verify version increment
3. **Access Control**: Verify unauthorized writes are rejected

### Conformance Fixtures

```json
{
  "namespace_derivation": [
    {
      "owner": "0x1234567890123456789012345678901234567890",
      "salt": "0xabcd....",
      "creationBlock": 1000000,
      "expectedId": "0x..."
    }
  ],
  "policy_encoding": [
    {
      "policy": { "version": 1, "owner": "0x...", ... },
      "expectedBytes": "0x..."
    }
  ]
}
```

## References

- [ERC-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [ERC-1155: Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [Lens Protocol: Profile Ownership](https://docs.lens.xyz/)

---

*LP-6410 v1.0.0 - 2026-01-02*
