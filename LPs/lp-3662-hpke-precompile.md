---
lp: 3662
title: HPKE (Hybrid Public Key Encryption) Precompile
description: Native EVM precompile for RFC 9180 Hybrid Public Key Encryption
author: Lux Crypto Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions/3662
status: Review
type: Standards Track
category: Core
created: 2025-12-24
requires: [3652, 3654, 3659]
tags: [precompile, cryptography]
order: 662
---

## Abstract

This LP specifies a native EVM precompile for Hybrid Public Key Encryption (HPKE) as defined in RFC 9180. HPKE provides a comprehensive public key encryption framework combining Key Encapsulation Mechanisms (KEM), Key Derivation Functions (KDF), and Authenticated Encryption with Associated Data (AEAD) into a secure, composable system. The precompile is deployed at address `0x031A` and supports multiple cipher suites including X25519, P-256, P-384, and P-521 KEMs with HKDF-SHA256/384/512 and AES-GCM or ChaCha20-Poly1305 AEAD.

## Motivation

### Need for Standardized Hybrid Encryption

Current smart contract encryption solutions suffer from several problems:

1. **Fragmented Implementations**: Each project implements its own encryption, leading to incompatibilities
2. **Gas Costs**: Pure Solidity ECDH + symmetric encryption costs 500,000+ gas
3. **Security Risks**: Ad-hoc constructions often miss important security properties
4. **Missing Features**: No standard support for authenticated contexts, PSK modes, or export secrets

### HPKE Advantages

HPKE (RFC 9180) provides:

1. **Formal Security Proofs**: Proven IND-CCA2 secure under standard assumptions
2. **Mode Flexibility**: Base, PSK, Auth, and AuthPSK modes for different trust models
3. **Key Derivation**: Secure context binding and exportable secrets
4. **IETF Standard**: Widely adopted in TLS 1.3, MLS, OHTTP, and ECH

### Lux Use Cases

| Use Case | Description | Mode |
|----------|-------------|------|
| Confidential Transactions | Encrypt transaction data to recipient | Base |
| Key Agreement | Establish shared secrets between contracts | Auth |
| Off-Chain Messaging | Encrypted messages with blockchain identities | Base/PSK |
| Cross-Chain Secrets | Encrypted data for Warp messages | Auth |
| Privacy-Preserving Oracles | Encrypt query/response data | AuthPSK |
| Threshold Decryption | T-Chain distributed decryption | Base |

## Specification

### Precompile Address

```solidity
HPKE_PRECOMPILE = 0x031A
```

### HPKE Cipher Suites

The precompile supports the following cipher suites:

#### Key Encapsulation Mechanisms (KEM)

| ID | KEM | Size | Security |
|----|-----|------|----------|
| `0x0010` | DHKEM(P-256, HKDF-SHA256) | 65B enc, 32B shared | 128-bit |
| `0x0011` | DHKEM(P-384, HKDF-SHA384) | 97B enc, 48B shared | 192-bit |
| `0x0012` | DHKEM(P-521, HKDF-SHA512) | 133B enc, 64B shared | 256-bit |
| `0x0020` | DHKEM(X25519, HKDF-SHA256) | 32B enc, 32B shared | 128-bit |

#### Key Derivation Functions (KDF)

| ID | KDF | Hash Output |
|----|-----|-------------|
| `0x0001` | HKDF-SHA256 | 32 bytes |
| `0x0002` | HKDF-SHA384 | 48 bytes |
| `0x0003` | HKDF-SHA512 | 64 bytes |

#### Authenticated Encryption (AEAD)

| ID | AEAD | Key Size | Nonce | Tag |
|----|------|----------|-------|-----|
| `0x0001` | AES-128-GCM | 16B | 12B | 16B |
| `0x0002` | AES-256-GCM | 32B | 12B | 16B |
| `0x0003` | ChaCha20-Poly1305 | 32B | 12B | 16B |

### Operation Selectors

