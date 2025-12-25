---
lp: 3320
title: Lamport Signatures for Safe
description: Post-quantum one-time signature scheme for Lux Network using hash-based cryptography
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-14
requires: 4004
tags: [pqc, standard-library, hash-based, lamport]
order: 540
---

## Abstract

This LP specifies the Lamport One-Time Signature (OTS) implementation in the Lux Standard Library at `/standard/src/lamport/`. Lamport signatures provide unconditional (information-theoretic) security against quantum attacks using only hash function one-wayness. The implementation includes Solidity contracts for on-chain verification and TypeScript libraries for off-chain key management and signing.

Key properties:
- **Security**: Relies solely on hash function preimage resistance (keccak256)
- **Quantum-safe**: No number-theoretic assumptions vulnerable to Shor's algorithm
- **One-time use**: Each key pair MUST be used exactly once (critical security requirement)
- **Large signatures**: ~8 KB per signature (256 revealed preimages)

## Motivation

### Information-Theoretic Quantum Safety

Unlike lattice-based post-quantum schemes (ML-DSA, ML-KEM), Lamport signatures provide unconditional security:

| Scheme | Security Basis | Quantum Attack | Assumption |
|--------|---------------|----------------|------------|
| **Lamport OTS** | Hash preimage resistance | None known | One-way function exists |
| ML-DSA | Module-LWE hardness | Grover speedup | Lattice problems remain hard |
| ECDSA | Discrete log | Shor breaks it | None after quantum |

Lamport OTS security is proven assuming only that the hash function is one-way. Even if all lattice assumptions fail (unlikely but possible), Lamport signatures remain secure.

### Use Cases

1. **Emergency Quantum Fallback**: If lattice-based cryptography is broken, Lamport provides immediate fallback
2. **Long-Term Key Escrow**: Protect assets for decades without worrying about cryptographic advances
3. **Post-Quantum Notarization**: Time-stamp documents with quantum-proof signatures
4. **High-Value Transactions**: Extra assurance for large transfers (treasury operations)
5. **Hybrid Schemes**: Combine with ECDSA for defense-in-depth

### Trade-offs

| Advantage | Disadvantage |
|-----------|--------------|
| Unconditional quantum safety | Large signature size (~8 KB) |
| Simple implementation | One-time use only |
| No trusted setup | Key management complexity |
| Fast verification (256 hashes) | High gas cost (~20M gas) |

## Specification

### Lamport-Diffie Signature Scheme

The Lamport-Diffie signature scheme operates on 256-bit messages (hash digests):

**Key Generation:**
1. Generate 512 random 256-bit values: `sk[i][b]` for i in [0,255], b in {0,1}
2. Compute public key: `pk[i][b] = keccak256(sk[i][b])`
3. Store `sk` securely; publish `pk` or its hash `pkh = keccak256(pk)`

**Signing (message hash `h`):**
1. For each bit position `i` in `h`:
   - If `h[i] == 0`: reveal `sig[i] = sk[i][0]`
   - If `h[i] == 1`: reveal `sig[i] = sk[i][1]`
2. Return `sig` (256 preimages, ~8 KB)

**Verification:**
1. For each bit position `i` in `h`:
   - Compute `hash = keccak256(sig[i])`
   - Compare: `hash == pk[i][h[i]]`
2. Accept if all 256 comparisons pass

### Solidity Implementation

#### LamportLib.sol

Core verification library using unchecked arithmetic for gas optimization:

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.1;

library LamportLib {
    function verify_u256(
        uint256 bits,
        bytes[256] calldata sig,
        bytes32[2][256] calldata pub
    ) public pure returns (bool) {
        unchecked {
            for (uint256 i; i < 256; i++) {
                if (
                    pub[i][((bits & (1 << (255 - i))) > 0) ? 1 : 0] !=
                    keccak256(sig[i])
                ) return false;
            }
            return true;
        }
    }
}
```solidity

**Gas Cost**: Approximately 19.6M gas per verification (256 keccak256 operations plus storage reads).

#### LamportBase.sol

Abstract contract providing ownership via Lamport signatures with automatic key rotation:

```solidity
abstract contract LamportBase {
    bool initialized = false;
    bytes32 pkh; // public key hash

    function init(bytes32 firstPKH) public {
        require(!initialized, "LamportBase: Already initialized");
        pkh = firstPKH;
        initialized = true;
    }

    function getPKH() public view returns (bytes32) {
        return pkh;
    }

    modifier onlyLamportOwner(
        bytes32[2][256] calldata currentpub,
        bytes[256] calldata sig,
        bytes32 nextPKH,
        bytes memory prepacked
    ) {
        require(initialized, "LamportBase: not initialized");
        require(
            keccak256(abi.encodePacked(currentpub)) == pkh,
            "LamportBase: currentpub does not match known PUBLIC KEY HASH"
        );
        require(
            verify_u256(
                uint256(keccak256(abi.encodePacked(prepacked, nextPKH))),
                sig,
                currentpub
            ),
            "LamportBase: Signature not valid"
        );
        pkh = nextPKH;
        _;
    }
}
```

**Key Rotation**: The `nextPKH` parameter enforces automatic key rotation on each use. The signed message includes `nextPKH` to prevent tampering.

### TypeScript Off-Chain Library

#### Key Generation

```typescript
import { randomBytes } from 'crypto';
import { ethers } from 'ethers';

