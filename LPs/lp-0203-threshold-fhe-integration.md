---
lp: 203
title: Threshold FHE - Distributed Key Management
description: Threshold decryption for FHE with MPC integration and KMS support
author: Lux Network (@luxfi)
status: Final
type: Standards Track
category: Core
created: 2025-12-28
requires: 11, 200, 202, 7000
---

# LP-0203: Threshold FHE - Distributed Key Management

## Abstract

This LP specifies the threshold FHE (Fully Homomorphic Encryption) integration for Lux Network, enabling distributed key generation, threshold decryption, and secure key management. It integrates with T-Chain (LP-7000), MPC infrastructure, and enterprise KMS systems.

## Motivation

FHE requires a master secret key for:
1. **Key Generation**: Creating public keys for encryption
2. **Decryption**: Revealing computation results
3. **Re-encryption**: Transferring access between parties

Centralized key custody creates:
- Single point of failure
- Trust assumptions
- Regulatory concerns

Threshold FHE distributes the secret key across multiple parties:
- No single party can decrypt
- Threshold (t-of-n) required for decryption
- Proactive refresh prevents long-term compromise

## Specification

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    Threshold FHE Architecture                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   Party 1   │    │   Party 2   │    │   Party N   │        │
│   │   (share₁)  │    │   (share₂)  │    │   (shareₙ)  │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │                │
│          └──────────────────┼──────────────────┘                │
│                             │                                   │
│   ┌─────────────────────────▼─────────────────────────────────┐ │
│   │              Threshold Protocol Layer                      │ │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│   │  │  DKG        │  │  Threshold  │  │  Proactive  │       │ │
│   │  │  (Keygen)   │  │  Decrypt    │  │  Refresh    │       │ │
│   │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│   └───────────────────────────────────────────────────────────┘ │
│                             │                                   │
│   ┌─────────────────────────▼─────────────────────────────────┐ │
│   │              Integration Layer                             │ │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│   │  │  T-Chain    │  │  MPC        │  │  KMS        │       │ │
│   │  │  (LP-7000)  │  │  Nodes      │  │  (HSM)      │       │ │
│   │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│   └───────────────────────────────────────────────────────────┘ │
│                             │                                   │
│   ┌─────────────────────────▼─────────────────────────────────┐ │
│   │              Application Layer                             │ │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│   │  │  Z-Chain    │  │  fhEVM      │  │  Private    │       │ │
│   │  │  (LP-0202)  │  │  Contracts  │  │  AI         │       │ │
│   │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│   └───────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Key Types

```go
// FHE key hierarchy
type FHEKeySet struct {
    PublicKey     *tfhe.PublicKey     // Available to all
    BootstrapKey  *tfhe.BootstrapKey  // ~170MB, for homomorphic ops
    KeySwitchKey  *tfhe.KeySwitchKey  // For ciphertext conversion
    
    // Secret key is NEVER stored whole - only threshold shares
    SecretShares  []ThresholdShare    // Distributed across parties
}

type ThresholdShare struct {
    PartyID     uint32
    ShareData   []byte              // Encrypted share
    Commitment  []byte              // Feldman commitment
    Index       uint32              // Lagrange index
}
```

### Distributed Key Generation (DKG)

```solidity
interface IThresholdDKG {
    struct DKGParams {
        uint8 threshold;        // t in t-of-n
        uint8 numParties;       // n
        uint256 timeout;        // Max time for ceremony
        bytes32 randomness;     // Initial entropy
    }
    
    struct DKGRound1 {
        bytes commitment;       // Feldman commitment
        bytes publicShare;      // Encrypted share for each party
        bytes proof;            // ZK proof of correct sharing
    }
    
    struct DKGRound2 {
        bytes decryptedShares;  // Decrypted received shares
        bytes verification;     // Verification of received shares
    }
    
    // Initialize DKG ceremony
    function initializeDKG(DKGParams calldata params) 
        external returns (bytes32 ceremonyId);
    
    // Round 1: Submit commitments and shares
    function submitRound1(bytes32 ceremonyId, DKGRound1 calldata round1)
        external;
    
    // Round 2: Submit decrypted shares
    function submitRound2(bytes32 ceremonyId, DKGRound2 calldata round2)
        external;
    
    // Finalize and derive public key
    function finalizeDKG(bytes32 ceremonyId)
        external returns (bytes memory publicKey);
    
    // Events
    event DKGInitialized(bytes32 indexed ceremonyId, uint8 threshold, uint8 numParties);
    event DKGRound1Complete(bytes32 indexed ceremonyId);
    event DKGComplete(bytes32 indexed ceremonyId, bytes publicKey);
}
```