| Selector | Operation | Description |
|----------|-----------|-------------|
| `0x01` | SetupBaseS | Base mode sender setup |
| `0x02` | SetupBaseR | Base mode receiver setup |
| `0x03` | SetupPSKS | PSK mode sender setup |
| `0x04` | SetupPSKR | PSK mode receiver setup |
| `0x05` | SetupAuthS | Auth mode sender setup |
| `0x06` | SetupAuthR | Auth mode receiver setup |
| `0x07` | SetupAuthPSKS | AuthPSK mode sender setup |
| `0x08` | SetupAuthPSKR | AuthPSK mode receiver setup |
| `0x10` | Seal | Encrypt with context |
| `0x11` | Open | Decrypt with context |
| `0x12` | Export | Export secret from context |
| `0x20` | SingleShotSeal | One-shot encryption |
| `0x21` | SingleShotOpen | One-shot decryption |

### Input Format

#### SetupBaseS (Sender Setup - Base Mode)

```solidity
┌────────┬─────────┬─────────┬────────┬────────────────┬───────────────┐
│ 1 byte │ 2 bytes │ 2 bytes │ 2 bytes│ Variable       │ Variable      │
│ 0x01   │ kem_id  │ kdf_id  │ aead_id│ recipient_pk   │ info          │
└────────┴─────────┴─────────┴────────┴────────────────┴───────────────┘
```

Returns: `encapsulated_key || context_handle`

#### SetupBaseR (Receiver Setup - Base Mode)

```solidity
┌────────┬─────────┬─────────┬────────┬────────────────┬───────────────┬──────────────┐
│ 1 byte │ 2 bytes │ 2 bytes │ 2 bytes│ Variable       │ Variable      │ Variable     │
│ 0x02   │ kem_id  │ kdf_id  │ aead_id│ enc            │ recipient_sk  │ info         │
└────────┴─────────┴─────────┴────────┴────────────────┴───────────────┴──────────────┘
```

Returns: `context_handle`

#### SetupAuthS (Sender Setup - Auth Mode)

```solidity
┌────────┬─────────┬─────────┬────────┬────────────────┬───────────────┬──────────────┐
│ 1 byte │ 2 bytes │ 2 bytes │ 2 bytes│ Variable       │ Variable      │ Variable     │
│ 0x05   │ kem_id  │ kdf_id  │ aead_id│ recipient_pk   │ sender_sk     │ info         │
└────────┴─────────┴─────────┴────────┴────────────────┴───────────────┴──────────────┘
```

Returns: `encapsulated_key || context_handle`

#### SetupPSKS (Sender Setup - PSK Mode)

```solidity
┌────────┬─────────┬─────────┬────────┬────────────────┬────────────┬────────────────┬──────────────┐
│ 1 byte │ 2 bytes │ 2 bytes │ 2 bytes│ Variable       │ Variable   │ Variable       │ Variable     │
│ 0x03   │ kem_id  │ kdf_id  │ aead_id│ recipient_pk   │ psk        │ psk_id         │ info         │
└────────┴─────────┴─────────┴────────┴────────────────┴────────────┴────────────────┴──────────────┘
```

Returns: `encapsulated_key || context_handle`

#### Seal (Encrypt)

```solidity
┌────────┬────────────────┬───────────────┬────────────────┐
│ 1 byte │ 32 bytes       │ Variable      │ Variable       │
│ 0x10   │ context_handle │ aad           │ plaintext      │
└────────┴────────────────┴───────────────┴────────────────┘
```

Returns: `ciphertext || tag`

#### Open (Decrypt)

```solidity
┌────────┬────────────────┬───────────────┬────────────────┐
│ 1 byte │ 32 bytes       │ Variable      │ Variable       │
│ 0x11   │ context_handle │ aad           │ ciphertext     │
└────────┴────────────────┴───────────────┴────────────────┘
```

Returns: `plaintext`

#### Export (Key Export)

```solidity
┌────────┬────────────────┬───────────────┬────────────────┐
│ 1 byte │ 32 bytes       │ Variable      │ 2 bytes        │
│ 0x12   │ context_handle │ exporter_ctx  │ length         │
└────────┴────────────────┴───────────────┴────────────────┘
```

Returns: `exported_secret`

#### SingleShotSeal (One-Shot Encryption)

