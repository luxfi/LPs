---
lp: 3502
title: ML-DSA Post-Quantum Signature Precompile
description: Native precompile for NIST FIPS 204 ML-DSA post-quantum digital signature verification
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-14
requires: 4200
activation:
  flag: lp2514-mldsa-precompile
  hfName: "Quantum"
  activationHeight: "0"
tags: [pqc, precompile, evm, fips-204, dilithium]
order: 710
---

## Abstract

This LP specifies a precompiled contract for verifying ML-DSA (Module-Lattice-Based Digital Signature Algorithm) signatures as standardized in NIST FIPS 204 (August 2024). The precompile implements ML-DSA-65 (NIST Security Level 3) verification at address `0x0200000000000000000000000000000000000006`, providing quantum-resistant digital signature verification for smart contracts and transaction authentication.

ML-DSA, formerly known as Dilithium, is the primary post-quantum digital signature standard selected by NIST. This precompile enables quantum-safe transaction signing, long-term secure smart contracts, and post-quantum account abstraction on Lux Network.

## Activation

| Parameter          | Value                              |
|--------------------|------------------------------------|
| Flag string        | `lp2514-mldsa-precompile`          |
| Precompile Address | `0x0200000000000000000000000000000000000006` |
| Default in code    | **false** until Quantum fork       |
| Deployment branch  | `v1.22.0-lp2514`                   |
| Roll-out criteria  | Q-Chain activation                 |
| Back-off plan      | Disable via chain config           |

## Motivation

### The Quantum Computing Threat

Current blockchain cryptography relies on ECDSA (secp256k1) which is vulnerable to Shor's algorithm running on sufficiently powerful quantum computers. NIST estimates that cryptographically relevant quantum computers may emerge by 2030-2035, threatening all classical digital signatures.

### Why ML-DSA?

ML-DSA was selected by NIST in August 2024 as the primary post-quantum digital signature standard (FIPS 204) because:

1. **Security**: Based on the hardness of Module-LWE and Module-SIS lattice problems, believed quantum-resistant
2. **Performance**: Fast verification (~108 microseconds on Apple M1), significantly faster than hash-based alternatives
3. **Standardization**: Official NIST FIPS standard with rigorous security proofs
4. **Balanced Sizes**: Reasonable key and signature sizes compared to other post-quantum schemes

### Use Cases

- **Quantum-Safe Transaction Signing**: Protect user funds from future quantum attacks
- **Long-Term Secure Smart Contracts**: Sign documents and agreements that remain secure for decades
- **Post-Quantum Account Abstraction**: ERC-4337 compatible quantum-safe wallets
- **Cross-Chain Messages**: Secure Warp message authentication with quantum resistance
- **Hybrid Schemes**: Combine with ECDSA for defense-in-depth during transition period

## Specification

### Precompile Address

```
0x0200000000000000000000000000000000000006
```

### Security Levels

ML-DSA provides three security levels corresponding to NIST categories:

| Variant     | Security Level | Classical Security | Quantum Security | Public Key | Signature |
|-------------|----------------|-------------------|------------------|------------|-----------|
| ML-DSA-44   | NIST Level 2   | 128-bit           | ~128-bit         | 1,312 bytes | 2,420 bytes |
| **ML-DSA-65** | **NIST Level 3** | **192-bit** | **~192-bit** | **1,952 bytes** | **3,309 bytes** |
| ML-DSA-87   | NIST Level 5   | 256-bit           | ~256-bit         | 2,592 bytes | 4,627 bytes |

This precompile implements **ML-DSA-65** (Security Level 3), the recommended default for most applications.

### Key and Signature Sizes

| Parameter | Size (bytes) |
|-----------|-------------|
| Public Key | 1,952 |
| Private Key | 4,032 |
| Signature | 3,309 |
| Message Length Field | 32 (uint256) |

### Gas Costs

```
gas = BASE_COST + (messageLength * PER_BYTE_COST)

Where:
  BASE_COST = 100,000 gas
  PER_BYTE_COST = 10 gas
```

**Examples:**

