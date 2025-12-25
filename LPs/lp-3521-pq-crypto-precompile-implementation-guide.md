---
lp: 3521
title: Post-Quantum Cryptography Precompile Implementation Guide
description: Comprehensive implementation reference for all NIST FIPS 203-205 post-quantum cryptography precompiles
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-24
updated: 2025-12-24
requires: 4200, 3500
activation:
  flag: lp3520-pqcrypto-precompiles
  hfName: "Quantum"
  activationHeight: "0"
tags: [pqc, precompile, evm, fips-203, fips-204, fips-205, mldsa, mlkem, slhdsa]
order: 720
---

## Abstract

This LP provides the definitive implementation reference for all post-quantum cryptography (PQC) precompiles on Lux Network. It documents precompile addresses, gas costs for all algorithm modes, input/output formats, mode byte encodings, and implementation locations across all repositories (geth, evm, precompiles).

## Motivation

Post-quantum cryptography is essential for Lux Network's long-term security. As quantum computers advance, traditional elliptic curve cryptography (ECC) will become vulnerable. This LP provides:

1. **Migration Path**: Clear specification for developers transitioning from ECC to PQC
2. **Gas Cost Transparency**: Predictable costs for smart contract budgeting
3. **Implementation Clarity**: Exact addresses, mode bytes, and I/O formats for integration
4. **Test Coverage Visibility**: Documented test cases with pass/fail status

## Specification

This specification defines the interface and behavior for PQC precompiles:

1. **Precompile Addresses**: Three dedicated addresses for ML-DSA, SLH-DSA, and unified PQC operations
2. **Mode Bytes**: Algorithm/variant identification (0x00-0x87 range)
3. **Gas Costs**: Fixed per-operation costs based on computational complexity
4. **Input/Output Format**: Binary encoding for efficient EVM processing
5. **Function Selectors**: Four-byte selectors for the unified precompile

## Backwards Compatibility

PQC precompiles are additive additions that do not affect existing EVM functionality:

- **New Addresses**: `0x0200000000000000000000000000000000000006` (ML-DSA), `0x0200000000000000000000000000000000000007` (SLH-DSA), `0x0200000000000000000000000000000000000010` (Unified) - outside existing range
- **No Behavioral Changes**: Existing precompiles remain unchanged
- **Opt-in Migration**: Contracts must explicitly call PQC precompiles
- **Gas Model**: Separate gas calculation from standard EVM operations

## Precompile Addresses

| Precompile | Address | Description |
|------------|---------|-------------|
| **ML-DSA Verify** | `0x0200000000000000000000000000000000000006` | Dedicated ML-DSA signature verification |
| **SLH-DSA Verify** | `0x0200000000000000000000000000000000000007` | Dedicated SLH-DSA signature verification |
| **PQCrypto Unified** | `0x0200000000000000000000000000000000000010` | Unified PQ crypto operations |

## Gas Costs Reference

### ML-DSA Signature Verification (FIPS 204)

| Mode | Security Level | Mode Byte | Gas Cost | Public Key | Signature |
|------|---------------|-----------|----------|------------|-----------|
| ML-DSA-44 | NIST Level 2 (128-bit) | `0x44` | **75,000** | 1,312 bytes | 2,420 bytes |
| ML-DSA-65 | NIST Level 3 (192-bit) | `0x65` | **100,000** | 1,952 bytes | 3,309 bytes |
| ML-DSA-87 | NIST Level 5 (256-bit) | `0x87` | **150,000** | 2,592 bytes | 4,627 bytes |

**Gas Formula:**
```solidity
gas = BASE_COST[mode]
```

### ML-KEM Key Encapsulation (FIPS 203)

#### Encapsulation