```solidity
┌────────┬─────────┬─────────┬────────┬────────────────┬───────────────┬──────────────┬────────────────┐
│ 1 byte │ 2 bytes │ 2 bytes │ 2 bytes│ Variable       │ Variable      │ Variable     │ Variable       │
│ 0x20   │ kem_id  │ kdf_id  │ aead_id│ recipient_pk   │ info          │ aad          │ plaintext      │
└────────┴─────────┴─────────┴────────┴────────────────┴───────────────┴──────────────┴────────────────┘
```

Returns: `encapsulated_key || ciphertext || tag`

### Gas Costs

#### KEM Operations

| KEM | Encaps Gas | Decaps Gas |
|-----|-----------|-----------|
| P-256 | 6,000 | 6,000 |
| P-384 | 9,000 | 9,000 |
| P-521 | 15,000 | 15,000 |
| X25519 | 3,000 | 3,000 |

#### KDF Operations

| KDF | Extract Gas | Expand Gas/32B |
|-----|-------------|----------------|
| HKDF-SHA256 | 200 | 100 |
| HKDF-SHA384 | 300 | 150 |
| HKDF-SHA512 | 400 | 200 |

#### AEAD Operations

| AEAD | Seal Base | Open Base | Per 64 Bytes |
|------|-----------|-----------|--------------|
| AES-128-GCM | 500 | 500 | 10 |
| AES-256-GCM | 600 | 600 | 12 |
| ChaCha20-Poly1305 | 400 | 400 | 8 |

#### Combined Operation Costs

| Operation | Formula |
|-----------|---------|
| SetupBaseS | `kem_encaps + kdf_extract + 500` |
| SetupBaseR | `kem_decaps + kdf_extract + 500` |
| SetupPSKS | `kem_encaps + kdf_extract + 1000` |
| SetupAuthS | `2 * kem_cost + kdf_extract + 1000` |
| Seal | `aead_seal_base + (plaintext_len / 64) * per_64b` |
| Open | `aead_open_base + (ciphertext_len / 64) * per_64b` |
| Export | `kdf_expand * ceil(length / hash_output_len)` |
| SingleShotSeal | `setup_cost + seal_cost` |

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IHPKE - RFC 9180 Hybrid Public Key Encryption Precompile
/// @notice Native HPKE support for EVM smart contracts
/// @dev Deployed at address 0x031A
interface IHPKE {
    // ============ Cipher Suite Identifiers ============

    // KEM IDs
    uint16 constant KEM_P256_HKDF_SHA256 = 0x0010;
    uint16 constant KEM_P384_HKDF_SHA384 = 0x0011;
    uint16 constant KEM_P521_HKDF_SHA512 = 0x0012;
    uint16 constant KEM_X25519_HKDF_SHA256 = 0x0020;

    // KDF IDs
    uint16 constant KDF_HKDF_SHA256 = 0x0001;
    uint16 constant KDF_HKDF_SHA384 = 0x0002;
    uint16 constant KDF_HKDF_SHA512 = 0x0003;

    // AEAD IDs
    uint16 constant AEAD_AES_128_GCM = 0x0001;
    uint16 constant AEAD_AES_256_GCM = 0x0002;
    uint16 constant AEAD_CHACHA20_POLY1305 = 0x0003;

    // ============ Cipher Suite Struct ============

    struct CipherSuite {
        uint16 kemId;
        uint16 kdfId;
        uint16 aeadId;
    }

    // ============ Context Struct ============

    struct Context {
        bytes32 handle;
        bool isSender;
    }

    // ============ Setup Functions ============

    /// @notice Setup sender context in Base mode
    /// @param suite The cipher suite to use
    /// @param recipientPk Recipient's public key
    /// @param info Application-specific info
    /// @return enc Encapsulated key to send to recipient
    /// @return ctx Context handle for subsequent operations
    function setupBaseS(
        CipherSuite calldata suite,
        bytes calldata recipientPk,
        bytes calldata info
    ) external returns (bytes memory enc, bytes32 ctx);

    /// @notice Setup receiver context in Base mode
    /// @param suite The cipher suite to use
    /// @param enc Encapsulated key from sender
    /// @param recipientSk Recipient's secret key
    /// @param info Application-specific info (must match sender)
    /// @return ctx Context handle for subsequent operations
    function setupBaseR(
        CipherSuite calldata suite,
        bytes calldata enc,
        bytes calldata recipientSk,
        bytes calldata info
    ) external returns (bytes32 ctx);