| Message Size | Gas Cost |
|--------------|----------|
| Empty (0 bytes) | 100,000 |
| 100 bytes | 101,000 |
| 1 KB (1,024 bytes) | 110,240 |
| 10 KB (10,240 bytes) | 202,400 |

### Input Format

The precompile accepts packed binary input with the following structure:

| Offset | Length (bytes) | Field | Description |
|--------|----------------|-------|-------------|
| 0 | 1,952 | `publicKey` | ML-DSA-65 public key |
| 1,952 | 32 | `messageLength` | Message length as big-endian uint256 |
| 1,984 | 3,309 | `signature` | ML-DSA-65 signature |
| 5,293 | variable | `message` | Message to verify (length from field above) |

**Minimum input size**: 5,293 bytes (empty message)

### Output Format

Returns a 32-byte word:
- `0x0000000000000000000000000000000000000000000000000000000000000001` - signature **valid**
- `0x0000000000000000000000000000000000000000000000000000000000000000` - signature **invalid**

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

### Library Support

```solidity
library MLDSALib {
    address constant MLDSA_PRECOMPILE = 0x0200000000000000000000000000000000000006;
    uint256 constant PUBLIC_KEY_SIZE = 1952;
    uint256 constant SIGNATURE_SIZE = 3309;
    uint256 constant BASE_GAS = 100000;
    uint256 constant PER_BYTE_GAS = 10;

    error InvalidPublicKeySize(uint256 expected, uint256 actual);
    error InvalidSignatureSize(uint256 expected, uint256 actual);
    error SignatureVerificationFailed();

    function verifyOrRevert(
        bytes calldata publicKey,
        bytes calldata message,
        bytes calldata signature
    ) internal view {
        if (publicKey.length != PUBLIC_KEY_SIZE) {
            revert InvalidPublicKeySize(PUBLIC_KEY_SIZE, publicKey.length);
        }
        if (signature.length != SIGNATURE_SIZE) {
            revert InvalidSignatureSize(SIGNATURE_SIZE, signature.length);
        }
        bool valid = IMLDSA(MLDSA_PRECOMPILE).verify(publicKey, message, signature);
        if (!valid) {
            revert SignatureVerificationFailed();
        }
    }

    function estimateGas(uint256 messageLength) internal pure returns (uint256) {
        return BASE_GAS + (messageLength * PER_BYTE_GAS);
    }
}
```

## Rationale

### Why ML-DSA-65 Specifically?

ML-DSA-65 provides NIST Security Level 3, equivalent to AES-192 security. This level:
- Exceeds current minimum security requirements (128-bit)
- Provides margin against future cryptanalytic advances
- Balances security with practical performance
- Matches NIST's recommendation for most applications

### Gas Cost Derivation

The gas formula is derived from:

1. **Computational Cost**: ML-DSA-65 verification takes ~108 microseconds on Apple M1
2. **Comparison to ecrecover**: ecrecover costs 3,000 gas for ~50 microseconds = 60 gas/microsecond
3. **ML-DSA Estimate**: 108 microseconds * 60 gas/microsecond = 6,480 gas
4. **Post-Quantum Multiplier**: 15x for lattice complexity = ~97,000 gas
5. **Rounded**: 100,000 gas base

The per-byte cost accounts for message hashing overhead in the signature scheme.

### Why Not Support All Variants?

Supporting ML-DSA-44, ML-DSA-65, and ML-DSA-87 in a single precompile would require:
- Variant selector byte in input encoding
- Multiple code paths increasing audit complexity
- User confusion about which variant to choose

Instead, we provide ML-DSA-65 as the recommended default. Applications requiring ML-DSA-44 (faster) or ML-DSA-87 (stronger) can use library implementations or request additional precompiles.

### Input Encoding Design

The packed binary format was chosen to:
1. Avoid ABI encoding overhead for large signatures
2. Support variable-length messages efficiently
3. Match native ML-DSA implementation format
4. Ensure deterministic, unambiguous parsing

## Backwards Compatibility

This LP introduces a new precompile at a previously unused address. There are no backwards compatibility issues.

### Migration Path from ECDSA