| Mode | Security Level | Mode Byte | Gas Cost | Public Key | Ciphertext | Shared Secret |
|------|---------------|-----------|----------|------------|------------|---------------|
| ML-KEM-512 | NIST Level 1 (128-bit) | `0x00` | **6,000** | 800 bytes | 768 bytes | 32 bytes |
| ML-KEM-768 | NIST Level 3 (192-bit) | `0x01` | **8,000** | 1,184 bytes | 1,088 bytes | 32 bytes |
| ML-KEM-1024 | NIST Level 5 (256-bit) | `0x02` | **10,000** | 1,568 bytes | 1,568 bytes | 32 bytes |

#### Decapsulation

| Mode | Security Level | Mode Byte | Gas Cost | Private Key |
|------|---------------|-----------|----------|-------------|
| ML-KEM-512 | NIST Level 1 (128-bit) | `0x00` | **6,000** | 1,632 bytes |
| ML-KEM-768 | NIST Level 3 (192-bit) | `0x01` | **8,000** | 2,400 bytes |
| ML-KEM-1024 | NIST Level 5 (256-bit) | `0x02` | **10,000** | 3,168 bytes |

### SLH-DSA Signature Verification (FIPS 205)

| Mode | Hash Function | Security | Mode Byte | Gas Cost | Public Key | Signature |
|------|---------------|----------|-----------|----------|------------|-----------|
| SLH-DSA-SHA2-128s | SHA-256 | Level 1 | `0x00` | **50,000** | 32 bytes | 7,856 bytes |
| SLH-DSA-SHA2-128f | SHA-256 | Level 1 | `0x01` | **75,000** | 32 bytes | 17,088 bytes |
| SLH-DSA-SHA2-192s | SHA-256 | Level 3 | `0x02` | **100,000** | 48 bytes | 16,224 bytes |
| SLH-DSA-SHA2-192f | SHA-256 | Level 3 | `0x03` | **150,000** | 48 bytes | 35,664 bytes |
| SLH-DSA-SHA2-256s | SHA-256 | Level 5 | `0x04` | **175,000** | 64 bytes | 29,792 bytes |
| SLH-DSA-SHA2-256f | SHA-256 | Level 5 | `0x05` | **250,000** | 64 bytes | 49,856 bytes |
| SLH-DSA-SHAKE-128s | SHAKE256 | Level 1 | `0x10` | **50,000** | 32 bytes | 7,856 bytes |
| SLH-DSA-SHAKE-128f | SHAKE256 | Level 1 | `0x11` | **75,000** | 32 bytes | 17,088 bytes |
| SLH-DSA-SHAKE-192s | SHAKE256 | Level 3 | `0x12` | **100,000** | 48 bytes | 16,224 bytes |
| SLH-DSA-SHAKE-192f | SHAKE256 | Level 3 | `0x13` | **150,000** | 48 bytes | 35,664 bytes |
| SLH-DSA-SHAKE-256s | SHAKE256 | Level 5 | `0x14` | **175,000** | 64 bytes | 29,792 bytes |
| SLH-DSA-SHAKE-256f | SHAKE256 | Level 5 | `0x15` | **250,000** | 64 bytes | 49,856 bytes |

## Gas Cost Summary Table

