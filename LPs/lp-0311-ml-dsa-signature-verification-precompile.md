---
lp: 0311
title: ML-DSA Signature Verification Precompile
description: Native precompile for NIST FIPS 204 ML-DSA (Dilithium) post-quantum signature verification
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-11-13
requires: 4
activation:
  flag: lp311-mldsa-precompile
  hfName: "Quantum"
  activationHeight: "0"
tags: [pqc, precompile, evm]
---

## Abstract

This LP specifies a precompiled contract for verifying ML-DSA (Module-Lattice-Based Digital Signature Algorithm) signatures as standardized in NIST FIPS 204. The precompile implements ML-DSA-65 (security level 3) verification at address `0x0200000000000000000000000000000000000006`, providing quantum-resistant signature verification with ~108μs performance on modern hardware.

## Activation

| Parameter          | Value                           |
|--------------------|---------------------------------|
| Flag string        | `lp311-mldsa-precompile`        |
| Precompile Address | `0x020...0006`                  |
| Default in code    | **false** until Quantum fork    |
| Deployment branch  | `v1.21.0-lp311`                 |
| Roll‑out criteria  | Q-Chain activation              |
| Back‑off plan      | Disable via chain config        |

## Motivation

### The Quantum Computing Threat

Current blockchain cryptography relies on ECDSA (secp256k1, secp256r1) which is vulnerable to Shor's algorithm running on sufficiently powerful quantum computers. NIST estimates that by 2030-2035, quantum computers may be capable of breaking these classical signatures.

### Why ML-DSA?

ML-DSA (formerly Dilithium) was selected by NIST in 2024 as the primary post-quantum digital signature standard (FIPS 204) because:

1. **Security**: Based on the hardness of Module-LWE and Module-SIS lattice problems, believed quantum-resistant
2. **Performance**: Faster verification than other PQ signatures (108μs vs 15ms for SLH-DSA)
3. **Standardization**: Official NIST standard with security proofs
4. **Key Sizes**: Balanced size/performance tradeoff (1952 byte pubkey, 3309 byte signature)

### Use Cases

- **Quantum-Safe Wallets**: Protect user funds from future quantum attacks
- **Cross-Chain Messages**: Secure warp message authentication  
- **Validator Signatures**: Post-quantum validator consensus
- **Long-Term Archives**: Sign documents meant to remain secure for decades
- **Hybrid Schemes**: Combine with ECDSA for defense-in-depth

## Specification

### Precompile Address

```
0x0200000000000000000000000000000000000006
```

### Input Format

The precompile accepts a packed binary input with the following structure:

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 1952   | `publicKey` | ML-DSA-65 public key |
| 1952   | 32     | `messageLength` | Message length as big-endian uint256 |
| 1984   | 3309   | `signature` | ML-DSA-65 signature |
| 5293   | variable | `message` | Message to verify (length from field above) |

**Total minimum size**: 5293 bytes (without message)

### Output Format

The precompile returns a 32-byte word:
- `0x0000000000000000000000000000000000000000000000000000000000000001` - signature valid
- `0x0000000000000000000000000000000000000000000000000000000000000000` - signature invalid

### Gas Cost

```
gas = BASE_COST + (messageLength * PER_BYTE_COST)

Where:
  BASE_COST = 100,000 gas
  PER_BYTE_COST = 10 gas
```