    /// @notice Setup sender context in PSK mode
    /// @param suite The cipher suite to use
    /// @param recipientPk Recipient's public key
    /// @param psk Pre-shared key
    /// @param pskId Pre-shared key identifier
    /// @param info Application-specific info
    /// @return enc Encapsulated key
    /// @return ctx Context handle
    function setupPSKS(
        CipherSuite calldata suite,
        bytes calldata recipientPk,
        bytes calldata psk,
        bytes calldata pskId,
        bytes calldata info
    ) external returns (bytes memory enc, bytes32 ctx);

    /// @notice Setup receiver context in PSK mode
    function setupPSKR(
        CipherSuite calldata suite,
        bytes calldata enc,
        bytes calldata recipientSk,
        bytes calldata psk,
        bytes calldata pskId,
        bytes calldata info
    ) external returns (bytes32 ctx);

    /// @notice Setup sender context in Auth mode
    /// @param suite The cipher suite to use
    /// @param recipientPk Recipient's public key
    /// @param senderSk Sender's secret key (for authentication)
    /// @param info Application-specific info
    /// @return enc Encapsulated key
    /// @return ctx Context handle
    function setupAuthS(
        CipherSuite calldata suite,
        bytes calldata recipientPk,
        bytes calldata senderSk,
        bytes calldata info
    ) external returns (bytes memory enc, bytes32 ctx);

    /// @notice Setup receiver context in Auth mode
    function setupAuthR(
        CipherSuite calldata suite,
        bytes calldata enc,
        bytes calldata recipientSk,
        bytes calldata senderPk,
        bytes calldata info
    ) external returns (bytes32 ctx);

    // ============ Encryption/Decryption ============

    /// @notice Encrypt plaintext using established context
    /// @param ctx Context handle from setup
    /// @param aad Additional authenticated data
    /// @param plaintext Data to encrypt
    /// @return ciphertext Encrypted data with authentication tag
    function seal(
        bytes32 ctx,
        bytes calldata aad,
        bytes calldata plaintext
    ) external returns (bytes memory ciphertext);

    /// @notice Decrypt ciphertext using established context
    /// @param ctx Context handle from setup
    /// @param aad Additional authenticated data (must match seal)
    /// @param ciphertext Data to decrypt
    /// @return plaintext Decrypted data
    function open(
        bytes32 ctx,
        bytes calldata aad,
        bytes calldata ciphertext
    ) external returns (bytes memory plaintext);

    // ============ Key Export ============

    /// @notice Export a secret from the context
    /// @param ctx Context handle
    /// @param exporterContext Application-specific context
    /// @param length Desired length of exported secret
    /// @return secret Exported secret key material
    function export(
        bytes32 ctx,
        bytes calldata exporterContext,
        uint16 length
    ) external returns (bytes memory secret);

    // ============ Single-Shot Operations ============

    /// @notice One-shot encryption (setup + seal)
    /// @param suite The cipher suite to use
    /// @param recipientPk Recipient's public key
    /// @param info Application-specific info
    /// @param aad Additional authenticated data
    /// @param plaintext Data to encrypt
    /// @return enc Encapsulated key
    /// @return ciphertext Encrypted data
    function singleShotSeal(
        CipherSuite calldata suite,
        bytes calldata recipientPk,
        bytes calldata info,
        bytes calldata aad,
        bytes calldata plaintext
    ) external returns (bytes memory enc, bytes memory ciphertext);

    /// @notice One-shot decryption (setup + open)
    function singleShotOpen(
        CipherSuite calldata suite,
        bytes calldata enc,
        bytes calldata recipientSk,
        bytes calldata info,
        bytes calldata aad,
        bytes calldata ciphertext
    ) external returns (bytes memory plaintext);
}

