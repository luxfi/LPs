---
lp: 6470
title: LuxDA TFHE Sidecar Format
description: LuxDA TFHE Sidecar Format specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
requires: [5702, 5340]
tags: [luxda-bus, tfhe, threshold-crypto, fhe]
---

## Abstract

This LP defines the TFHE (Threshold Fully Homomorphic Encryption) sidecar format for LuxDA Bus messages. TFHE sidecars enable encrypted computation and conditional reveal of data across namespaces.

## Motivation

Private coordination requires:

1. **Encrypted State**: Data encrypted under threshold FHE
2. **Homomorphic Operations**: Compute on encrypted data
3. **Conditional Reveal**: Decrypt when conditions met
4. **Epoch-Based Keys**: Key rotation without data loss

## Specification

### 1. Sidecar Structure

#### 1.1 TFHE Sidecar

```go
type TFHESidecar struct {
    // Version
    Version uint8

    // Epoch for key binding
    Epoch uint64

    // Ciphertext type
    CiphertextType TFHECiphertextType

    // Encrypted data
    Ciphertext []byte

    // Binding to header
    HeaderBinding []byte

    // Proof of valid encryption (optional)
    Proof []byte
}

type TFHECiphertextType uint8
const (
    TFHEBool     TFHECiphertextType = 1
    TFHEUint4    TFHECiphertextType = 2
    TFHEUint8    TFHECiphertextType = 3
    TFHEUint16   TFHECiphertextType = 4
    TFHEUint32   TFHECiphertextType = 5
    TFHEUint64   TFHECiphertextType = 6
    TFHEUint128  TFHECiphertextType = 7
    TFHEUint160  TFHECiphertextType = 8  // Ethereum address
    TFHEUint256  TFHECiphertextType = 9  // EVM word
    TFHEBytes    TFHECiphertextType = 10 // Variable length
)
```

#### 1.2 Sidecar Reference in Header

From LP-6411, headers can reference TFHE sidecars:

```go
type TFHESidecarRef struct {
    SidecarCommitment [32]byte  // SHA3-256 of sidecar
    Epoch             uint64
}
```

### 2. Encryption

#### 2.1 Encrypt with Namespace Key

```go
func EncryptTFHE(plaintext []byte, nsId [20]byte, epoch uint64, ctype TFHECiphertextType) (*TFHESidecar, error) {
    // Get namespace public key for epoch
    pk, err := keyRegistry.GetPublicKey(nsId, epoch)
    if err != nil {
        return nil, err
    }

    // Encrypt based on type
    var ciphertext []byte
    switch ctype {
    case TFHEBool:
        ciphertext = tfhe.EncryptBool(pk, plaintext[0] != 0)
    case TFHEUint8:
        ciphertext = tfhe.EncryptUint8(pk, plaintext[0])
    case TFHEUint32:
        val := binary.BigEndian.Uint32(plaintext)
        ciphertext = tfhe.EncryptUint32(pk, val)
    case TFHEUint64:
        val := binary.BigEndian.Uint64(plaintext)
        ciphertext = tfhe.EncryptUint64(pk, val)
    case TFHEUint256:
        ciphertext = tfhe.EncryptUint256(pk, plaintext)
    case TFHEBytes:
        ciphertext = tfhe.EncryptBytes(pk, plaintext)
    default:
        return nil, ErrUnsupportedType
    }

    return &TFHESidecar{
        Version:        1,
        Epoch:          epoch,
        CiphertextType: ctype,
        Ciphertext:     ciphertext,
    }, nil
}
```

#### 2.2 Header Binding

Bind sidecar to header to prevent mix-and-match:

```go
func (s *TFHESidecar) BindToHeader(header *MsgHeader) {
    s.HeaderBinding = sha3.Sum256(
        header.NamespaceId[:],
        uint64ToBytes(header.Seq),
        header.BlobCommitment[:],
        uint64ToBytes(s.Epoch),
    )
}

func (s *TFHESidecar) VerifyBinding(header *MsgHeader) bool {
    expected := sha3.Sum256(
        header.NamespaceId[:],
        uint64ToBytes(header.Seq),
        header.BlobCommitment[:],
        uint64ToBytes(s.Epoch),
    )
    return bytes.Equal(s.HeaderBinding, expected[:])
}
```