### Threshold Decryption

```solidity
interface IThresholdDecryption {
    struct DecryptionRequest {
        bytes32 requestId;
        bytes ciphertext;       // FHE ciphertext to decrypt
        address requester;
        uint256 deadline;
        bytes4 callback;        // Callback function selector
        uint256 callbackGas;
    }
    
    struct DecryptionShare {
        uint32 partyId;
        bytes share;            // Partial decryption
        bytes proof;            // ZK proof of correct share
    }
    
    // Request decryption
    function decrypt(
        bytes calldata ciphertext,
        bytes4 callback,
        uint256 deadline
    ) external payable returns (bytes32 requestId);
    
    // Submit decryption share
    function submitShare(
        bytes32 requestId,
        DecryptionShare calldata share
    ) external;
    
    // Anyone can finalize once threshold shares collected
    function finalize(bytes32 requestId) external;
    
    // Get request status
    function getRequest(bytes32 requestId) 
        external view returns (DecryptionRequest memory, uint8 sharesCollected);
    
    // Events
    event DecryptionRequested(bytes32 indexed requestId, address requester);
    event ShareSubmitted(bytes32 indexed requestId, uint32 partyId);
    event DecryptionComplete(bytes32 indexed requestId, bytes plaintext);
}
```

### Proactive Refresh

```solidity
interface IProactiveRefresh {
    // Initiate key refresh (requires threshold approval)
    function initiateRefresh() external returns (bytes32 refreshId);
    
    // Submit refresh shares
    function submitRefreshShare(
        bytes32 refreshId,
        bytes calldata newShare,
        bytes calldata proof
    ) external;
    
    // Finalize refresh
    function finalizeRefresh(bytes32 refreshId) external;
    
    // Get refresh schedule
    function getRefreshSchedule() external view returns (
        uint256 lastRefresh,
        uint256 nextRefresh,
        uint256 refreshInterval
    );
}
```

### MPC Integration

The threshold system integrates with Lux MPC nodes:

```go
// MPC node configuration
type MPCConfig struct {
    Nodes        []NodeConfig    // MPC cluster nodes
    Threshold    int             // t in t-of-n
    KeyType      KeyType         // ECDSA, EdDSA, FHE, etc.
    Protocol     Protocol        // FROST, CGGMP21, etc.
}

// FHE-specific MPC operations
type FHEMPCOperations interface {
    // Distributed key generation
    GenerateFHEKey(params tfhe.Parameters) (*ThresholdFHEKey, error)
    
    // Threshold decryption
    ThresholdDecrypt(ct *tfhe.Ciphertext, parties []int) (*DecryptionResult, error)
    
    // Re-encryption (for access transfer)
    ThresholdReencrypt(ct *tfhe.Ciphertext, newPK *tfhe.PublicKey) (*tfhe.Ciphertext, error)
    
    // Key rotation
    RotateKeys() (*ThresholdFHEKey, error)
}
```

### KMS Integration

Enterprise deployments can use hardware security modules:

```go
// KMS provider interface
type KMSProvider interface {
    // Store threshold share in HSM
    StoreShare(shareID string, share []byte) error
    
    // Retrieve share for decryption
    RetrieveShare(shareID string) ([]byte, error)
    
    // Sign with HSM-protected key
    Sign(data []byte) ([]byte, error)
    
    // Supported providers
    Type() KMSType // AWS, GCP, Azure, Hashicorp, Zymbit, YubiHSM
}

// AWS KMS integration
type AWSKMSProvider struct {
    client *kms.Client
    keyId  string
}

// Google Cloud KMS integration
type GCPKMSProvider struct {
    client *cloudkms.KeyManagementClient
    keyPath string
}

// Zymbit HSM (hardware) integration
type ZymbitProvider struct {
    device *zymbit.Device
    slot   int
}
```

