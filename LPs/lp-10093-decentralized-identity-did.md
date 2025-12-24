---
lp: 10093
title: W3C Decentralized Identity (DID) Standard
description: W3C DID Core specification implementation with premium registry, x402 integration, and multi-network support
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
requires: 7014, 40, 3028
tags: [lrc, identity, did, w3c, x402]
order: 113
---

## Abstract

This LP specifies the W3C Decentralized Identity (DID) implementation for the Lux Network, providing on-chain DID registration, resolution, and management. It includes a premium registry with tiered pricing for short identifiers, x402 payment protocol integration for monetized identity services, and multi-network deployment across Lux, Hanzo, and Zoo chains.

## Motivation

Decentralized identity is critical for:

1. **Privacy Preservation**: Users control their personal data
2. **Regulatory Compliance**: Meet KYC/AML requirements without centralization
3. **Cross-Platform Portability**: One identity across all Lux applications
4. **Sybil Resistance**: Prevent fake accounts and bots
5. **Reputation Systems**: Build on-chain credit and trust

## Current Implementation

### Z-Chain Privacy Features
- **GitHub**: https://github.com/luxfi/z-chain
- **Technology**: ZK-proofs, FHE, TEE attestations
- **Status**: Development phase

### Identity Components in Ecosystem
```typescript
// Current identity touchpoints across repos
interface IdentityArchitecture {
  wallet: {
    repo: "luxfi/wallet";
    features: ["Address management", "Key derivation", "Social recovery"];
  };
  
  compliance: {
    repo: "luxfi/compliance";
    providers: ["Jumio", "Onfido", "Sumsub"];
    data_handling: "Centralized with encryption";
  };
  
  credit_system: {
    repo: "luxfi/credit";
    identity_requirements: ["KYC Level 2", "Proof of income"];
    reputation_tracking: true;
  };
}
```

## Research Findings

### 1. Zero-Knowledge KYC Architecture

#### Z-Chain Based Implementation
```solidity
// Proposed ZK-KYC on Z-Chain
contract ZKIdentity {
    struct IdentityCommitment {
        bytes32 commitment;      // Hash of identity attributes
        bytes32 nullifier;       // Prevent double-spending identity
        uint256 attestationTime;
        address attestor;        // KYC provider
        bytes32 merkleRoot;      // Root of attribute tree
    }
    
    struct ZKProof {
        bytes proof;            // ZK-SNARK/STARK proof
        bytes32 publicInputs;   // Age > 18, country != sanctioned, etc.
    }
    
    mapping(address => IdentityCommitment) public identities;
    mapping(bytes32 => bool) public usedNullifiers;
    
    function registerIdentity(
        bytes32 commitment,
        bytes calldata attestation,
        address attestor
    ) external {
        require(authorizedAttestors[attestor], "Unauthorized attestor");
        require(verifyAttestation(commitment, attestation, attestor), "Invalid attestation");
        
        identities[msg.sender] = IdentityCommitment({
            commitment: commitment,
            nullifier: keccak256(abi.encode(commitment, msg.sender)),
            attestationTime: block.timestamp,
            attestor: attestor,
            merkleRoot: calculateMerkleRoot(commitment)
        });
        
        emit IdentityRegistered(msg.sender, attestor);
    }
    
    function proveAttribute(
        bytes32 attribute,    // e.g., "age > 18"
        ZKProof calldata zkProof
    ) external view returns (bool) {
        IdentityCommitment memory identity = identities[msg.sender];
        
        return verifyZKProof(
            identity.commitment,
            attribute,
            zkProof
        );
    }
}
```

### 2. Self-Sovereign Identity Model