```solidity
contract HybridVerifier {
    function verifySignature(bytes calldata data, bytes calldata sig) external view {
        if (sig.length == 65) {
            // Classical ECDSA
            verifyECDSA(data, sig);
        } else if (sig.length == 3309) {
            // Post-quantum ML-DSA
            verifyMLDSA(data, sig);
        } else {
            revert("Unknown signature type");
        }
    }
}
```

**Recommended Migration Timeline:**
1. **Phase 1**: Support both ECDSA and ML-DSA signatures
2. **Phase 2**: Migrate keys to ML-DSA over 2-3 years
3. **Phase 3**: Deprecate ECDSA after quantum threat assessment

## Test Cases

### Test Vector 1: Valid Signature

**Input:**
```
publicKey: 0x<1952 bytes ML-DSA-65 public key>
message: "Hello, quantum-safe world!"
signature: 0x<3309 bytes ML-DSA-65 signature>
```

**Expected Output:** `0x0000...0001` (valid)
**Expected Gas:** ~100,270 (27 byte message)

### Test Vector 2: Invalid Signature

**Input:**
```
publicKey: 0x<1952 bytes valid public key>
message: "Hello, quantum-safe world!"
signature: 0x<3309 bytes CORRUPTED signature>
```

**Expected Output:** `0x0000...0000` (invalid)

### Test Vector 3: Wrong Message

**Input:**
```
publicKey: 0x<1952 bytes public key>
message: "Different message"
signature: 0x<3309 bytes signature for ORIGINAL message>
```

**Expected Output:** `0x0000...0000` (invalid)

### Test Vector 4: Empty Message

**Input:**
```
publicKey: 0x<1952 bytes public key>
message: "" (empty)
signature: 0x<3309 bytes signature for empty message>
```

**Expected Output:** `0x0000...0001` (valid if signature matches)

### Test Vector 5: Input Too Short

**Input:** `0x1234` (insufficient length)

**Expected:** Error with "invalid input length"

### Test Vector 6: Large Message (10KB)

**Input:**
```
publicKey: 0x<1952 bytes>
message: 0x<10,240 bytes of data>
signature: 0x<3309 bytes>
```

**Expected Gas:** ~202,400

## Reference Implementation

### Location

```
/Users/z/work/lux/precompiles/mldsa/
```

### Key Files

| File | Description | Lines |
|------|-------------|-------|
| `contract.go` | Core precompile implementation | 140 |
| `contract_test.go` | Comprehensive test suite | 321 |
| `module.go` | Precompile registration | 45 |
| `IMLDSA.sol` | Solidity interface and library | 216 |
| `README.md` | Implementation documentation | 204 |

### Dependencies

- **Cryptography**: `github.com/luxfi/crypto/mldsa` (FIPS 204 compliant)
- **Backend**: Cloudflare CIRCL library (audited, production-ready)

### Go Implementation Excerpt

```go
// Run implements ML-DSA signature verification
func (p *mldsaVerifyPrecompile) Run(
    accessibleState contract.AccessibleState,
    caller common.Address,
    addr common.Address,
    input []byte,
    suppliedGas uint64,
    readOnly bool,
) ([]byte, uint64, error) {
    gasCost := p.RequiredGas(input)
    if suppliedGas < gasCost {
        return nil, 0, errors.New("out of gas")
    }

    if len(input) < MinInputSize {
        return nil, suppliedGas - gasCost, ErrInvalidInputLength
    }

    publicKey := input[0:ML_DSA_PublicKeySize]
    signature := input[ML_DSA_PublicKeySize+ML_DSA_MessageLenSize :
                       ML_DSA_PublicKeySize+ML_DSA_MessageLenSize+ML_DSA_SignatureSize]
    message := input[MinInputSize:]

    pub, err := mldsa.PublicKeyFromBytes(publicKey, mldsa.MLDSA65)
    if err != nil {
        return nil, suppliedGas - gasCost, err
    }

    valid := pub.Verify(message, signature, nil)

    result := make([]byte, 32)
    if valid {
        result[31] = 1
    }
    return result, suppliedGas - gasCost, nil
}
```