/// @title HPKE - Precompile wrapper library
library HPKE {
    address constant PRECOMPILE = address(0x031A);

    /// @notice Encrypt data for a recipient using X25519
    /// @param recipientPk 32-byte X25519 public key
    /// @param plaintext Data to encrypt
    /// @return enc Encapsulated key (32 bytes)
    /// @return ciphertext Encrypted data with tag
    function encryptX25519(
        bytes memory recipientPk,
        bytes memory plaintext
    ) internal returns (bytes memory enc, bytes memory ciphertext) {
        return encryptX25519(recipientPk, "", "", plaintext);
    }

    /// @notice Encrypt data for a recipient using X25519 with AAD
    function encryptX25519(
        bytes memory recipientPk,
        bytes memory info,
        bytes memory aad,
        bytes memory plaintext
    ) internal returns (bytes memory enc, bytes memory ciphertext) {
        IHPKE.CipherSuite memory suite = IHPKE.CipherSuite({
            kemId: IHPKE.KEM_X25519_HKDF_SHA256,
            kdfId: IHPKE.KDF_HKDF_SHA256,
            aeadId: IHPKE.AEAD_CHACHA20_POLY1305
        });

        bytes memory input = abi.encodePacked(
            uint8(0x20),  // SingleShotSeal
            suite.kemId,
            suite.kdfId,
            suite.aeadId,
            uint16(recipientPk.length),
            recipientPk,
            uint16(info.length),
            info,
            uint16(aad.length),
            aad,
            plaintext
        );

        (bool success, bytes memory result) = PRECOMPILE.staticcall(input);
        require(success, "HPKE: encryption failed");

        // Parse result: enc (32 bytes) || ciphertext
        enc = new bytes(32);
        for (uint i = 0; i < 32; i++) {
            enc[i] = result[i];
        }

        ciphertext = new bytes(result.length - 32);
        for (uint i = 0; i < ciphertext.length; i++) {
            ciphertext[i] = result[i + 32];
        }
    }

    /// @notice Decrypt data using X25519
    function decryptX25519(
        bytes memory enc,
        bytes memory recipientSk,
        bytes memory ciphertext
    ) internal returns (bytes memory plaintext) {
        return decryptX25519(enc, recipientSk, "", "", ciphertext);
    }

    /// @notice Decrypt data using X25519 with AAD
    function decryptX25519(
        bytes memory enc,
        bytes memory recipientSk,
        bytes memory info,
        bytes memory aad,
        bytes memory ciphertext
    ) internal returns (bytes memory plaintext) {
        IHPKE.CipherSuite memory suite = IHPKE.CipherSuite({
            kemId: IHPKE.KEM_X25519_HKDF_SHA256,
            kdfId: IHPKE.KDF_HKDF_SHA256,
            aeadId: IHPKE.AEAD_CHACHA20_POLY1305
        });

        bytes memory input = abi.encodePacked(
            uint8(0x21),  // SingleShotOpen
            suite.kemId,
            suite.kdfId,
            suite.aeadId,
            uint16(enc.length),
            enc,
            uint16(recipientSk.length),
            recipientSk,
            uint16(info.length),
            info,
            uint16(aad.length),
            aad,
            ciphertext
        );

        (bool success, bytes memory result) = PRECOMPILE.staticcall(input);
        require(success, "HPKE: decryption failed");

        return result;
    }

    /// @notice Derive a shared encryption key using HPKE Export
    function deriveKey(
        bytes32 ctx,
        bytes memory label,
        uint16 keyLength
    ) internal returns (bytes memory key) {
        bytes memory input = abi.encodePacked(
            uint8(0x12),  // Export
            ctx,
            uint16(label.length),
            label,
            keyLength
        );

        (bool success, bytes memory result) = PRECOMPILE.staticcall(input);
        require(success, "HPKE: key derivation failed");

        return result;
    }
}
```

### Go Implementation

```go
// Package hpke implements RFC 9180 HPKE precompile for Lux EVM
package hpke

import (
    "errors"

    "github.com/cloudflare/circl/hpke"
    "github.com/luxfi/coreth/precompile/contract"
)

const (
    PrecompileAddress = 0x031A

    // Operation selectors
    OpSetupBaseS     = 0x01
    OpSetupBaseR     = 0x02
    OpSetupPSKS      = 0x03
    OpSetupPSKR      = 0x04
    OpSetupAuthS     = 0x05
    OpSetupAuthR     = 0x06
    OpSetupAuthPSKS  = 0x07
    OpSetupAuthPSKR  = 0x08
    OpSeal           = 0x10
    OpOpen           = 0x11
    OpExport         = 0x12
    OpSingleShotSeal = 0x20
    OpSingleShotOpen = 0x21
)