```solidity
╔════════════════════════════════════════════════════════════════════════════╗
║                    POST-QUANTUM CRYPTOGRAPHY GAS COSTS                     ║
╠════════════════════════════════════════════════════════════════════════════╣
║ ALGORITHM      │ MODE/VARIANT           │ MODE BYTE │ GAS COST            ║
╠════════════════════════════════════════════════════════════════════════════╣
║ ML-DSA         │ ML-DSA-44 (Level 2)    │   0x44    │      75,000         ║
║                │ ML-DSA-65 (Level 3)    │   0x65    │     100,000         ║
║                │ ML-DSA-87 (Level 5)    │   0x87    │     150,000         ║
╠════════════════════════════════════════════════════════════════════════════╣
║ ML-KEM Encap   │ ML-KEM-512 (Level 1)   │   0x00    │       6,000         ║
║                │ ML-KEM-768 (Level 3)   │   0x01    │       8,000         ║
║                │ ML-KEM-1024 (Level 5)  │   0x02    │      10,000         ║
╠════════════════════════════════════════════════════════════════════════════╣
║ ML-KEM Decap   │ ML-KEM-512 (Level 1)   │   0x00    │       6,000         ║
║                │ ML-KEM-768 (Level 3)   │   0x01    │       8,000         ║
║                │ ML-KEM-1024 (Level 5)  │   0x02    │      10,000         ║
╠════════════════════════════════════════════════════════════════════════════╣
║ SLH-DSA        │ SHA2/SHAKE-128s        │ 0x00/0x10 │      50,000         ║
║                │ SHA2/SHAKE-128f        │ 0x01/0x11 │      75,000         ║
║                │ SHA2/SHAKE-192s        │ 0x02/0x12 │     100,000         ║
║                │ SHA2/SHAKE-192f        │ 0x03/0x13 │     150,000         ║
║                │ SHA2/SHAKE-256s        │ 0x04/0x14 │     175,000         ║
║                │ SHA2/SHAKE-256f        │ 0x05/0x15 │     250,000         ║
╚════════════════════════════════════════════════════════════════════════════╝
```

## Mode Byte Encoding

### ML-DSA Mode Bytes

```go
const (
    ModeMLDSA44 uint8 = 0x44  // Maps to mldsa.MLDSA44
    ModeMLDSA65 uint8 = 0x65  // Maps to mldsa.MLDSA65
    ModeMLDSA87 uint8 = 0x87  // Maps to mldsa.MLDSA87
)
```solidity

**Important**: The precompile mode bytes (`0x44`, `0x65`, `0x87`) differ from the library's internal mode values (`0`, `1`, `2`). The precompile implementation converts between these formats.

### ML-KEM Mode Bytes

```go
const (
    MLKEMMode512  uint8 = 0x00  // Maps to mlkem.MLKEM512
    MLKEMMode768  uint8 = 0x01  // Maps to mlkem.MLKEM768
    MLKEMMode1024 uint8 = 0x02  // Maps to mlkem.MLKEM1024
)
```

### SLH-DSA Mode Bytes

```go
const (
    // SHA-256 variants
    SLHDSAModeSHA2_128s  uint8 = 0x00
    SLHDSAModeSHA2_128f  uint8 = 0x01
    SLHDSAModeSHA2_192s  uint8 = 0x02
    SLHDSAModeSHA2_192f  uint8 = 0x03
    SLHDSAModeSHA2_256s  uint8 = 0x04
    SLHDSAModeSHA2_256f  uint8 = 0x05

    // SHAKE-256 variants
    SLHDSAModeSHAKE_128s uint8 = 0x10
    SLHDSAModeSHAKE_128f uint8 = 0x11
    SLHDSAModeSHAKE_192s uint8 = 0x12
    SLHDSAModeSHAKE_192f uint8 = 0x13
    SLHDSAModeSHAKE_256s uint8 = 0x14
    SLHDSAModeSHAKE_256f uint8 = 0x15
)
```solidity

## Input Formats

### ML-DSA Verify (Dedicated Precompile)

```
Offset  Length   Field         Description
─────────────────────────────────────────────────────────────
0       1        mode          Mode byte (0x44, 0x65, 0x87)
1       var      publicKey     Public key (1312/1952/2592 bytes)
1+pk    32       messageLen    Message length as big-endian uint256
1+pk+32 var      signature     Signature (2420/3309/4627 bytes)
min     var      message       Message to verify
```solidity

### PQCrypto Unified Precompile

**Function Selector** (first 4 bytes):
| Selector | Operation |
|----------|-----------|
| `"mlds"` | ML-DSA Verify |
| `"encp"` | ML-KEM Encapsulate |
| `"decp"` | ML-KEM Decapsulate |
| `"slhs"` | SLH-DSA Verify |