**Examples:**
- Empty message: 100,000 gas
- 100 bytes: 101,000 gas  
- 1 KB: 110,240 gas
- 10 KB: 202,400 gas

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMLDSA {
    /**
     * @dev Verifies an ML-DSA-65 signature
     * @param publicKey The 1952-byte ML-DSA-65 public key
     * @param message The message that was signed
     * @param signature The 3309-byte ML-DSA-65 signature  
     * @return valid True if signature is valid
     */
    function verify(
        bytes calldata publicKey,
        bytes calldata message,
        bytes calldata signature
    ) external view returns (bool valid);
}
```

### Example Usage

```solidity
contract QuantumSafeVault {
    IMLDSA constant mldsa = IMLDSA(0x0200000000000000000000000000000000000006);
    
    mapping(bytes => bool) public authorizedKeys;
    
    function withdraw(
        bytes calldata publicKey,
        bytes calldata message,
        bytes calldata signature,
        uint256 amount
    ) external {
        require(authorizedKeys[publicKey], "Unauthorized key");
        require(mldsa.verify(publicKey, message, signature), "Invalid signature");
        
        // Decode message and process withdrawal
        // ...
    }
}
```

## Rationale

### Why ML-DSA-65 Specifically?

ML-DSA comes in three security levels:
- **ML-DSA-44**: Level 1 (128-bit equivalent) - Fastest but least secure
- **ML-DSA-65**: Level 3 (192-bit equivalent) - **Recommended balance**
- **ML-DSA-87**: Level 5 (256-bit equivalent) - Slowest but most secure

We chose ML-DSA-65 as the default because:
1. NIST recommends level 3 for most applications
2. Performance is acceptable (~108μs verify)
3. Security margin is conservative
4. Matches current usage of AES-192 in other contexts

### Gas Cost Justification

The gas formula `100,000 + 10*messageLength` is derived from:

1. **Computational Cost**: ML-DSA verification takes ~108μs on Apple M1
2. **Comparison to ECRECOVER**: `ecrecover` costs 3,000 gas for ~50μs = 60 gas/μs
3. **ML-DSA Estimate**: 108μs * 60 gas/μs = 6,480 gas
4. **Base Cost Multiplier**: 15x for post-quantum complexity = ~97,000 gas
5. **Rounded to**: 100,000 gas base

The per-byte cost accounts for message hashing overhead.

### Why Not Support All ML-DSA Variants?

Supporting multiple variants (44, 65, 87) would require:
- More complex input encoding (variant selector byte)
- Multiple code paths in implementation
- More extensive testing
- Confusion about which to use

Instead, we provide ML-DSA-65 only and recommend:
- Use ML-DSA-44 via library for performance-critical apps
- Use ML-DSA-87 via library for ultra-secure applications
- Both can be added as separate precompiles if demand arises

### Input Encoding Design

The input format was chosen to:
1. **Avoid ABI encoding**: More efficient for large signatures
2. **Support variable messages**: Length prefix allows any message size
3. **Match native format**: Direct mapping to ML-DSA implementation
4. **Be deterministic**: No ambiguity in parsing

## Backwards Compatibility

This LP introduces a new precompile and has no backwards compatibility issues. Contracts compiled before this LP can call the precompile after activation.

### Migration Path

Existing contracts using ECDSA can adopt ML-DSA incrementally:

**Phase 1**: Support both ECDSA and ML-DSA signatures
```solidity
function verifySignature(bytes calldata data, bytes calldata sig) {
    if (sig.length == 65) {
        // ECDSA signature
        return verifyECDSA(data, sig);
    } else if (sig.length == 3309) {
        // ML-DSA signature
        return verifyMLDSA(data, sig);
    }
    revert("Unknown signature type");
}
```

**Phase 2**: Migrate all keys to ML-DSA over time

**Phase 3**: Deprecate ECDSA support after sunset period

## Test Cases

### Test Vector 1: Valid Signature

**Input:**
```
publicKey: 0x<1952 bytes of ML-DSA public key>
message: "Hello, quantum-safe world!"
signature: 0x<3309 bytes of ML-DSA signature>
```

**Expected Output:** `0x0000...0001` (valid)
**Expected Gas:** ~100,270 gas (27 byte message)

### Test Vector 2: Invalid Signature

**Input:**
```
publicKey: 0x<1952 bytes of ML-DSA public key>
message: "Hello, quantum-safe world!"
signature: 0x<3309 bytes of WRONG signature>
```

**Expected Output:** `0x0000...0000` (invalid)
**Expected Gas:** ~100,270 gas (verification still runs)

### Test Vector 3: Tampered Message

**Input:**
```
publicKey: 0x<1952 bytes of ML-DSA public key>
message: "Tampered message"
signature: 0x<3309 bytes signature for DIFFERENT message>
```

**Expected Output:** `0x0000...0000` (invalid)

### Test Vector 4: Invalid Input Length

**Input:** `0x1234` (too short)

**Expected:** Revert with "invalid input length"

### Test Vector 5: Large Message

**Input:**
```
publicKey: 0x<1952 bytes>
message: 0x<10KB of data>
signature: 0x<3309 bytes>
```

**Expected Gas:** ~202,400 gas

## Reference Implementation

See: `standard/src/precompiles/mldsa/`

**Key Files:**
- `contract.go`: Core precompile implementation
- `module.go`: Precompile registration
- `contract_test.go`: Comprehensive test suite
- `IMLDSA.sol`: Solidity interface and library

**Cryptography:**
- Implementation: `crypto/mldsa/`
- Backend: github.com/cloudflare/circl (FIPS 204 compliant)

## Security Considerations

### Post-Quantum Security

ML-DSA's security rests on the computational hardness of:
1. **Module-LWE** (Learning With Errors over modules)
2. **Module-SIS** (Short Integer Solution over modules)

Both problems are believed to be hard even for quantum computers. NIST security level 3 means:
- At least as hard to break as **AES-192**
- Resistant to **Grover's algorithm** (quantum search)
- Resistant to **Shor's algorithm** (quantum factoring/discrete log)

### Classical Security

ML-DSA signatures are **deterministic**, meaning:
- ✅ **Good**: No randomness needed for signing (no RNG vulnerabilities)
- ⚠️ **Consideration**: Side-channel attacks possible if implementation isn't constant-time
- ✅ **Mitigation**: We use FIPS 204 compliant implementation with side-channel protections

### Implementation Security

**Validated Components:**
- Uses Cloudflare's CIRCL library (audited, open-source)
- FIPS 204 compliant implementation
- Constant-time operations where possible

**Input Validation:**
- All input lengths checked before parsing
- Public key and signature sizes validated
- Message length checked against actual input
- No buffer overflows possible

**DoS Protection:**
- Gas costs prevent computational DoS
- Maximum message size limited by block gas limit
- Early validation of input sizes

### Signature Malleability

ML-DSA signatures are **non-malleable** - an attacker cannot modify a valid signature to create another valid signature for the same message. This prevents:
- Replay attacks with modified signatures
- Transaction ID malleability
- Double-spend attempts

### Key Management

**Critical Requirements:**
1. **Secret keys must be 64 bytes of cryptographic randomness**
2. **Keys should be stored encrypted at rest**
3. **Never reuse ephemeral randomness** (though ML-DSA is deterministic)
4. **Implement key rotation policies**

**Recommendations:**
- Use HD (Hierarchical Deterministic) key derivation
- Store keys in hardware security modules when possible
- Implement multi-party computation for ultra-high-value keys

### Hybrid Signatures

For defense-in-depth, consider requiring both ECDSA and ML-DSA:

```solidity
function verifyHybrid(
    bytes calldata ecdsaSig,
    bytes calldata mldsaSig,
    bytes calldata message
) internal view returns (bool) {
    return verifyECDSA(message, ecdsaSig) && 
           verifyMLDSA(message, mldsaSig);
}
```

This provides security even if one algorithm is broken.

### Long-Term Security

ML-DSA signatures remain valid indefinitely, but:
- Monitor NIST updates on post-quantum cryptography
- Plan migration path if vulnerabilities discovered
- Archive verification code with signatures for future validation

## Economic Impact

### Gas Cost Impact

ML-DSA verification is more expensive than ECDSA:
- **ECDSA**: ~3,000 gas
- **ML-DSA**: ~100,000 gas (33x more)

This may impact:
- **Transaction costs**: Quantum-safe txs cost more
- **Contract execution**: Signature-heavy contracts pay more
- **Cross-chain messages**: Warp messages with PQ sigs increase fees

### Mitigation Strategies

1. **Batching**: Verify multiple signatures in single transaction
2. **Caching**: Store verification results for known good keys
3. **Hybrid**: Use ECDSA for low-value, ML-DSA for high-value
4. **Subsidization**: Protocol could subsidize PQ verification gas

### Fee Revenue

Higher gas costs for PQ operations generate more fee revenue for validators, creating incentive to support post-quantum security.

## Open Questions

1. **Should we add ML-DSA-44 and ML-DSA-87 variants?**
   - Defer until demand is clear
   - Can add as new precompiles if needed

2. **Should we support contextual strings?**
   - ML-DSA allows optional context strings
   - Currently unsupported for simplicity
   - Can add if required

3. **Should we cache verification results?**
   - Could reduce gas for repeated verifications
   - Adds complexity and attack surface
   - Defer to L2 optimization

4. **Integration with account abstraction?**
   - How do ML-DSA wallets work with ERC-4337?
   - Need to design account abstraction support

## References

- **NIST FIPS 204**: https://csrc.nist.gov/pubs/fips/204/final
- **Dilithium Specification**: https://pq-crystals.org/dilithium/
- **CIRCL Library**: https://github.com/cloudflare/circl
- **LP-4**: Quantum-Resistant Cryptography Integration
- **Implementation**: `standard/src/precompiles/mldsa/`

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