```typescript
// DID Document structure for Lux
interface LuxDIDDocument {
  "@context": ["https://www.w3.org/ns/did/v1", "https://lux.network/did/v1"];
  id: `did:lux:${chainId}:${address}`;
  
  verificationMethod: [{
    id: `${did}#keys-1`;
    type: "EcdsaSecp256k1VerificationKey2019";
    controller: string;
    publicKeyHex: string;
  }];
  
  authentication: string[];
  assertionMethod: string[];
  
  service: [{
    id: `${did}#identity-hub`;
    type: "IdentityHub";
    serviceEndpoint: "https://hub.lux.network";
  }];
  
  // Lux-specific extensions
  luxExtensions: {
    chains: string[];           // Active on which chains
    reputation: number;         // Aggregate reputation score
    attestations: string[];     // IPFS hashes of attestations
    recovery: string[];         // Social recovery addresses
  };
}
```

### 3. Privacy-Preserving Credentials

```solidity
// Verifiable Credentials with selective disclosure
contract VerifiableCredentials {
    struct Credential {
        bytes32 schemaHash;     // Type of credential
        address issuer;
        uint256 issuanceDate;
        uint256 expirationDate;
        bytes32 merkleRoot;     // Root of claims tree
        bytes signature;        // Issuer's signature
    }
    
    struct SelectiveDisclosure {
        bytes32[] revealedClaims;
        bytes32[] merkleProofs;
        bytes32 challenge;      // Prevents replay
    }
    
    mapping(address => mapping(bytes32 => Credential)) public credentials;
    
    function issueCredential(
        address subject,
        bytes32 schemaHash,
        bytes32 claimsMerkleRoot,
        uint256 expiration
    ) external {
        require(authorizedIssuers[msg.sender], "Unauthorized issuer");
        
        bytes32 credentialId = keccak256(
            abi.encode(subject, schemaHash, block.timestamp)
        );
        
        credentials[subject][credentialId] = Credential({
            schemaHash: schemaHash,
            issuer: msg.sender,
            issuanceDate: block.timestamp,
            expirationDate: expiration,
            merkleRoot: claimsMerkleRoot,
            signature: signCredential(claimsMerkleRoot)
        });
    }
    
    function verifyDisclosure(
        address subject,
        bytes32 credentialId,
        SelectiveDisclosure calldata disclosure
    ) external view returns (bool) {
        Credential memory cred = credentials[subject][credentialId];
        
        // Verify merkle proofs for revealed claims
        for (uint i = 0; i < disclosure.revealedClaims.length; i++) {
            require(
                MerkleProof.verify(
                    disclosure.merkleProofs[i],
                    cred.merkleRoot,
                    disclosure.revealedClaims[i]
                ),
                "Invalid claim proof"
            );
        }
        
        return true;
    }
}
```

### 4. Cross-Chain Identity Portability

```typescript
// Identity bridge for cross-chain portability
interface IdentityBridge {
  // Identity state synchronization
  syncIdentity: {
    source_chain: "Z-Chain";  // Primary identity chain
    target_chains: ["C-Chain", "X-Chain", "P-Chain"];
    sync_method: "Light client proofs";
    update_frequency: "On-demand";
  };
  
  // Reputation aggregation
  reputation: {
    sources: [{
      chain: "C-Chain";
      weight: 0.4;
      metrics: ["Transaction volume", "Contract interactions", "Token holdings"];
    }, {
      chain: "X-Chain";
      weight: 0.3;
      metrics: ["Trading volume", "Market making", "Liquidations"];
    }, {
      chain: "Z-Chain";
      weight: 0.3;
      metrics: ["Identity attestations", "Privacy score", "Governance participation"];
    }];
    
    calculation: "Weighted average with decay";
  };
}
```

### 5. Decentralized KYC Providers

```solidity
// Decentralized KYC provider registry
contract KYCRegistry {
    struct KYCProvider {
        string name;
        string endpoint;
        uint256 stake;
        uint256 attestations;
        uint256 disputes;
        uint8 trustScore;       // 0-100
        bool active;
    }
    
    mapping(address => KYCProvider) public providers;
    mapping(address => mapping(address => bytes32)) public attestations;
    
    function becomeProvider(string memory name, string memory endpoint) 
        external 
        payable 
    {
        require(msg.value >= MIN_PROVIDER_STAKE, "Insufficient stake");
        
        providers[msg.sender] = KYCProvider({
            name: name,
            endpoint: endpoint,
            stake: msg.value,
            attestations: 0,
            disputes: 0,
            trustScore: 50,     // Start at neutral
            active: true
        });
    }
    
    function attestIdentity(
        address subject,
        bytes32 attestationHash,
        bytes calldata signature
    ) external {
        require(providers[msg.sender].active, "Provider not active");
        
        attestations[msg.sender][subject] = attestationHash;
        providers[msg.sender].attestations++;
        
        emit AttestationCreated(msg.sender, subject, attestationHash);
    }
}
```

## Recommendations

### 1. Architecture Design

```
recommended_architecture:
  core_identity:
    storage: "Z-Chain for privacy"
    format: "W3C DID with Lux extensions"
    recovery: "Social recovery via multi-sig"
  
  kyc_layer:
    approach: "Privacy-preserving with ZK proofs"
    providers: "Decentralized registry"
    compliance: "Selective disclosure per jurisdiction"
  
  credentials:
    issuance: "Merkle tree for selective reveal"
    verification: "On-chain with caching"
    portability: "Cross-chain via Teleporter"
  
  reputation:
    calculation: "Multi-chain aggregation"
    privacy: "Optional public/private modes"
    decay: "Time-weighted with activity bonus"