**ML-DSA Verify (via PQCrypto):**
```sql
Offset  Length   Field         Description
─────────────────────────────────────────────────────────────
0       4        selector      "mlds" (0x6d6c6473)
4       1        mode          Mode byte (0x44, 0x65, 0x87)
5       2        pubKeyLen     Public key length (big-endian)
7       var      publicKey     Public key bytes
7+pk    2        messageLen    Message length (big-endian)
9+pk    var      message       Message bytes
9+pk+m  var      signature     Remaining bytes are signature
```

**ML-KEM Encapsulate:**
```sql
Offset  Length   Field         Description
─────────────────────────────────────────────────────────────
0       4        selector      "encp" (0x656e6370)
4       1        mode          Mode byte (0x00, 0x01, 0x02)
5       var      publicKey     Public key (800/1184/1568 bytes)
```sql

**ML-KEM Decapsulate:**
```sql
Offset  Length   Field         Description
─────────────────────────────────────────────────────────────
0       4        selector      "decp" (0x64656370)
4       1        mode          Mode byte (0x00, 0x01, 0x02)
5       2        privKeyLen    Private key length (big-endian)
7       var      privateKey    Private key bytes
7+sk    var      ciphertext    Remaining bytes are ciphertext
```

**SLH-DSA Verify:**
```sql
Offset  Length   Field         Description
─────────────────────────────────────────────────────────────
0       4        selector      "slhs" (0x736c6873)
4       1        mode          Mode byte (0x00-0x15)
5       2        pubKeyLen     Public key length (big-endian)
7       var      publicKey     Public key bytes (32/48/64)
7+pk    2        messageLen    Message length (big-endian)
9+pk    var      message       Message bytes
9+pk+m  var      signature     Remaining bytes are signature
```solidity

## Output Formats

### Verification Results (ML-DSA, SLH-DSA)

Returns a 32-byte word:
- `0x0000...0001` - Signature **valid**
- `0x0000...0000` - Signature **invalid**

### ML-KEM Encapsulate Output

Returns concatenated `ciphertext || sharedSecret`:
- Ciphertext: 768/1088/1568 bytes (mode-dependent)
- Shared Secret: 32 bytes

### ML-KEM Decapsulate Output

Returns:
- Shared Secret: 32 bytes

## Implementation Locations

### Core Cryptography Library

```
github.com/luxfi/crypto/
├── mldsa/
│   ├── mldsa.go          # ML-DSA implementation
│   ├── mldsa_test.go     # Tests
│   └── keygen.go         # Key generation
├── mlkem/
│   ├── mlkem.go          # ML-KEM implementation
│   ├── mlkem_test.go     # Tests
│   └── kem.go            # KEM operations
└── slhdsa/
    ├── slhdsa.go         # SLH-DSA implementation
    ├── slhdsa_test.go    # Tests
    └── params.go         # Algorithm parameters
```solidity

### EVM Precompile Implementation

```
github.com/luxfi/evm/precompile/contracts/
├── mldsa/
│   ├── contract.go       # ML-DSA precompile (dedicated)
│   ├── contract_test.go  # 334 lines of tests
│   └── module.go         # Registration
└── pqcrypto/
    ├── contract.go       # Unified PQ precompile
    ├── contract_test.go  # 234 lines of tests
    ├── module.go         # Registration
    └── config.go         # Configuration
```solidity

### Geth Integration

```
github.com/luxfi/geth/core/vm/
├── contracts.go          # Precompile registry
└── pq_contracts.go       # PQ crypto precompile bindings
```solidity

## Solidity Interface

### ML-DSA Verify

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMLDSA {
    function verify(
        bytes calldata publicKey,
        bytes calldata message,
        bytes calldata signature
    ) external view returns (bool valid);
}