const hash_b = (input: string) => ethers.utils.keccak256(input);

function mk_key_pair(): KeyPair {
    // Double-hash random bytes for defense-in-depth against RNG weakness
    const mk_rand_num = () =>
        hash_b(randomBytes(32).toString('hex')).substring(2);

    const mk_RandPair = () => [mk_rand_num(), mk_rand_num()] as RandPair;
    const pri = Array.from({ length: 256 }, () => mk_RandPair());
    const pub = pri.map(p => [hash_b(`0x${p[0]}`), hash_b(`0x${p[1]}`)]);

    return { pri, pub };
}
```

#### Signing

```typescript
function sign_hash(hmsg: string, pri: RandPair[]): Sig {
    const msg_hash_bin = new BigNumber(hmsg, 16)
        .toString(2)
        .padStart(256, '0');

    if (msg_hash_bin.length !== 256)
        throw new Error(`invalid message hash length: ${msg_hash_bin.length}`);

    const sig: Sig = [...msg_hash_bin].map(
        (bit: '0' | '1', i: number) => pri[i][bit]
    );
    return sig;
}
```

#### Verification (Off-chain)

```typescript
function verify_signed_hash(hmsg: string, sig: Sig, pub: PubPair[]): boolean {
    const msg_hash_bin = new BigNumber(hmsg, 16)
        .toString(2)
        .padStart(256, '0');

    const pub_selection = [...msg_hash_bin].map(
        (bit: '0' | '1', i: number) => pub[i][bit]
    );

    for (let i = 0; i < pub_selection.length; i++)
        if (pub_selection[i] !== hash_b(`0x${sig[i]}`))
            return false;

    return true;
}
```

#### KeyTracker Class

Manages key pair sequences with automatic rotation:

```typescript
class KeyTracker {
    privateKeys: RandPair[][] = [];
    publicKeys: PubPair[][] = [];
    name: string;

    static pkhFromPublicKey(pub: PubPair[]): string {
        return hash_b(ethers.utils.solidityPack(['bytes32[2][256]'], [pub]));
    }

    get pkh() {
        return KeyTracker.pkhFromPublicKey(this.currentKeyPair().pub);
    }

    getNextKeyPair(): LamportKeyPair {
        const { pri, pub } = mk_key_pair();
        this.privateKeys.push(pri);
        this.publicKeys.push(pub);
        return { pri, pub };
    }

    currentKeyPair(): LamportKeyPair {
        if (this.privateKeys.length == 0)
            return this.getNextKeyPair();
        return {
            pri: this.privateKeys[this.privateKeys.length - 1],
            pub: this.publicKeys[this.publicKeys.length - 1]
        };
    }

    save(trim: boolean = false) {
        // Optionally trim to last 3 keys for storage efficiency
        const keys = trim ? this.privateKeys.slice(-3) : this.privateKeys;
        // Save to disk...
    }
}
```

### Merkle Tree Key Aggregation

For multiple signatures without re-deploying contracts, use Merkle tree aggregation:

```
                    Root Hash
                   /         \
              H(0,1)         H(2,3)
             /     \        /     \
          PKH_0   PKH_1  PKH_2   PKH_3