### Precompile Interface

```solidity
// Precompile at 0x0710-0x0713
interface IThresholdPrecompile {
    // Request threshold operation
    function requestOperation(
        uint8 operationType,    // DECRYPT, SIGN, REENCRYPT
        bytes calldata input,
        bytes4 callback
    ) external returns (bytes32 requestId);
    
    // Check operation status
    function getStatus(bytes32 requestId) 
        external view returns (uint8 status, uint8 shares, bytes memory result);
}
```

### Gas Costs

| Operation | Gas | Notes |
|-----------|-----|-------|
| DKG Initialize | 500,000 | One-time setup |
| DKG Round 1 | 200,000 | Per party |
| DKG Round 2 | 150,000 | Per party |
| Decryption Request | 100,000 | Base cost |
| Submit Share | 50,000 | Per share |
| Finalize | 200,000 | Combine and callback |
| Proactive Refresh | 300,000 | Per party |

### Security Parameters

```go
type ThresholdParams struct {
    // Threshold configuration
    Threshold    int  // t in t-of-n (recommended: 5)
    NumParties   int  // n (recommended: 9)
    
    // Timing
    DecryptionTimeout   time.Duration  // 30 seconds
    RefreshInterval     time.Duration  // 7 days
    DKGTimeout          time.Duration  // 5 minutes
    
    // Cryptographic
    ShareSecurityBits   int  // 256
    CommitmentScheme    string  // "Feldman" or "Pedersen"
    ZKProofSystem       string  // "Schnorr" or "Bulletproofs"
}
```

## Rationale

### Why 5-of-9 Threshold?

- **5 shares required**: Majority prevents minority collusion
- **9 total parties**: Allows 4 failures/compromises
- **Geographic distribution**: Parties in different jurisdictions

### Why Proactive Refresh?

- Long-lived keys accumulate risk
- Refresh invalidates old shares
- Compromised shares become useless after refresh

### Why KMS Integration?

- Enterprise compliance requirements
- Hardware security for high-value keys
- Audit trails for regulatory compliance

## Security Considerations

### Collusion Attacks

If t parties collude:
- Can decrypt all ciphertexts
- Mitigated by: geographic distribution, reputation staking, legal agreements

### Denial of Service

If parties refuse to participate:
- Decryption impossible below threshold
- Mitigated by: backup parties, slashing conditions, timeout mechanisms

### Side Channels

Threshold operations may leak timing:
- Constant-time implementations
- Dummy traffic patterns
- Secure multi-party computation protocols

### Key Rotation

During rotation window:
- Both old and new keys valid
- Transition period minimized
- Automatic re-encryption of persistent data

## Backwards Compatibility

Threshold FHE is a new capability. Existing FHE contracts can opt-in by:
1. Registering with ThresholdDecryption contract
2. Requesting decryption via Gateway library
3. Receiving callbacks with decrypted values

## Reference Implementation

- Threshold Library: `github.com/luxfi/threshold`
- MPC Nodes: `github.com/luxfi/mpc`
- KMS Integration: `github.com/luxfi/kms`
- T-Chain: `github.com/luxfi/node/vms/tvm`

## Test Vectors

```go
// DKG ceremony
params := ThresholdParams{
    Threshold:  5,
    NumParties: 9,
}
key, _ := dkg.Generate(params)
assert(len(key.Shares) == 9)
assert(key.PublicKey != nil)

// Threshold decryption
ct := fhe.Encrypt(publicKey, 42)
shares := []DecryptionShare{}
for i := 0; i < 5; i++ {
    share, _ := parties[i].PartialDecrypt(ct)
    shares = append(shares, share)
}
plaintext, _ := Combine(shares)
assert(plaintext == 42)
```

## Dependencies

- LP-0200: fhEVM Architecture
- LP-0202: Z-Chain GPU Acceleration
- LP-7000: T-Chain Specification
- LP-7340: Threshold Cryptography Library

---

*Copyright 2025 Lux Industries Inc. All rights reserved.*