library MLDSALib {
    address constant MLDSA_PRECOMPILE = 0x0200000000000000000000000000000000000006;

    uint8 constant MODE_MLDSA_44 = 0x44;
    uint8 constant MODE_MLDSA_65 = 0x65;
    uint8 constant MODE_MLDSA_87 = 0x87;

    uint256 constant MLDSA44_GAS = 75000;
    uint256 constant MLDSA65_GAS = 100000;
    uint256 constant MLDSA87_GAS = 150000;

    function verify65(
        bytes calldata publicKey,
        bytes calldata message,
        bytes calldata signature
    ) internal view returns (bool) {
        bytes memory input = abi.encodePacked(
            MODE_MLDSA_65,
            publicKey,
            uint256(message.length),
            signature,
            message
        );
        (bool success, bytes memory result) = MLDSA_PRECOMPILE.staticcall{gas: MLDSA65_GAS}(input);
        return success && result.length == 32 && result[31] == 0x01;
    }
}
```

### PQCrypto Unified

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPQCrypto {
    function mldsaVerify(
        uint8 mode,
        bytes calldata publicKey,
        bytes calldata message,
        bytes calldata signature
    ) external view returns (bool valid);

    function mlkemEncapsulate(
        uint8 mode,
        bytes calldata publicKey
    ) external view returns (bytes memory ciphertext, bytes32 sharedSecret);

    function mlkemDecapsulate(
        uint8 mode,
        bytes calldata privateKey,
        bytes calldata ciphertext
    ) external view returns (bytes32 sharedSecret);

    function slhdsaVerify(
        uint8 mode,
        bytes calldata publicKey,
        bytes calldata message,
        bytes calldata signature
    ) external view returns (bool valid);
}

library PQCryptoLib {
    address constant PQCRYPTO_PRECOMPILE = 0x0200000000000000000000000000000000000010;

    // Function selectors
    bytes4 constant MLDSA_SELECTOR = 0x6d6c6473;   // "mlds"
    bytes4 constant ENCAP_SELECTOR = 0x656e6370;   // "encp"
    bytes4 constant DECAP_SELECTOR = 0x64656370;   // "decp"
    bytes4 constant SLHDSA_SELECTOR = 0x736c6873;  // "slhs"
}
```solidity

## Test Coverage

### ML-DSA Tests (contract_test.go)

| Test Name | Description | Status |
|-----------|-------------|--------|
| TestMLDSAVerify_ValidSignature | Valid ML-DSA-65 signature | ✅ PASS |
| TestMLDSAVerify_InvalidSignature | Corrupted signature | ✅ PASS |
| TestMLDSAVerify_WrongMessage | Signature for different message | ✅ PASS |
| TestMLDSAVerify_InputTooShort | Input validation | ✅ PASS |
| TestMLDSAVerify_EmptyMessage | Empty message signing | ✅ PASS |
| TestMLDSAVerify_LargeMessage | 10KB message | ✅ PASS |
| TestMLDSAVerify_GasCost | Per-mode gas calculation | ✅ PASS |
| TestMLDSAPrecompile_Address | Address verification | ✅ PASS |
| BenchmarkMLDSAVerify_SmallMessage | Performance benchmark | ✅ PASS |
| BenchmarkMLDSAVerify_LargeMessage | Large message benchmark | ✅ PASS |

### PQCrypto Tests (contract_test.go)

| Test Name | Description | Status |
|-----------|-------------|--------|
| TestPQCryptoPrecompile | Basic setup | ✅ PASS |
| TestMLDSAVerify | ML-DSA-44 verification | ✅ PASS |
| TestMLKEMEncapsulateDecapsulate | Full KEM round-trip | ✅ PASS |
| TestSLHDSAVerify | SLH-DSA-SHA2-128s verification | ✅ PASS |
| TestGasCalculation | All 15 per-mode gas costs | ✅ PASS |
| BenchmarkPQPrecompile/ML-DSA-Verify | ML-DSA performance | ✅ PASS |
| BenchmarkPQPrecompile/ML-KEM-Encapsulate | ML-KEM performance | ✅ PASS |

## Rationale

### ML-DSA Gas Derivation

Gas costs are based on computational complexity relative to `ecrecover`:

| Operation | Time (μs) | Relative to ecrecover | Gas |
|-----------|-----------|----------------------|-----|
| ecrecover | ~50 | 1x | 3,000 |
| ML-DSA-44 verify | ~70 | ~1.4x | 75,000 |
| ML-DSA-65 verify | ~108 | ~2.2x | 100,000 |
| ML-DSA-87 verify | ~180 | ~3.6x | 150,000 |