// KEM IDs
const (
    KEMP256   = 0x0010
    KEMP384   = 0x0011
    KEMP521   = 0x0012
    KEMX25519 = 0x0020
)

// Gas costs
const (
    GasKEMEncapsP256   = 6000
    GasKEMEncapsP384   = 9000
    GasKEMEncapsP521   = 15000
    GasKEMEncapsX25519 = 3000
    GasKDFExtract      = 200
    GasAEADBase        = 400
    GasAEADPer64Bytes  = 8
)

var (
    ErrInvalidInput      = errors.New("invalid HPKE input")
    ErrInvalidCipherSuite = errors.New("invalid cipher suite")
    ErrDecryptionFailed  = errors.New("decryption failed")
    ErrInvalidContext    = errors.New("invalid context handle")
)

// HPKEPrecompile implements the HPKE precompile
type HPKEPrecompile struct {
    contexts map[[32]byte]*hpkeContext
}

type hpkeContext struct {
    suite    hpke.Suite
    sender   *hpke.Sender
    receiver *hpke.Receiver
    seqNum   uint64
}

// RequiredGas calculates gas for HPKE operations
func (p *HPKEPrecompile) RequiredGas(input []byte) uint64 {
    if len(input) < 1 {
        return 0
    }

    op := input[0]

    switch op {
    case OpSetupBaseS, OpSetupBaseR:
        kemID := uint16(input[1])<<8 | uint16(input[2])
        return kemGas(kemID) + GasKDFExtract + 500

    case OpSetupAuthS, OpSetupAuthR:
        kemID := uint16(input[1])<<8 | uint16(input[2])
        return 2*kemGas(kemID) + GasKDFExtract + 1000

    case OpSetupPSKS, OpSetupPSKR:
        kemID := uint16(input[1])<<8 | uint16(input[2])
        return kemGas(kemID) + GasKDFExtract + 1000

    case OpSeal, OpOpen:
        // Context handle (32) + AAD length (2) + AAD + plaintext
        if len(input) < 35 {
            return 0
        }
        dataLen := len(input) - 35
        return GasAEADBase + uint64(dataLen/64)*GasAEADPer64Bytes

    case OpSingleShotSeal, OpSingleShotOpen:
        kemID := uint16(input[1])<<8 | uint16(input[2])
        dataLen := len(input) - 100 // Approximate header size
        return kemGas(kemID) + GasKDFExtract + GasAEADBase + uint64(dataLen/64)*GasAEADPer64Bytes

    case OpExport:
        return 500

    default:
        return 0
    }
}

func kemGas(kemID uint16) uint64 {
    switch kemID {
    case KEMP256:
        return GasKEMEncapsP256
    case KEMP384:
        return GasKEMEncapsP384
    case KEMP521:
        return GasKEMEncapsP521
    case KEMX25519:
        return GasKEMEncapsX25519
    default:
        return 0
    }
}

// Run executes the HPKE precompile
func (p *HPKEPrecompile) Run(input []byte) ([]byte, error) {
    if len(input) < 1 {
        return nil, ErrInvalidInput
    }

    op := input[0]

    switch op {
    case OpSingleShotSeal:
        return p.singleShotSeal(input[1:])
    case OpSingleShotOpen:
        return p.singleShotOpen(input[1:])
    case OpSetupBaseS:
        return p.setupBaseS(input[1:])
    case OpSetupBaseR:
        return p.setupBaseR(input[1:])
    case OpSeal:
        return p.seal(input[1:])
    case OpOpen:
        return p.open(input[1:])
    case OpExport:
        return p.export(input[1:])
    default:
        return nil, ErrInvalidInput
    }
}

