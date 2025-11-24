---
lp: 204
title: secp256r1 Curve Integration
status: Final
type: Standards Track
category: Core
created: 2025-11-22
---

# LP-204: Precompile for secp256r1 Curve Support (Granite Upgrade)

| LP | 204 |
| :--- | :--- |
| **Title** | secp256r1 Elliptic Curve Precompile for Lux Network |
| **Author(s)** | Lux Protocol Team (Based on ACP-204 by Santiago Cammi, Arran Schlosberg) |
| **Status** | Adopted (Granite Upgrade) |
| **Track** | Standards |
| **Based On** | [ACP-204](https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/204-precompile-secp256r1), [RIP-7212](https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md), [EIP-7212](https://eips.ethereum.org/EIPS/eip-7212) |

## Abstract

LP-204 introduces native secp256r1 (P-256) signature verification as a precompiled contract on the Lux Network's C-Chain and compatible EVM chains. This enables enterprise-grade biometric authentication, WebAuthn, Passkeys, and device-based signing with 100x gas reduction compared to Solidity implementations.

## Lux Network Context

The Lux Network's focus on enterprise blockchain adoption and user experience makes secp256r1 support critical for:

1. **Enterprise Onboarding**: Leverage existing security infrastructure (HSMs, TPMs, biometric devices)
2. **Institutional Compliance**: Use approved cryptographic standards (NIST FIPS 186-3)
3. **Consumer UX**: Enable secure wallet access via Face ID, Touch ID, Windows Hello, Android Keystore
4. **Cross-Chain Identity**: Unified authentication across Lux's multi-chain ecosystem
5. **Quantum Transition**: Bridge to post-quantum signatures (LP-001, LP-002, LP-003)

## Motivation

### Current Limitations

**Solidity-Based Verification**:
- 200,000-330,000 gas per signature verification
- Economically prohibitive for consumer and enterprise applications
- Incompatible with modern device security standards

**User Experience Gap**:
- Seed phrase management alienates mainstream users
- Hardware wallet friction prevents mass adoption
- No integration with familiar biometric authentication

### Lux Network Advantages with secp256r1

**Enterprise Adoption**:
- Institutions use existing security infrastructure
- Compliance with NIST-approved cryptography
- Integration with enterprise identity management systems

**Consumer Accessibility**:
- Sign transactions with Face ID / Touch ID
- No seed phrases or private key management
- Familiar authentication flows from existing apps

**Economic Viability**:
- 100x gas reduction: 330k → 3,450 gas
- Enables micro-transactions and frequent signing
- Makes biometric wallets economically practical

## Specification

### Precompile Address

`0x0000000000000000000000000000000000000100`

Matches RIP-7212 for cross-ecosystem compatibility. Libraries developed for Ethereum can work unmodified on Lux Network.

### Function Interface

**Input**: 160 bytes
```
[32 bytes] message hash
[32 bytes] r (signature component)
[32 bytes] s (signature component)  
[32 bytes] x (public key coordinate)
[32 bytes] y (public key coordinate)
```

**Output**:
- **Success**: 32 bytes `0x0000000000000000000000000000000000000000000000000000000000000001`
- **Failure**: Empty (no data returned)

**Gas Cost**: 3,450 gas (based on EIP-7212 benchmarking)

### Validation Requirements

1. **Curve Parameters**: NIST P-256 (secp256r1)
2. **Public Key Validation**: Point must be on curve
3. **Signature Validation**: r, s within valid range [1, n-1]
4. **Compliance**: NIST FIPS 186-3 specification

### Reference Implementation

```solidity
// Example usage in Solidity
contract BiometricWallet {
    address constant P256_PRECOMPILE = 0x0000000000000000000000000000000000000100;
    
    struct PublicKey {
        bytes32 x;
        bytes32 y;
    }
    
    mapping(address => PublicKey) public deviceKeys;
    
    function verifyDeviceSignature(
        bytes32 messageHash,
        bytes32 r,
        bytes32 s,
        PublicKey memory pubKey
    ) public view returns (bool) {
        bytes memory input = abi.encodePacked(
            messageHash,
            r, s,
            pubKey.x, pubKey.y
        );
        
        (bool success, bytes memory result) = P256_PRECOMPILE.staticcall(input);
        
        if (!success || result.length != 32) {
            return false;
        }
        
        return abi.decode(result, (uint256)) == 1;
    }
    
    function registerDevice(PublicKey calldata pubKey) external {
        deviceKeys[msg.sender] = pubKey;
    }
    
    function executeWithBiometric(
        address target,
        bytes calldata data,
        bytes32 r,
        bytes32 s
    ) external {
        bytes32 txHash = keccak256(abi.encodePacked(target, data, block.number));
        PublicKey memory pubKey = deviceKeys[msg.sender];
        
        require(
            verifyDeviceSignature(txHash, r, s, pubKey),
            "Invalid biometric signature"
        );
        
        (bool success,) = target.call(data);
        require(success, "Transaction failed");
    }
}
```

## Use Cases

### 1. Biometric Wallets

**Problem**: Seed phrases are difficult to manage and easy to lose  
**Solution**: Sign transactions with Face ID, Touch ID, Windows Hello

**Implementation**:
```javascript
// Device generates secp256r1 key pair in Secure Enclave
const publicKey = await navigator.credentials.create({
    publicKey: {
        challenge: challengeBytes,
        rp: { name: "Lux Network" },
        user: { id: userIdBytes, name: username, displayName: displayName },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256 (secp256r1)
        authenticatorSelection: { authenticatorAttachment: "platform" }
    }
});

// Register public key with smart contract
await wallet.registerDevice(publicKey.x, publicKey.y);

// Sign transaction with biometric
const signature = await navigator.credentials.get({
    publicKey: { challenge: txHash, allowCredentials: [{ id: credentialId, type: "public-key" }] }
});

// Submit to blockchain (only 3,450 gas for verification!)
await wallet.executeWithBiometric(target, data, signature.r, signature.s);
```

**Benefits**:
- No private key exposure
- Hardware-backed security
- Familiar UX for users

### 2. Enterprise SSO Integration

**Scenario**: Large institution wants employees to sign blockchain transactions using corporate identity

**Implementation**:
```go
// Enterprise backend provisions secp256r1 keys in HSM
func ProvisionEmployeeKey(employeeID string) (*ecdsa.PublicKey, error) {
    privateKey, err := ecdsa.GenerateKey(elliptic.P256(), hsmProvider)
    if err != nil {
        return nil, err
    }
    
    // Register on-chain
    tx := contract.RegisterDevice(privateKey.PublicKey.X, privateKey.PublicKey.Y)
    return &privateKey.PublicKey, sendTransaction(tx)
}

// Employee signs transaction via SSO
func SignWithCorpIdentity(userToken, txData []byte) (r, s *big.Int, err error) {
    // Validate SSO token
    employeeID := validateSSOToken(userToken)
    
    // Sign with HSM-backed key
    hash := sha256.Sum256(txData)
    r, s, err = hsmProvider.Sign(employeeID, hash[:])
    return
}
```

**Benefits**:
- Compliance with corporate security policies
- Audit trails through existing SSO systems
- No individual key management

### 3. WebAuthn / Passkeys for DeFi

**Scenario**: User wants to trade on Lux DEX using their iPhone

**Flow**:
1. User creates passkey during wallet setup
2. iPhone Secure Enclave generates secp256r1 key pair
3. Public key registered on-chain (one-time, ~50k gas)
4. User initiates swap on DEX
5. iPhone prompts for Face ID
6. Signature generated in Secure Enclave
7. Transaction submitted with signature (3,450 gas verification)

**Gas Comparison**:
- **Before LP-204**: 330,000 gas for signature verification
- **With LP-204**: 3,450 gas (99% reduction)
- **User Savings**: ~$10 → $0.10 per transaction (at $50/LUX, 100 gwei)

### 4. Cross-Chain Identity (Lux Multi-Chain)

**Integration with Lux Chains**:
- **A-Chain (AI VM)**: AI agents sign operations with secp256r1 device keys
- **B-Chain (Bridge VM)**: Cross-chain messages authenticated via device signatures
- **C-Chain (EVM)**: Primary implementation of precompile
- **D-Chain (Platform)**: Validator registration via enterprise HSMs
- **Z-Chain (ZK VM)**: Zero-knowledge proofs of device-based authentication

**Unified Identity Across Chains**:
```solidity
// Same secp256r1 key works across all Lux EVM chains
contract CrossChainIdentity {
    // Deployed on C-Chain
    function verifyAndBridge(
        bytes32 messageHash,
        bytes32 r, bytes32 s,
        PublicKey memory pubKey,
        uint256 destChainId
    ) external {
        require(verifyDeviceSignature(messageHash, r, s, pubKey));
        
        // Bridge identity to other Lux chains
        ICM.sendCrossChain(destChainId, abi.encode(pubKey, messageHash));
    }
}
```

## Security Considerations

### Cryptographic Security

**Curve Strength**:
- secp256r1 is NIST-approved, FIPS 186-3 compliant
- Security comparable to secp256k1 (used by Bitcoin, Ethereum)
- Estimated 128-bit security level

**No Malleability Check**:
- RIP-7212 omits malleability check to match NIST specification
- Applications requiring non-malleability can implement wrapper checks
- Not a security issue for on-chain usage (signatures tied to specific transactions)

### Implementation Security

**Input Validation**:
- Curve point validation prevents invalid public keys
- Range checks on r, s prevent out-of-bounds values
- Follows Go stdlib `crypto/ecdsa` and `crypto/elliptic` (FIPS 186-3 compliant)

**DoS Prevention**:
- Fixed gas cost (3,450) prevents computation-based DoS
- Significantly cheaper than ECC operations in EVM
- Lower cost than existing ECRECOVER precompile

### Device Security

**Trusted Execution Environments**:
- iOS Secure Enclave: Keys never leave hardware
- Android Keystore: Hardware-backed on modern devices  
- Windows Hello: TPM 2.0 protection
- macOS Touch ID: Secure Enclave isolation

**Attack Vectors**:
- **Phishing**: User still needs to approve transactions (biometric required)
- **Device Compromise**: Keys isolated in hardware security modules
- **Key Export**: Impossible with platform authenticators
- **Social Engineering**: Biometric authentication provides second factor

## Quantum Considerations

### Transition Strategy

secp256r1 is **not quantum-resistant**, but serves as a bridge to post-quantum cryptography:

**Phase 1 (Current)**: secp256r1 precompile enables device-based signing  
**Phase 2**: Hybrid signatures (secp256r1 + ML-DSA from LP-002)  
**Phase 3**: Pure post-quantum (ML-DSA / SLH-DSA from LP-003)

**Migration Path**:
```solidity
contract QuantumSafeWallet {
    // Support both classical and post-quantum signatures
    bool public quantumTransitionComplete;
    
    function verify(bytes32 hash, bytes memory signature, bytes memory pubKey) public view returns (bool) {
        if (quantumTransitionComplete) {
            // Use LP-002 (ML-DSA)
            return verifyMLDSA(hash, signature, pubKey);
        } else {
            // Use LP-204 (secp256r1)
            (bytes32 r, bytes32 s, bytes32 x, bytes32 y) = abi.decode(signature, (bytes32, bytes32, bytes32, bytes32));
            return verifyDeviceSignature(hash, r, s, PublicKey(x, y));
        }
    }
}
```

**Y-Chain Integration**:
- Y-Chain quantum state manager can orchestrate migration
- Epoch-based transitions (coordinate with LP-181)
- Gradual rollout to prevent disruption

## Backwards Compatibility

**Additive Change**:
- New precompile at unused address
- No modifications to existing opcodes or consensus rules
- Existing contracts unaffected

**Network Upgrade Required**:
- C-Chain and EVM L1s need coordinated upgrade
- Individual subnets can adopt independently
- Compatible with ProposerVM and other consensus layers

**Cross-Ecosystem Compatibility**:
- Same address as RIP-7212 (Ethereum rollups)
- Libraries work unmodified across ecosystems
- Standard interface for signature verification

## Implementation Status

**Upstream Sources**:
- [RIP-7212 Specification](https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md)
- [BOR Implementation (Polygon)](https://github.com/maticnetwork/bor/pull/1069)
- [EIP-7212](https://eips.ethereum.org/EIPS/eip-7212)

**Lux Node**:
- To be cherry-picked from upstream or implemented directly
- Integration with C-Chain (coreth/geth)
- Uses Go stdlib `crypto/ecdsa` and `crypto/elliptic`

**Activation**: Granite network upgrade

### Integration Points

**Coreth (C-Chain)**:
```go
// vm/precompiles/secp256r1.go
package precompiles

import (
    "crypto/ecdsa"
    "crypto/elliptic"
    "math/big"
)

const Secp256r1Address = "0x0000000000000000000000000000000000000100"
const Secp256r1Gas = 3450

func RunSecp256r1(input []byte) ([]byte, error) {
    if len(input) != 160 {
        return nil, errInvalidInputLength
    }
    
    hash := input[0:32]
    r := new(big.Int).SetBytes(input[32:64])
    s := new(big.Int).SetBytes(input[64:96])
    x := new(big.Int).SetBytes(input[96:128])
    y := new(big.Int).SetBytes(input[128:160])
    
    // Validate public key is on curve
    curve := elliptic.P256()
    if !curve.IsOnCurve(x, y) {
        return []byte{}, nil // Invalid, return empty
    }
    
    // Verify signature
    pubKey := &ecdsa.PublicKey{Curve: curve, X: x, Y: y}
    if ecdsa.Verify(pubKey, hash, r, s) {
        return common.LeftPadBytes([]byte{1}, 32), nil
    }
    
    return []byte{}, nil
}
```

## Future Enhancements

### Hardware Wallet Integration

- Support for Ledger/Trezor secp256r1 signing
- Cross-device key synchronization (iCloud Keychain, etc.)
- Multi-device approvals for high-value transactions

### Batch Verification

- Precompile variant for batch signature verification
- Reduced gas costs for multi-sig wallets
- Optimized for ICM message bundles

### Post-Quantum Hybrid Signatures

- Combine secp256r1 + ML-DSA (LP-002)
- Dual verification for quantum transition
- Gradual migration path

## Ecosystem Impact

### Developer Experience

**Before LP-204**:
```solidity
// 330k gas, complex Solidity implementation
function verifyP256(bytes32 hash, bytes32 r, bytes32 s, bytes32 x, bytes32 y) 
    public pure returns (bool) {
    // 500+ lines of elliptic curve math
    // Expensive field operations
    // Multiple modular inversions
}
```

**With LP-204**:
```solidity
// 3,450 gas, one precompile call
function verifyP256(bytes32 hash, bytes32 r, bytes32 s, bytes32 x, bytes32 y) 
    public view returns (bool) {
    (bool success, bytes memory result) = 
        0x0000000000000000000000000000000000000100.staticcall(
            abi.encodePacked(hash, r, s, x, y)
        );
    return success && abi.decode(result, (uint256)) == 1;
}
```

### Application Categories Enabled

1. **Consumer DeFi**: Biometric wallets for trading, lending, staking
2. **Enterprise Blockchain**: Corporate identity integration
3. **Gaming**: Secure in-game asset transactions
4. **NFT Marketplaces**: Device-based authentication for purchases
5. **DAO Governance**: Biometric voting
6. **Cross-Chain Apps**: Unified identity across Lux chains

## References

- [ACP-204 Original Specification](https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/204-precompile-secp256r1)
- [RIP-7212: secp256r1 Precompile](https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md)
- [EIP-7212: secp256r1 Curve Support](https://eips.ethereum.org/EIPS/eip-7212)
- [NIST FIPS 186-3: Digital Signature Standard](https://csrc.nist.gov/publications/detail/fips/186/3/archive/2009-06-25)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [LP-318: ML-KEM (Post-Quantum Key Encapsulation)](lp-318-ml-kem-post-quantum-key-encapsulation.md)
- [LP-316: ML-DSA (Post-Quantum Digital Signatures)](lp-316-ml-dsa-post-quantum-digital-signatures.md)
- [LP-181: P-Chain Epoched Views](lp-181-epoching.md)

## Copyright

Copyright © 2025 Lux Industries Inc. All rights reserved.  
Based on ACP-204 - Copyright waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