**Quantum Premium**: 25x multiplier applied to account for:
1. Lattice-based computation complexity
2. Large key/signature handling overhead
3. Future-proofing against algorithm optimizations

### ML-KEM Gas Derivation

Key encapsulation is computationally simpler than signatures:

| Operation | Time (μs) | Gas |
|-----------|-----------|-----|
| ML-KEM-512 encap/decap | ~20 | 6,000 |
| ML-KEM-768 encap/decap | ~25 | 8,000 |
| ML-KEM-1024 encap/decap | ~35 | 10,000 |

### SLH-DSA Gas Derivation

Hash-based signatures have wide variance between "small" and "fast" variants:

| Variant | Time (ms) | Gas |
|---------|-----------|-----|
| 128s (small sigs) | ~2 | 50,000 |
| 128f (fast verify) | ~3 | 75,000 |
| 192s | ~5 | 100,000 |
| 192f | ~8 | 150,000 |
| 256s | ~12 | 175,000 |
| 256f | ~20 | 250,000 |

## Security Considerations

### Algorithm Security Levels

| Algorithm | Variant | NIST Level | Classical | Quantum |
|-----------|---------|------------|-----------|---------|
| ML-DSA | 44 | Level 2 | 128-bit | ~128-bit |
| ML-DSA | 65 | Level 3 | 192-bit | ~192-bit |
| ML-DSA | 87 | Level 5 | 256-bit | ~256-bit |
| ML-KEM | 512 | Level 1 | 128-bit | ~128-bit |
| ML-KEM | 768 | Level 3 | 192-bit | ~192-bit |
| ML-KEM | 1024 | Level 5 | 256-bit | ~256-bit |
| SLH-DSA | 128s/f | Level 1 | 128-bit | ~128-bit |
| SLH-DSA | 192s/f | Level 3 | 192-bit | ~192-bit |
| SLH-DSA | 256s/f | Level 5 | 256-bit | ~256-bit |

### Implementation Security

1. **Constant-time operations**: All implementations use constant-time code paths
2. **Input validation**: All input lengths validated before processing
3. **No secret leakage**: No branching on secret values
4. **Audited library**: Uses Cloudflare CIRCL (audited implementation)

### Mode Byte Validation

Precompiles reject unknown mode bytes with clear error messages:
- ML-DSA: Only accepts `0x44`, `0x65`, `0x87`
- ML-KEM: Only accepts `0x00`, `0x01`, `0x02`
- SLH-DSA: Only accepts `0x00`-`0x05`, `0x10`-`0x15`

## Standards Compliance

| Standard | Description | Implementation |
|----------|-------------|----------------|
| FIPS 203 | ML-KEM | Full compliance |
| FIPS 204 | ML-DSA | Full compliance |
| FIPS 205 | SLH-DSA | Full compliance |
| NIST SP 800-208 | PQ Recommendations | Aligned |

## Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| LP-4200 | Post-Quantum Cryptography Suite | Parent specification |
| LP-3500 | ML-DSA Precompile | Dedicated ML-DSA spec |
| LP-4316 | ML-DSA Digital Signatures | Algorithm specification |
| LP-4317 | SLH-DSA Digital Signatures | Algorithm specification |
| LP-4318 | ML-KEM Key Encapsulation | Algorithm specification |

## References

- **NIST FIPS 203**: https://csrc.nist.gov/pubs/fips/203/final (ML-KEM)
- **NIST FIPS 204**: https://csrc.nist.gov/pubs/fips/204/final (ML-DSA)
- **NIST FIPS 205**: https://csrc.nist.gov/pubs/fips/205/final (SLH-DSA)
- **Cloudflare CIRCL**: https://github.com/cloudflare/circl
- **Lux Crypto Library**: https://github.com/luxfi/crypto

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
```