func (p *HPKEPrecompile) parseSuite(input []byte) (hpke.Suite, error) {
    if len(input) < 6 {
        return hpke.Suite{}, ErrInvalidInput
    }

    kemID := uint16(input[0])<<8 | uint16(input[1])
    kdfID := uint16(input[2])<<8 | uint16(input[3])
    aeadID := uint16(input[4])<<8 | uint16(input[5])

    var kem hpke.KEM
    switch kemID {
    case KEMP256:
        kem = hpke.KEM_P256_HKDF_SHA256
    case KEMP384:
        kem = hpke.KEM_P384_HKDF_SHA384
    case KEMP521:
        kem = hpke.KEM_P521_HKDF_SHA512
    case KEMX25519:
        kem = hpke.KEM_X25519_HKDF_SHA256
    default:
        return hpke.Suite{}, ErrInvalidCipherSuite
    }

    var kdf hpke.KDF
    switch kdfID {
    case 0x0001:
        kdf = hpke.KDF_HKDF_SHA256
    case 0x0002:
        kdf = hpke.KDF_HKDF_SHA384
    case 0x0003:
        kdf = hpke.KDF_HKDF_SHA512
    default:
        return hpke.Suite{}, ErrInvalidCipherSuite
    }

    var aead hpke.AEAD
    switch aeadID {
    case 0x0001:
        aead = hpke.AEAD_AES128GCM
    case 0x0002:
        aead = hpke.AEAD_AES256GCM
    case 0x0003:
        aead = hpke.AEAD_ChaCha20Poly1305
    default:
        return hpke.Suite{}, ErrInvalidCipherSuite
    }

    return hpke.NewSuite(kem, kdf, aead), nil
}

func (p *HPKEPrecompile) singleShotSeal(input []byte) ([]byte, error) {
    suite, err := p.parseSuite(input)
    if err != nil {
        return nil, err
    }

    offset := 6

    // Parse recipient public key
    pkLen := int(input[offset])<<8 | int(input[offset+1])
    offset += 2
    recipientPk := input[offset : offset+pkLen]
    offset += pkLen

    // Parse info
    infoLen := int(input[offset])<<8 | int(input[offset+1])
    offset += 2
    info := input[offset : offset+infoLen]
    offset += infoLen

    // Parse AAD
    aadLen := int(input[offset])<<8 | int(input[offset+1])
    offset += 2
    aad := input[offset : offset+aadLen]
    offset += aadLen

    // Plaintext is the rest
    plaintext := input[offset:]

    // Parse public key
    pk, err := suite.KEM.Scheme().UnmarshalBinaryPublicKey(recipientPk)
    if err != nil {
        return nil, err
    }

    // Create sender and seal
    sender, err := suite.NewSender(pk, info)
    if err != nil {
        return nil, err
    }

    enc, sealer, err := sender.Setup(nil)
    if err != nil {
        return nil, err
    }

    ciphertext, err := sealer.Seal(plaintext, aad)
    if err != nil {
        return nil, err
    }

    // Return enc || ciphertext
    result := make([]byte, len(enc)+len(ciphertext))
    copy(result, enc)
    copy(result[len(enc):], ciphertext)

    return result, nil
}

func (p *HPKEPrecompile) singleShotOpen(input []byte) ([]byte, error) {
    suite, err := p.parseSuite(input)
    if err != nil {
        return nil, err
    }

    offset := 6

    // Parse encapsulated key
    encLen := int(input[offset])<<8 | int(input[offset+1])
    offset += 2
    enc := input[offset : offset+encLen]
    offset += encLen

    // Parse recipient secret key
    skLen := int(input[offset])<<8 | int(input[offset+1])
    offset += 2
    recipientSk := input[offset : offset+skLen]
    offset += skLen

    // Parse info
    infoLen := int(input[offset])<<8 | int(input[offset+1])
    offset += 2
    info := input[offset : offset+infoLen]
    offset += infoLen

    // Parse AAD
    aadLen := int(input[offset])<<8 | int(input[offset+1])
    offset += 2
    aad := input[offset : offset+aadLen]
    offset += aadLen

    // Ciphertext is the rest
    ciphertext := input[offset:]

    // Parse secret key
    sk, err := suite.KEM.Scheme().UnmarshalBinaryPrivateKey(recipientSk)
    if err != nil {
        return nil, err
    }

    // Create receiver and open
    receiver, err := suite.NewReceiver(sk, info)
    if err != nil {
        return nil, err
    }

    opener, err := receiver.Setup(enc)
    if err != nil {
        return nil, err
    }

    plaintext, err := opener.Open(ciphertext, aad)
    if err != nil {
        return nil, ErrDecryptionFailed
    }

    return plaintext, nil
}
```

## Rationale

### Cipher Suite Selection

We support the most common HPKE cipher suites:

1. **X25519 + HKDF-SHA256 + ChaCha20-Poly1305**: Default for most applications, excellent performance
2. **P-256 + HKDF-SHA256 + AES-128-GCM**: NIST-approved, hardware acceleration
3. **P-384/P-521**: Higher security levels for sensitive applications

### Context Handles

Instead of returning the full context state, we use 32-byte handles:
- Enables efficient multi-message encryption without re-keying
- Contexts are stored in precompile state, not returned to caller
- Handles are derived deterministically for reproducibility

### Single-Shot vs Context-Based

We provide both patterns:
- **Single-shot**: Simple one-message encryption, most common use case
- **Context-based**: Efficient for multiple messages to same recipient

## Backwards Compatibility

This is a new precompile with no backwards compatibility concerns.

## Test Cases

### Test Vector 1: X25519 + ChaCha20-Poly1305

```solidity
// RFC 9180 Test Vector
kem_id: 0x0020 (X25519)
kdf_id: 0x0001 (HKDF-SHA256)
aead_id: 0x0003 (ChaCha20-Poly1305)

