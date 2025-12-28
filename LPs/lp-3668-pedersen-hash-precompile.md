---
lp: 3668
title: Pedersen Hash Precompile (ZK-Friendly Commitment)
description: Native EVM precompile for Pedersen hash function, a homomorphic commitment scheme used in zero-knowledge circuits
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-27
requires: 4
activation:
  flag: lp3668-pedersen
  hfName: "TBD"
  activationHeight: "TBD"
tags: [evm, precompile, cryptography, hash, pedersen, zk, commitment, research]
order: 3668
---

> **⚠️ DRAFT STATUS - REQUIRES SIGNIFICANT RESEARCH**
> 
> Unlike Poseidon (which has EIP-5988), there is **no mainstream EIP for Pedersen hash**.
> Pedersen is easier to get subtly wrong than people expect. This LP explores community
> interest and documents the security considerations before any implementation.

## Abstract

LP-3668 proposes a native EVM precompile for Pedersen hash, a commitment scheme based on elliptic curve scalar multiplication. Pedersen hash is used extensively in ZK circuits for:

- Merkle tree commitments (Zcash, Tornado Cash)
- Note commitments in privacy protocols
- Homomorphic operations on commitments

**This LP is exploratory** and requires community input on curve selection, encoding rules, and security properties before implementation can proceed.

## Open Questions (Critical - Blocks Implementation)

### 1. There Is No Standard

Unlike Poseidon (EIP-5988), there is **no Ethereum proposal for Pedersen hash**. This means:
- No consensus on curve choice
- No consensus on generator derivation
- No consensus on encoding format
- No reference implementation to follow

**Implication**: Lux would be defining a de-facto standard. This requires extreme care.

### 2. Pedersen Is a Family, Not a Single Function

"Pedersen hash" refers to multiple distinct constructions:

| Variant | Curve | Usage | Notes |
|---------|-------|-------|-------|
| Baby-Jubjub Pedersen | Baby-Jubjub (BN254 subgroup) | circom, Zcash | Most common in circom ecosystem |
| Jubjub Pedersen | Jubjub (BLS12-381 subgroup) | Zcash Sapling | Different curve |
| Windowed Pedersen | Various | Zcash | Optimized for specific bit widths |
| Pedersen Commitment | Generic | Bulletproofs | Different security model |

**Question**: Which variant should Lux implement? Recommend Baby-Jubjub for circom compatibility.

### 3. Subtle Security Pitfalls

Pedersen hash is **easier to get wrong** than Poseidon:

#### 3.1 Non-Unique Encodings
Using only x-coordinate can cause collisions with point negation:
```
P = (x, y) and -P = (x, -y) both have same x-coordinate
```
**Mitigation**: Use full point encoding or canonical y-coordinate selection.

#### 3.2 Related Generators
If generators G_i are derived improperly, an attacker might find discrete log relations.
```
If G_1 = k * G_0 for known k, the hash is completely broken.
```
**Mitigation**: Deterministic hash-to-curve derivation (no one can claim trapdoor).

#### 3.3 Variable-Length Input Issues
Without proper length encoding, different inputs can produce same hash:
```
H("ab", "") vs H("a", "b") - might collide without length prefix
```
**Mitigation**: Explicit length prefix inside the hash.

#### 3.4 Point-at-Infinity Edge Cases
Edge case handling for zero scalars must be carefully specified.

### 4. Curve Selection

**Recommended**: Baby-Jubjub (embedded curve in BN254)

| Property | Baby-Jubjub | Jubjub |
|----------|-------------|--------|
| Parent Curve | BN254 | BLS12-381 |
| Circom Compatible | ✅ Yes | ❌ No |
| Ethereum Compatible | ✅ Yes | Partial |
| Security Level | 128-bit | 128-bit |
| Order | ~251 bits | ~252 bits |

Baby-Jubjub is embedded in BN254, meaning Pedersen operations can be efficiently verified inside BN254 Groth16 circuits.

### 5. Generator Derivation

Generators MUST be derived deterministically so no one can claim to know discrete logs:

```
G_0 = hash_to_curve("Lux.Pedersen.Generator.0")
G_1 = hash_to_curve("Lux.Pedersen.Generator.1")
...
```

**Required**: Publish derivation seed and algorithm; verifiable by anyone.

### 6. Output Encoding

**Options**:
- Full point (64 bytes): Unambiguous but large
- Compressed point (33 bytes): Standard, requires decompression
- X-coordinate only (32 bytes): Compact but ambiguous (need canonical y)

**Recommended**: Compressed point with canonical encoding.

## Motivation (If Questions Resolved)

### Why Pedersen Over Poseidon?

| Property | Poseidon | Pedersen |
|----------|----------|----------|
| Algebraic Structure | Field arithmetic | EC scalar mult |
| Homomorphic | ❌ No | ✅ Yes (additive) |
| In-Circuit Cost | ~300 constraints | ~1,500 constraints |
| On-Chain Cost | Medium | Low (EC precompiles exist) |

Pedersen's **homomorphic property** is the key advantage:
```
Pedersen(a) + Pedersen(b) = Pedersen(a + b)
```

This enables:
- Aggregating commitments without revealing values
- Range proofs (Bulletproofs)
- Confidential transactions

### Use Cases

1. **Confidential Asset Transfers**
   - Commit to amounts without revealing
   - Verify sum(inputs) = sum(outputs) homomorphically

2. **Merkle Trees with Homomorphic Properties**
   - Aggregate proofs at tree nodes
   - Batch verification

3. **Interop with Existing ZK Systems**
   - Zcash uses Pedersen extensively
   - Many circom libraries assume Pedersen

## Specification (Tentative - Pending Questions)

> **Note**: This specification is preliminary. Final spec depends on resolving open questions.

### Precompile Address

| Address | Operation |
|---------|-----------|
| `0x0319` | Pedersen Hash Operations |

Address chosen to follow Poseidon at `0x0318`.

### Recommended Functions

**Minimal Fixed Instantiation** (recommended approach):

| Selector | Function | Gas | Description |
|----------|----------|-----|-------------|
| `0x01` | `pedersenHash(uint256 a, uint256 b)` | 1,500 | Two-input hash |
| `0x02` | `pedersenCommit(uint256 v, uint256 r)` | 1,500 | Commitment: v*G + r*H |
| `0x10` | `pedersenAdd(bytes32 c1, bytes32 c2)` | 500 | Add two commitments |

### Curve Parameters (Baby-Jubjub)

```
Curve: Baby-Jubjub (twisted Edwards)
Equation: ax² + y² = 1 + dx²y²
a = 168700
d = 168696
Base field: BN254 scalar field (Fr)
Order: 2736030358979909402780800718157159386076813972158567259200215660948447373041
Cofactor: 8
Generator G: (see derivation below)
```

### Generator Derivation

```python
import hashlib
from babyjubjub import hash_to_curve

def derive_generator(index: int) -> Point:
    seed = f"Lux.Pedersen.BabyJubjub.Generator.{index}".encode()
    return hash_to_curve(hashlib.sha256(seed).digest())

G_0 = derive_generator(0)  # For value component
G_1 = derive_generator(1)  # For blinding component (in commitments)
```

### Input/Output Encoding

**Input (pedersenHash)**:
```
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | First scalar (uint256, < field order) |
| 32 | 32 | Second scalar (uint256, < field order) |
```

**Output**:
```
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | X-coordinate of result point |
| 32 | 1 | Y-coordinate parity (0x00 or 0x01) |
```

### Gas Costs (Tentative)

Based on Baby-Jubjub scalar multiplication cost:

| Operation | Gas | Rationale |
|-----------|-----|-----------|
| pedersenHash | 1,500 | 2 scalar mults + 1 add |
| pedersenCommit | 1,500 | Same as hash |
| pedersenAdd | 500 | EC point addition |

## Rationale

Pedersen hash was chosen for ZK applications because:
1. Algebraic structure enables efficient in-circuit verification
2. Widely used in ZK protocols (Zcash, Tornado Cash, etc.)
3. Baby-Jubjub curve provides BN254 compatibility for Groth16

## Backwards Compatibility

This LP introduces new precompile addresses and does not affect existing functionality.