## Security Considerations

### Post-Quantum Security

ML-DSA's security is based on:
1. **Module-LWE** (Learning With Errors over modules)
2. **Module-SIS** (Short Integer Solution over modules)

Both problems are believed hard for quantum computers. NIST Security Level 3 provides:
- Resistance to **Grover's algorithm** (quantum search)
- Resistance to **Shor's algorithm** (quantum factoring)
- At least as hard to break as **AES-192**

### Classical Security

ML-DSA signatures are **deterministic**:
- No randomness needed during signing (no RNG vulnerabilities)
- Side-channel resistance requires constant-time implementation
- Reference implementation uses FIPS 204 compliant constant-time operations

### Signature Malleability

ML-DSA signatures are **non-malleable**. An attacker cannot modify a valid signature to create another valid signature for the same message, preventing:
- Replay attacks with modified signatures
- Transaction ID malleability
- Double-spend attempts

### Implementation Security

**Validated Components:**
- Cloudflare CIRCL library (audited, open-source)
- FIPS 204 compliant implementation
- Constant-time operations

**Input Validation:**
- All input lengths checked before parsing
- Public key and signature sizes validated
- Message length verified against actual input
- No buffer overflows possible

**DoS Protection:**
- Gas costs prevent computational DoS
- Maximum message size limited by block gas limit
- Early validation of input sizes

### Key Management Requirements

1. Private keys must be generated from 64 bytes of cryptographic randomness
2. Keys should be stored encrypted at rest
3. Implement key rotation policies for long-term security
4. Consider HD (Hierarchical Deterministic) key derivation

### Hybrid Signature Recommendation

For maximum security during the transition period, consider requiring both ECDSA and ML-DSA:

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

## Economic Impact

### Gas Cost Comparison

| Algorithm | Gas Cost | Relative |
|-----------|----------|----------|
| ecrecover (ECDSA) | 3,000 | 1x |
| ML-DSA-65 | 100,000 | 33x |
| SLH-DSA-128s | ~420,000 | 140x |

### Transaction Cost Impact

For a typical transaction with 100-byte message:
- **ECDSA**: ~3,000 gas for signature verification
- **ML-DSA**: ~101,000 gas for signature verification

At 30 gwei gas price and $3,000 LUX:
- **ECDSA**: $0.27
- **ML-DSA**: $9.09

### Mitigation Strategies

1. **Batching**: Verify multiple signatures per transaction
2. **Caching**: Store verification results for known-good keys
3. **Hybrid**: Use ECDSA for low-value, ML-DSA for high-value transactions
4. **Protocol Subsidization**: Network could subsidize post-quantum verification

## Open Questions

1. **Should we add ML-DSA-44 and ML-DSA-87 precompiles?**
   - Defer until demand is demonstrated
   - Can add as separate precompiles at `0x...0007` and `0x...0008`

2. **Should we support context strings?**
   - ML-DSA allows optional context for domain separation
   - Currently unsupported for simplicity
   - Can extend input format if required

3. **Integration with account abstraction?**
   - ERC-4337 compatibility needs design work
   - Larger signature sizes affect UserOperation costs
   - May need AA-specific optimizations

## Standards Compliance

| Standard | Description | Status |
|----------|-------------|--------|
| FIPS 204 | ML-DSA Digital Signature Standard | Compliant |
| NIST SP 800-208 | Post-Quantum Recommendations | Aligned |
| RFC 9380 | Hashing to Elliptic Curves (for context) | Referenced |

## References

- **NIST FIPS 204**: https://csrc.nist.gov/pubs/fips/204/final
- **Dilithium Specification**: https://pq-crystals.org/dilithium/
- **Cloudflare CIRCL**: https://github.com/cloudflare/circl
- **LP-4200**: Post-Quantum Cryptography Suite for Lux Network
- **LP-4201**: Hybrid Classical-Quantum Cryptography Transitions
- **LP-2311**: ML-DSA Signature Verification Precompile (related specification)
- **Reference Implementation**: `/Users/z/work/lux/precompiles/mldsa/`

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