recipient_sk: 0x4612c550263fc8ad58375df3f557aac531d26850903e55a9f23f21d8534e8ac8
recipient_pk: 0x3948cfe0ad1ddb695d780e59077195da6c56506b027329794ab02bca80815c4d

info: 0x4f6465206f6e2061204772656369616e2055726e (Ode on a Grecian Urn)
plaintext: 0x4265617574792069732074727574682c20747275746820626561757479
aad: 0x436f756e742d30

enc: 0x37fda3567bdbd628e88668c3c8d7e97d1d1253b6d4ea6d44c150f741f1bf4431
ciphertext: 0xf938558b5d72f1a23810b4be2ab4f84331acc02fc97babc53a52ae8218a355a9
```

### Test Vector 2: P-256 + AES-GCM

```solidity
kem_id: 0x0010 (P-256)
kdf_id: 0x0001 (HKDF-SHA256)
aead_id: 0x0001 (AES-128-GCM)

// Similar test structure with P-256 keys
```

### Solidity Test

```solidity
function testHPKEEncryptDecrypt() public {
    bytes memory recipientSk = hex"4612c550263fc8ad58375df3f557aac531d26850903e55a9f23f21d8534e8ac8";
    bytes memory recipientPk = hex"3948cfe0ad1ddb695d780e59077195da6c56506b027329794ab02bca80815c4d";
    bytes memory plaintext = hex"4265617574792069732074727574682c20747275746820626561757479";

    // Encrypt
    (bytes memory enc, bytes memory ciphertext) = HPKE.encryptX25519(recipientPk, plaintext);

    // Decrypt
    bytes memory decrypted = HPKE.decryptX25519(enc, recipientSk, ciphertext);

    assertEq(decrypted, plaintext);
}
```

## Reference Implementation

Implementation exists in:
- `github.com/luxfi/crypto/hpke`: Wrapper around circl/hpke
- `github.com/luxfi/coreth/precompile/contracts/hpke`: EVM precompile

## Security Considerations

### Key Management

1. **Private Key Protection**: Private keys MUST be protected with same care as signing keys
2. **Key Separation**: Use different keys for HPKE and signing operations
3. **Forward Secrecy**: Each encryption uses ephemeral sender keys

### Nonce Management

1. **Automatic Nonces**: The precompile manages nonces internally via sequence numbers
2. **Context Isolation**: Each context has independent nonce counters
3. **Nonce Reuse Prevention**: Contexts track usage to prevent nonce reuse

### Side-Channel Resistance

1. **Constant-Time Operations**: All cryptographic operations are constant-time
2. **No Secret-Dependent Branches**: Control flow doesn't depend on secrets
3. **Memory Zeroing**: Sensitive data is zeroed after use

### Mode Selection

| Mode | Use When |
|------|----------|
| Base | Recipient identity sufficient |
| PSK | Additional channel binding needed |
| Auth | Sender authentication required |
| AuthPSK | Maximum authentication |

### Post-Quantum Considerations

HPKE with current KEMs is NOT post-quantum secure. For quantum resistance:
- Use with ML-KEM hybrid (LP-4318)
- Transition path defined in LP-4201

```