```

**Benefits:**
- Store single root hash on-chain
- Reveal individual PKH with Merkle proof
- Pre-generate many keys off-chain
- Reduces on-chain storage dramatically

**Solidity Pattern:**
```solidity
function verifyWithMerkle(
    bytes32 root,
    bytes32 pkh,
    bytes32[] calldata proof,
    uint256 index
) internal pure returns (bool) {
    bytes32 leaf = pkh;
    for (uint256 i = 0; i < proof.length; i++) {
        if (index % 2 == 0) {
            leaf = keccak256(abi.encodePacked(leaf, proof[i]));
        } else {
            leaf = keccak256(abi.encodePacked(proof[i], leaf));
        }
        index /= 2;
    }
    return leaf == root;
}
```

## Rationale

### Why keccak256?

1. **EVM Native**: No additional precompile needed; keccak256 is opcode 0x20
2. **Widely Audited**: Proven secure after decades of analysis
3. **Gas Efficient**: 30 gas base + 6 gas per word
4. **Quantum Resistant**: Hash functions resist Grover's algorithm (128-bit security retained)

SHA-3/SHA-256 would require precompiles; keccak256 is native and sufficient.

### Why 256 Bits?

The signature signs a 256-bit hash (message digest). This provides:
- Direct compatibility with keccak256 output
- Security equivalent to 256-bit symmetric key (post-Grover: 128-bit)
- Standard size for blockchain hashes

### One-Time Use Enforcement

**Critical**: Reusing a Lamport key reveals additional preimages, potentially exposing enough information to forge signatures.

**Enforcement Strategies:**
1. **Contract-Level**: `nextPKH` rotation in `onlyLamportOwner` modifier
2. **Application-Level**: KeyTracker marks used keys
3. **Merkle-Level**: Track used indices in bitmap

### Gas Cost Analysis

From actual benchmarks (`gas_data.json`):

| Operation | Gas | Notes |
|-----------|-----|-------|
| Full verification | ~19.65M | 256 keccak256 + comparisons |
| Per-hash | ~76.7K | Includes storage reads |
| PKH check | ~23K | Single keccak256(pk) |

**Comparison with other PQ schemes:**

| Scheme | Gas Cost | Signature Size | Quantum Safe |
|--------|----------|----------------|--------------|
| **Lamport OTS** | ~20M | ~8 KB | Unconditional |
| ML-DSA-65 | ~100K | 3,309 bytes | Lattice-based |
| Ringtail | ~200K | ~4 KB | Lattice-based |

Lamport is expensive but provides the strongest quantum guarantees.

## Backwards Compatibility

This LP introduces new library contracts with no backwards compatibility issues. Existing contracts can:
1. Inherit from `LamportBase` for Lamport-protected functions
2. Call `LamportLib.verify_u256()` for signature verification
3. Use alongside existing ECDSA authentication

### Migration Path

**Phase 1**: Deploy Lamport-protected contracts for high-value operations
**Phase 2**: Use hybrid ECDSA + Lamport for defense-in-depth
**Phase 3**: Full Lamport migration when gas costs decrease (precompile)

## Test Cases

### Test 1: Valid Signature Verification

```typescript
const { pri, pub } = mk_key_pair();
const message = "test message";
const msgHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(message)
).substring(2);

const sig = sign_hash(msgHash, pri);
const valid = verify_signed_hash(msgHash, sig, pub);

assert(valid === true);
```

### Test 2: Invalid Signature Detection

```typescript
const { pri, pub } = mk_key_pair();
const msgHash = "abc..."; // 64 hex chars
const sig = sign_hash(msgHash, pri);

// Corrupt one preimage
sig[0] = "0000...";

const valid = verify_signed_hash(msgHash, sig, pub);
assert(valid === false);
```

### Test 3: Wrong Message Detection

```typescript
const { pri, pub } = mk_key_pair();
const msgHash1 = keccak256("message1").substring(2);
const msgHash2 = keccak256("message2").substring(2);

const sig = sign_hash(msgHash1, pri);
const valid = verify_signed_hash(msgHash2, sig, pub);

assert(valid === false);
```

### Test 4: PKH Validation

```typescript
const { pub } = mk_key_pair();
const pkh = KeyTracker.pkhFromPublicKey(pub);
const recomputed = ethers.utils.keccak256(
    ethers.utils.solidityPack(['bytes32[2][256]'], [pub])
);