```

### 2. Privacy Features

1. **Anonymous Credentials**: Prove attributes without revealing identity
2. **Threshold Disclosure**: Reveal only required information
3. **Plausible Deniability**: Multiple valid proofs for same claim
4. **Forward Secrecy**: Past attestations remain private

### 3. Integration Points

1. **Wallet Integration**: Native DID support in Lux wallets
2. **DeFi Protocols**: Reputation-based lending rates
3. **Governance**: Sybil-resistant voting
4. **Gaming**: Portable avatars and achievements

## Implementation Roadmap

### Phase 1: Core DID (Q1 2025)
- [x] DID method specification (W3C DID Core compliant)
- [x] On-chain identity contracts (DIDRegistry, DIDResolver)
- [ ] Z-Chain identity contracts
- [ ] Basic wallet integration

### Phase 2: ZK-KYC (Q2 2025)
- [ ] Zero-knowledge circuits
- [ ] Provider registry
- [ ] Compliance framework

### Phase 3: Ecosystem Integration (Q3 2025)
- [ ] Cross-chain reputation
- [ ] DeFi integration
- [ ] Gaming identity

## Reference Implementation

The W3C DID specification has been implemented in the Lux standard library:

| Component | Location | Status |
|-----------|----------|--------|
| DID Interface | `standard/contracts/identity/interfaces/IDID.sol` | ✅ Implemented |
| DID Registry | `standard/contracts/identity/DIDRegistry.sol` | ✅ Implemented |
| DID Resolver | `standard/contracts/identity/DIDResolver.sol` | ✅ Implemented |
| Omnichain Resolver | `standard/contracts/identity/DIDResolver.sol` | ✅ Implemented |
| Premium DID Registry | `standard/contracts/identity/PremiumDIDRegistry.sol` | ✅ Implemented |
| x402 DID Service | `standard/contracts/identity/interfaces/IDID.sol` | ✅ Implemented |
| Karma Integration | `standard/contracts/governance/Karma.sol` | ✅ Integrated |

### Premium DID Registry

The Premium DID Registry enables paid registration for short identifiers with tiered pricing:

| Length | Tier | Price (Native) | Example |
|--------|------|----------------|---------|
| 1 char | Ultra Premium | 1000 tokens | `did:lux:a` |
| 2 chars | Super Premium | 100 tokens | `did:lux:ai` |
| 3 chars | Premium | 10 tokens | `did:lux:bob` |
| 4 chars | Standard | 1 token | `did:lux:john` |
| 5+ chars | Basic | 0.1 tokens | `did:lux:alice` |

Features:
- Annual renewal with 30-day grace period
- Network-specific deployment (Lux, Hanzo, Zoo)
- Treasury fee collection and withdrawal
- Reserved identifier protection for registrars

### x402 Payment Protocol Integration

DIDs can advertise x402 payment capabilities through service endpoints:

```json
{
  "id": "did:lux:alice#x402-payment",
  "type": "X402PaymentEndpoint",
  "serviceEndpoint": "https://pay.alice.lux/x402",
  "acceptedTokens": ["LUX", "USDC", "ETH"],
  "facilitator": "did:lux:hanzo-facilitator"
}
```

Service Types for x402:
- `X402PaymentEndpoint` - Payment verification endpoint
- `X402Facilitator` - Facilitator service
- `X402Resource` - Protected resource

See [LP-3028: x402 Payment Protocol](./lp-3028-x402-payment-protocol.md) for protocol details.

### Multi-Network Deployment

The DID registry supports deployment across multiple networks:

| Network | Method | Chain ID | Status |
|---------|--------|----------|--------|
| Lux Mainnet | `did:lux` | 96369 | ✅ Ready |
| Lux Testnet | `did:lux` | 96368 | ✅ Ready |
| Hanzo | `did:hanzo` | TBD | 🔄 Planned |
| Zoo Mainnet | `did:zoo` | 200200 | 🔄 Planned |
| Zoo Testnet | `did:zoo` | 200201 | 🔄 Planned |

Each network has its own DID registry with cross-chain resolution via Warp messaging.

### Key Implementation Features

1. **W3C DID Core Compliance**
   - Full DID document structure with verification methods
   - Service endpoint management
   - Controller-based access control

2. **Supported DID Methods**
   ```
   did:lux:<identifier>
   did:lux:mainnet:<address>
   did:lux:testnet:<address>
   did:hanzo:<username>
   did:hanzo:eth:<address>
   ```

3. **Verification Method Types**
   - Ed25519VerificationKey2020
   - EcdsaSecp256k1VerificationKey2019
   - EcdsaSecp256k1RecoveryMethod2020 (Ethereum-style)
   - MlDsa44VerificationKey2024 (Post-quantum)
   - MlDsa65VerificationKey2024 (Post-quantum)
   - SlhDsa128VerificationKey2024 (Post-quantum)

4. **Integration with Governance**
   - Karma.sol now supports DIDRegistry verification
   - `linkDIDFromRegistry()` for self-service DID linking
   - `hasVerifiedDID()` for checking on-chain verification

### Rust Reference Implementation

The Solidity contracts are ported from the Hanzo DID Rust crate:
- **Repository**: `hanzo/rust-sdk/crates/hanzo-did`
- **Features**: DID parsing, DID Document, verification methods, services, omnichain variants

## Related Repositories

- **Lux Standard Library**: https://github.com/luxfi/standard
- **Hanzo DID (Rust)**: https://github.com/hanzo-ai/rust-sdk/tree/main/crates/hanzo-did
- **Z-Chain**: https://github.com/luxfi/z-chain
- **Identity SDK**: https://github.com/luxfi/identity-sdk
- **Compliance Tools**: https://github.com/luxfi/compliance
- **Wallet Integration**: https://github.com/luxfi/wallet

## Open Questions

1. **Key Recovery**: Best practices for lost keys?
2. **Regulatory Compliance**: How to handle different jurisdictions?
3. **Privacy vs Transparency**: Balance for different use cases?
4. **Scalability**: How to handle billions of identities?

## Conclusion

Decentralized identity on Lux leverages Z-Chain's unique privacy features to create a compliant yet private identity system. The combination of zero-knowledge proofs, selective disclosure, and cross-chain portability positions Lux as a leader in self-sovereign identity.

## References

- [W3C DID Specification](https://www.w3.org/TR/did-core/)
- [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
- [BBS+ Signatures](https://github.com/hyperledger/anoncreds-spec)
- [Sovrin Network](https://sovrin.org/)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
## Specification

Normative sections define APIs, data models, and parameters. Implementations MUST follow these for consistent behavior.

## Rationale

This approach offers clear operational semantics and aligns with Lux’s ecosystem goals.

## Backwards Compatibility

Additive and non‑breaking; existing deployments continue to function.

## Security Considerations

Ensure thorough input validation, secure key handling, and defenses against replay/DoS.