## Security Considerations

### 1. No Mainstream Standard Exists

**Risk**: Without an EIP or widely-adopted standard, Lux would be defining its own. Errors in specification could be catastrophic.

**Mitigation**: 
- Extensive review before implementation
- Test vectors from multiple independent implementations
- Security audit specifically for curve operations

### 2. Discrete Log Hardness

Pedersen hash security relies on discrete log being hard on Baby-Jubjub.

**Risk**: If ECDLP is broken (e.g., by quantum computers), all Pedersen hashes become reversible.

**Mitigation**: 
- Baby-Jubjub is 128-bit secure against classical attacks
- Consider post-quantum alternatives for long-term commitments

### 3. Generator Trust

**Risk**: If generators are not derived verifiably, someone might know discrete logs.

**Mitigation**: Deterministic hash-to-curve from published seed. Anyone can verify generators.

### 4. Point Validation

All input points must be validated:
- On the curve
- In the correct subgroup (avoid small-subgroup attacks)
- Not point at infinity

### 5. Encoding Canonicality

Non-canonical encodings can lead to malleability attacks.

**Mitigation**: Reject non-canonical inputs; specify single valid encoding per point.

## What This Unlocks

With cheap Pedersen on Lux EVM:

1. **Confidential Transactions**: Commit to values homomorphically
2. **Range Proofs**: Bulletproofs require Pedersen commitments
3. **Zcash Interoperability**: Many ZK protocols use Pedersen
4. **Hybrid Private/Public Modes**: 
   - Public operations use Pedersen commitments directly
   - Private operations prove knowledge inside SNARK

## Implementation Roadmap

### Phase 1: Research (Current)
- [ ] Finalize curve selection (Baby-Jubjub recommended)
- [ ] Finalize generator derivation method
- [ ] Finalize encoding specification
- [ ] Generate test vectors

### Phase 2: Specification
- [ ] Complete formal specification
- [ ] Independent review of spec
- [ ] Solidity interface library

### Phase 3: Implementation
- [ ] Go implementation in `github.com/luxfi/geth`
- [ ] Fuzz testing against reference implementations
- [ ] Gas cost benchmarking

### Phase 4: Audit & Activation
- [ ] Security audit
- [ ] Testnet deployment
- [ ] Mainnet activation

## Comparison with Alternatives

### Pedersen vs. Poseidon

| Aspect | Pedersen | Poseidon |
|--------|----------|----------|
| Homomorphic | ✅ Yes | ❌ No |
| In-Circuit Cost | ~1,500 R1CS | ~300 R1CS |
| On-Chain Cost | ~1,500 gas | ~800 gas |
| Standardization | ❌ None | Partial (EIP-5988) |
| Implementation Risk | Higher | Lower |

**Recommendation**: Implement Poseidon first (LP-3658), Pedersen second if needed.

### When to Use Each

- **Use Poseidon**: Merkle trees, general hashing, nullifiers
- **Use Pedersen**: Confidential values, range proofs, when homomorphism needed

## Test Vectors (TBD)

Test vectors will be generated from:
1. circomlib Baby-Jubjub implementation
2. Zcash Sapling (if using Jubjub variant)
3. Independent Python implementation

## References

- [Pedersen Commitments (Wikipedia)](https://en.wikipedia.org/wiki/Commitment_scheme#Pedersen_commitment)
- [Baby-Jubjub Elliptic Curve (EIP-2494)](https://eips.ethereum.org/EIPS/eip-2494)
- [circomlib Baby-Jubjub](https://github.com/iden3/circomlib/blob/master/circuits/babyjub.circom)
- [Zcash Jubjub Curve](https://github.com/zkcrypto/jubjub)
- [Bulletproofs Paper](https://eprint.iacr.org/2017/1066)
- [LP-3658: Poseidon Hash Precompile](./lp-3658-poseidon-hash-precompile.md)
- [LP-1227: Standard Ethereum Precompiles](./lp-1227-standard-ethereum-precompiles.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

---

*Last Updated: 2025-12-27*
*Status: Draft - Requires community input on curve selection and encoding before implementation*