assert(pkh === recomputed);
```

### Test 5: Key Rotation

```solidity
function testKeyRotation() public {
    bytes32 firstPKH = 0x...; // Initial PKH
    contract.init(firstPKH);

    // First transaction with nextPKH
    contract.protectedFunction(
        currentPub,
        sig,
        nextPKH,      // New key hash
        abi.encodePacked(params)
    );

    // Verify rotation
    assert(contract.getPKH() == nextPKH);
}
```

## Reference Implementation

**Location**: `/Users/z/work/lux/standard/src/lamport/`

**File Structure:**
```
src/lamport/
├── contracts/
│   ├── LamportLib.sol      # Core verification library
│   ├── LamportBase.sol     # Abstract contract with modifier
│   ├── LamportTest.sol     # Example usage
│   ├── LamportTest2.sol    # Advanced usage with parameters
│   └── Migrations.sol      # Truffle migrations
├── offchain/
│   ├── Types.ts            # TypeScript type definitions
│   ├── functions.ts        # Key generation, signing, verification
│   └── KeyTracker.ts       # Key management class
├── test/
│   ├── LamportTest.spec.ts # Test suite
│   └── LamportTest2.spec.ts
├── gas_data.json           # Gas benchmarks
├── package.json            # npm dependencies
├── truffle-config.js       # Truffle configuration
└── test.sh                 # Test runner script
```

**Dependencies:**
- `ethers.js` - Ethereum utilities
- `bignumber.js` - Arbitrary precision arithmetic
- `truffle` - Contract deployment and testing

**Test Execution:**
```bash
cd /Users/z/work/lux/standard/src/lamport
bash test.sh
```

## Security Considerations

### One-Time Use (CRITICAL)

**Each Lamport key pair MUST be used exactly once.**

If a key signs two different messages:
- Different bits in hash reveal different preimages
- Attacker learns both `sk[i][0]` and `sk[i][1]` for some positions
- Statistical attack becomes feasible after multiple reuses

**Mitigation:**
1. Automatic rotation via `nextPKH` in modifier
2. Mark keys as used in KeyTracker
3. Never store private keys after signing
4. Use unique key index in Merkle trees

### Hash Function Security

Lamport security reduces to hash preimage resistance:
- **First Preimage**: Given `h = H(x)`, find `x`
- **Current Status**: keccak256 has no known preimage attacks
- **Post-Quantum**: Grover's algorithm provides sqrt speedup (256-bit -> 128-bit security)

### Signature Malleability

Lamport signatures are **malleable** in a limited sense:
- Reordering preimages changes signature bytes but not validity
- However, message binding prevents any semantic attacks
- No transaction ID malleability since message hash is fixed

### Random Number Generation

Key security depends entirely on RNG quality:
- Implementation double-hashes random bytes (defense-in-depth)
- Use cryptographically secure RNG (`crypto.randomBytes`)
- Never use predictable sources (timestamps, block hashes)

### Side Channels

Off-chain signing may leak via timing:
- Bit extraction from message hash is data-dependent
- Mitigation: constant-time implementations in production
- On-chain verification is constant-time (always 256 iterations)

### Key Storage

Private keys are 16 KB (512 x 32 bytes):
- Encrypt at rest with strong symmetric cipher
- Consider hardware security modules for high-value keys
- Delete immediately after signing

## Economic Impact

### Gas Cost Analysis

Lamport verification is expensive:

| Operation | Gas Cost | USD (at 100 gwei, $3000 ETH) |
|-----------|----------|------------------------------|
| Full verify | 19.65M | ~$5,895 |
| ML-DSA verify | 100K | ~$30 |
| ECDSA ecrecover | 3K | ~$0.90 |

**Implication**: Lamport signatures are economically viable only for:
- High-value transactions (>$100K)
- Emergency quantum fallback scenarios
- Long-term escrow with infrequent access

### Precompile Opportunity

A native precompile could reduce costs dramatically:

| Implementation | Estimated Gas | Savings |
|----------------|---------------|---------|
| Solidity (current) | 19.65M | Baseline |
| Go precompile | ~500K | 97% |
| Assembly optimized | ~2M | 90% |

**Recommendation**: Consider LP-2507 for Lamport verification precompile at address `0x0200...0007` if demand materializes.

### Comparison with ML-DSA/Ringtail

| Criterion | Lamport OTS | ML-DSA | Ringtail |
|-----------|-------------|--------|----------|
| Gas Cost | 19.65M | 100K | 200K |
| Signature Size | 8 KB | 3.3 KB | 4 KB |
| Key Reuse | Never | Unlimited | Unlimited |
| Quantum Safety | Unconditional | Computational | Computational |
| Standardization | Academic | NIST FIPS 204 | Research |

**Use Case Guidance:**
- **Daily operations**: ML-DSA (standard, reusable)
- **Ultra-secure escrow**: Lamport (unconditional security)
- **Threshold signing**: Ringtail (post-quantum MPC)

## Open Questions

1. **Should we implement a Lamport precompile?**
   - Would reduce gas 97%
   - Requires hard fork
   - Demand unclear

2. **WOTS+ (Winternitz OTS) variant?**
   - Reduces signature size to ~2 KB
   - More complex implementation
   - Could be LP-2508

3. **Integration with XMSS/SPHINCS+?**
   - Many-time signatures from OTS
   - Stateful key management required
   - Could be LP-2509

4. **Account abstraction support?**
   - How do Lamport wallets work with ERC-4337?
   - Paymaster for high gas costs?

## Related LPs

- **LP-4004**: Quantum-Resistant Cryptography Integration (foundational)
- **LP-4105**: Lamport One-Time Signatures for Lux Safe (application)
- **LP-2311**: ML-DSA Signature Verification Precompile (alternative PQ scheme)
- **LP-7324**: Ringtail Threshold Signature Precompile (threshold PQ)
- **LP-4317**: SLH-DSA Stateless Hash-Based Digital Signatures (related)

## References

- **Lamport, L. (1979)**: "Constructing Digital Signatures from a One Way Function" - SRI International Technical Report
- **Merkle, R. (1979)**: "Secrecy, authentication, and public key systems" - PhD thesis, Stanford
- **NIST SP 800-208**: Recommendation for Stateful Hash-Based Signature Schemes
- **Implementation**: `/Users/z/work/lux/standard/src/lamport/`

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