### 3. Wire Format

#### 3.1 Sidecar Encoding

```
TFHESidecarV1 := {
    version:         uint8    [1 byte]
    epoch:           uint64   [8 bytes]
    ciphertextType:  uint8    [1 byte]
    ciphertextLen:   uint32   [4 bytes]
    ciphertext:      bytes    [ciphertextLen bytes]
    headerBinding:   bytes32  [32 bytes]
    proofLen:        uint16   [2 bytes]
    proof:           bytes    [proofLen bytes]
}
```

#### 3.2 Ciphertext Size

| Type | Ciphertext Size |
|------|-----------------|
| TFHEBool | ~32 KiB |
| TFHEUint8 | ~64 KiB |
| TFHEUint32 | ~256 KiB |
| TFHEUint64 | ~512 KiB |
| TFHEUint256 | ~2 MiB |

### 4. Compact Encoding

#### 4.1 Batched Ciphertexts

For efficiency, batch multiple values:

```go
type TFHEBatch struct {
    Version    uint8
    Epoch      uint64
    Types      []TFHECiphertextType
    Ciphertexts [][]byte
    BatchProof []byte  // Single proof for all
}

func BatchEncrypt(values [][]byte, types []TFHECiphertextType, pk *PublicKey) (*TFHEBatch, error) {
    ciphertexts := make([][]byte, len(values))
    for i, val := range values {
        ct, _ := EncryptSingle(val, types[i], pk)
        ciphertexts[i] = ct
    }

    return &TFHEBatch{
        Types:       types,
        Ciphertexts: ciphertexts,
    }, nil
}
```

### 5. Validation

#### 5.1 Sidecar Validation

```go
func ValidateSidecar(sidecar *TFHESidecar, header *MsgHeader, keyRegistry *KeyRegistry) error {
    // Check version
    if sidecar.Version != 1 {
        return ErrUnsupportedVersion
    }

    // Check epoch is valid
    currentEpoch := keyRegistry.CurrentEpoch(header.NamespaceId)
    if sidecar.Epoch > currentEpoch {
        return ErrFutureEpoch
    }
    if currentEpoch - sidecar.Epoch > MaxEpochAge {
        return ErrExpiredEpoch
    }

    // Verify header binding
    if !sidecar.VerifyBinding(header) {
        return ErrBindingMismatch
    }

    // Verify ciphertext structure
    if err := tfhe.ValidateCiphertext(sidecar.Ciphertext, sidecar.CiphertextType); err != nil {
        return err
    }

    // Verify proof (if present)
    if len(sidecar.Proof) > 0 {
        if err := tfhe.VerifyEncryptionProof(sidecar.Proof, sidecar.Ciphertext); err != nil {
            return err
        }
    }

    return nil
}
```

## Rationale

### Why Epoch-Based Keys?

- Enable key rotation
- Limit blast radius of compromise
- Support committee changes

### Why Header Binding?

- Prevent replay attacks
- Prevent ciphertext substitution
- Ensure context integrity

### Why Type System?

- Different operations for different types
- Optimize ciphertext size
- Enable type-safe computation

## Backwards Compatibility

This specification introduces new functionality and does not modify existing protocols. It is fully backwards compatible with existing implementations.

## Security Considerations

### Malleability

TFHE ciphertexts are malleable (by design for homomorphic ops).
Header binding prevents unauthorized modification.

### Side Channels

Ciphertext size reveals type information.
Batching can help hide individual values.

### Key Compromise

Epoch-based keys limit exposure.
Forward secrecy via epoch rotation.

## Test Plan

### Unit Tests

1. **Encrypt/Decrypt**: Round-trip for all types
2. **Binding**: Verify binding checks
3. **Validation**: Reject invalid sidecars

### Integration Tests

1. **With Header**: Sidecar referenced in header
2. **With Operations**: Homomorphic computation
3. **Epoch Transition**: Key rotation

## References

- [TFHE Library](https://github.com/zama-ai/tfhe-rs)
- [fhEVM](https://docs.zama.ai/fhevm)
- [Threshold FHE](https://eprint.iacr.org/2022/164)

---

*LP-6470 v1.0.0 - 2026-01-02*
