---
lp: 6353
title: Privacy Bridge with Range Proofs
description: Private cross-chain transfers using Bulletproofs for amount hiding and stealth addresses for recipient privacy.
author: Claude (@anthropic)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-27
tags: [teleport, bridge, privacy, bulletproofs, stealth-address]
requires: [6021, 6352]
order: 353
---

## Abstract

This LP specifies a privacy-preserving bridge extension using Bulletproofs for confidential transfers and stealth addresses for recipient privacy. Users can bridge assets without revealing amounts on-chain, while still proving they burned valid amounts on the source chain. This provides financial privacy for cross-chain operations while maintaining full auditability through zero-knowledge proofs.

## Motivation

Current bridge implementations (LP-6021, LP-6350-6352) expose full transfer details on-chain:

| Data Exposed | Public Bridges | Private Bridge (this LP) |
|--------------|---------------|-------------------------|
| Amount | ✗ Visible | ✓ Hidden (range proof) |
| Sender | ✗ Visible | ✓ Hidden (stealth send) |
| Recipient | ✗ Visible | ✓ Hidden (stealth address) |
| Token type | ✗ Visible | Configurable |

Privacy is essential for:

* **Financial Privacy**: Users shouldn't expose their net worth publicly
* **Business Confidentiality**: Companies need private treasury operations
* **Regulatory Compliance**: Some jurisdictions require transaction privacy
* **MEV Protection**: Hidden amounts prevent front-running

## Specification

### 1. Cryptographic Primitives

#### 1.1 Pedersen Commitments

Hide amounts using additive homomorphic commitments:

```
Commitment = amount * G + blinding * H
```

Where:
- `G`, `H` are generator points on secp256k1
- `amount` is the hidden value
- `blinding` is a random scalar

Properties:
- **Hiding**: Cannot extract amount without blinding factor
- **Binding**: Cannot open to different amount
- **Homomorphic**: `C(a) + C(b) = C(a+b)`

#### 1.2 Bulletproofs

Prove amount is in valid range [0, 2^64) without revealing it:

```
RangeProof = Bulletproof.prove(amount, blinding, [0, 2^64))
```

Properties:
- Proof size: ~700 bytes (logarithmic in range size)
- Verification: ~50k gas
- No trusted setup required

#### 1.3 Stealth Addresses

Generate one-time addresses for recipient privacy:

```
// Sender generates ephemeral keypair
(r, R) = generateKeyPair()

// Compute shared secret with recipient's public key
sharedSecret = ECDH(r, recipientPublicKey)

// Derive one-time address
stealthAddress = recipientPublicKey + hash(sharedSecret) * G
```

Recipient scans for payments by checking each `R`:
```
expectedAddress = recipientPublicKey + hash(ECDH(recipientPrivateKey, R)) * G
```

### 2. Private Burn

```solidity
interface IPrivateBridge {
    struct PrivateBurnData {
        bytes32 commitment;      // Pedersen commitment to amount
        bytes rangeProof;        // Bulletproof that amount in [0, 2^64)
        bytes32 tokenCommitment; // Optional: hide token type too
        bytes32 stealthPubKey;   // Recipient's stealth meta-address
        bytes32 ephemeralPubKey; // R for stealth derivation
        bytes32 nullifier;       // Prevents double-spend
    }
    
    event PrivateBridgeBurned(
        bytes32 indexed nullifier,
        bytes32 commitment,
        bytes32 ephemeralPubKey,
        uint256 toChainId
    );
    
    /// @notice Burn tokens privately
    /// @param token The token to burn
    /// @param data Private burn parameters
    function privateBurn(
        address token,
        PrivateBurnData calldata data
    ) external returns (bytes32 nullifier);
}
```

### 3. Range Proof Verification

```solidity
library Bulletproofs {
    struct RangeProof {
        // Proof components (compressed)
        uint256 A;       // First commitment
        uint256 S;       // Second commitment
        uint256 T1;      // Polynomial commitment
        uint256 T2;      // Polynomial commitment
        uint256 taux;    // Blinding factor for t
        uint256 mu;      // Blinding factor
        uint256 t;       // Polynomial evaluation
        uint256[] L;     // Left vector commitments
        uint256[] R;     // Right vector commitments
        uint256 a;       // Final scalar
        uint256 b;       // Final scalar
    }
    
    /// @notice Verify a Bulletproof range proof
    /// @param commitment The Pedersen commitment
    /// @param proof The range proof
    /// @return valid Whether the proof is valid
    function verify(
        uint256 commitment,
        RangeProof calldata proof
    ) internal view returns (bool) {
        // 1. Reconstruct challenges using Fiat-Shamir
        uint256 y = hashToScalar(commitment, proof.A, proof.S);
        uint256 z = hashToScalar(y);
        uint256 x = hashToScalar(z, proof.T1, proof.T2);
        
        // 2. Verify polynomial commitment
        // t * G + taux * H == z^2 * V + delta * G + x * T1 + x^2 * T2
        
        // 3. Verify inner product proof
        // Uses logarithmic verification with L, R vectors
        
        // 4. Final pairing check
        return verifyInnerProduct(proof, x, y, z);
    }
    
    /// @notice Batch verify multiple range proofs (more efficient)
    function batchVerify(
        uint256[] calldata commitments,
        RangeProof[] calldata proofs
    ) internal view returns (bool) {
        // Aggregate proofs for single verification
        // ~40% gas savings over individual verification
    }
}
```

### 4. Stealth Address Registry

```solidity
contract StealthAddressRegistry {
    // Meta-address = (spendingPubKey, viewingPubKey)
    struct MetaAddress {
        bytes32 spendingPubKey;
        bytes32 viewingPubKey;
    }
    
    mapping(address => MetaAddress) public metaAddresses;
    
    event MetaAddressRegistered(
        address indexed owner,
        bytes32 spendingPubKey,
        bytes32 viewingPubKey
    );
    
    /// @notice Register stealth meta-address
    function register(
        bytes32 spendingPubKey,
        bytes32 viewingPubKey
    ) external {
        metaAddresses[msg.sender] = MetaAddress(spendingPubKey, viewingPubKey);
        emit MetaAddressRegistered(msg.sender, spendingPubKey, viewingPubKey);
    }
    
    /// @notice Compute stealth address for recipient
    function computeStealthAddress(
        address recipient,
        bytes32 ephemeralPrivKey
    ) external view returns (address stealthAddress, bytes32 ephemeralPubKey) {
        MetaAddress memory meta = metaAddresses[recipient];
        require(meta.spendingPubKey != bytes32(0), "Not registered");
        
        // Compute shared secret
        bytes32 sharedSecret = ecMul(meta.viewingPubKey, ephemeralPrivKey);
        
        // Derive stealth address
        bytes32 stealthPubKey = ecAdd(
            meta.spendingPubKey,
            ecMul(G, keccak256(abi.encode(sharedSecret)))
        );
        
        stealthAddress = pubKeyToAddress(stealthPubKey);
        ephemeralPubKey = ecMul(G, ephemeralPrivKey);
    }
}
```

### 5. Private Claim

```solidity
contract PrivateBridge {
    using Bulletproofs for *;
    
    mapping(bytes32 => bool) public nullifiers;
    mapping(bytes32 => bool) public claimed;
    
    struct PrivateClaimData {
        bytes32 commitment;       // Amount commitment
        bytes32 nullifier;        // From source chain
        address stealthAddress;   // Derived stealth address
        bytes32 ephemeralPubKey;  // For stealth derivation
        bytes rangeProof;         // Bulletproof
        bytes zkProof;            // ZK proof of source burn (LP-6352)
    }
    
    event PrivateBridgeClaimed(
        bytes32 indexed nullifier,
        address indexed stealthAddress,
        bytes32 commitment
    );
    
    /// @notice Claim privately with range proof
    function privateClaim(
        PrivateClaimData calldata data
    ) external {
        // 1. Verify not already claimed
        require(!claimed[data.nullifier], "Already claimed");
        claimed[data.nullifier] = true;
        
        // 2. Verify range proof (amount in valid range)
        require(
            Bulletproofs.verify(
                uint256(data.commitment),
                abi.decode(data.rangeProof, (Bulletproofs.RangeProof))
            ),
            "Invalid range proof"
        );
        
        // 3. Verify ZK proof of source chain burn
        require(
            zkVerifier.verifyPrivateBurn(data.zkProof, data.commitment, data.nullifier),
            "Invalid burn proof"
        );
        
        // 4. Mint to stealth address with commitment
        // Amount is hidden - mint "commitment tokens"
        IPrivateToken(privateToken).mintCommitment(
            data.stealthAddress,
            data.commitment
        );
        
        emit PrivateBridgeClaimed(
            data.nullifier,
            data.stealthAddress,
            data.commitment
        );
    }
}
```

### 6. Private Token (Commitment-Based)

```solidity
contract PrivateToken is ERC20 {
    // Commitment-based balances
    mapping(address => bytes32[]) public commitments;
    mapping(bytes32 => bool) public spentCommitments;
    
    event CommitmentMinted(address indexed to, bytes32 commitment);
    event CommitmentSpent(bytes32 indexed commitment, bytes32 newCommitment);
    
    /// @notice Mint a commitment (only bridge can call)
    function mintCommitment(
        address to,
        bytes32 commitment
    ) external onlyBridge {
        commitments[to].push(commitment);
        emit CommitmentMinted(to, commitment);
    }
    
    /// @notice Spend commitment privately
    /// @param oldCommitment Commitment to spend
    /// @param newCommitment Change commitment (back to sender)
    /// @param recipientCommitment Commitment to recipient
    /// @param rangeProofs Bulletproofs for both new commitments
    /// @param balanceProof Proof that oldCommitment = newCommitment + recipientCommitment
    function transfer(
        bytes32 oldCommitment,
        bytes32 newCommitment,
        bytes32 recipientCommitment,
        bytes calldata rangeProofs,
        bytes calldata balanceProof
    ) external {
        require(!spentCommitments[oldCommitment], "Already spent");
        
        // Verify range proofs
        require(verifyRangeProofs(rangeProofs, newCommitment, recipientCommitment));
        
        // Verify balance: old = new + recipient (homomorphic property)
        require(verifyBalanceProof(balanceProof, oldCommitment, newCommitment, recipientCommitment));
        
        spentCommitments[oldCommitment] = true;
        commitments[msg.sender].push(newCommitment);
        
        emit CommitmentSpent(oldCommitment, newCommitment);
    }
    
    /// @notice Exit to public tokens
    function reveal(
        bytes32 commitment,
        uint256 amount,
        uint256 blindingFactor,
        address recipient
    ) external {
        require(!spentCommitments[commitment], "Already spent");
        
        // Verify commitment opens to claimed amount
        bytes32 computed = pedersenCommit(amount, blindingFactor);
        require(computed == commitment, "Invalid opening");
        
        spentCommitments[commitment] = true;
        _mint(recipient, amount);
    }
}
```

### 7. Client SDK

```typescript
import { Bulletproofs, StealthAddress, PedersenCommitment } from '@lux/privacy';

interface PrivateBridgeParams {
    token: string;
    amount: bigint;
    recipientMetaAddress: MetaAddress;
    sourceChainId: number;
    destChainId: number;
}

async function privateBridge(params: PrivateBridgeParams) {
    // 1. Generate blinding factor
    const blinding = randomScalar();
    
    // 2. Create Pedersen commitment
    const commitment = PedersenCommitment.commit(params.amount, blinding);
    
    // 3. Generate range proof
    const rangeProof = await Bulletproofs.prove(params.amount, blinding);
    
    // 4. Generate stealth address for recipient
    const ephemeralKey = randomScalar();
    const { stealthAddress, ephemeralPubKey } = StealthAddress.derive(
        params.recipientMetaAddress,
        ephemeralKey
    );
    
    // 5. Generate nullifier (prevents double-spend)
    const nullifier = keccak256(
        abi.encode(commitment, params.sourceChainId, params.destChainId)
    );
    
    // 6. Burn on source chain
    const burnTx = await privateBridge.privateBurn(params.token, {
        commitment,
        rangeProof,
        stealthPubKey: params.recipientMetaAddress.viewingPubKey,
        ephemeralPubKey,
        nullifier
    });
    
    // 7. Generate ZK proof of burn (LP-6352)
    const zkProof = await generateBurnProof(burnTx, commitment);
    
    // 8. Claim on destination chain
    await destBridge.privateClaim({
        commitment,
        nullifier,
        stealthAddress,
        ephemeralPubKey,
        rangeProof,
        zkProof
    });
    
    // 9. Return receipt for recipient to claim
    return {
        commitment,
        blinding,  // Recipient needs this to spend
        stealthAddress,
        ephemeralPubKey
    };
}

// Recipient scans for payments
async function scanPayments(privateKey: bigint) {
    const viewingKey = deriveViewingKey(privateKey);
    const announcements = await bridge.getAnnouncements();
    
    return announcements.filter(ann => {
        const sharedSecret = ecdh(viewingKey, ann.ephemeralPubKey);
        const expectedAddress = deriveStealthAddress(
            deriveSpendingPubKey(privateKey),
            sharedSecret
        );
        return expectedAddress === ann.stealthAddress;
    });
}
```

## Rationale

Bulletproofs were chosen over other range proof systems:

| System | Proof Size | Verification | Setup |
|--------|-----------|--------------|-------|
| Bulletproofs | 700 bytes | ~50k gas | None |
| Σ-protocols | 10 KB | ~200k gas | None |
| Groth16 | 128 bytes | ~200k gas | Trusted |
| STARK | 50 KB | ~500k gas | None |

Bulletproofs provide the best balance of:
- No trusted setup (unlike Groth16)
- Small proof size (unlike STARKs)
- Reasonable verification cost

Stealth addresses (EIP-5564 compatible) enable:
- Recipient privacy without interaction
- Scanning with view keys (delegatable)
- Standard address format for compatibility

## Backwards Compatibility

Private bridging is a new optional mode. Extends proof types:

```solidity
enum ProofType {
    MPC_ORACLE,      // LP-6021
    LIGHT_CLIENT,    // LP-6350 + LP-6351
    ZK_PROOF,        // LP-6352
    ZK_PRIVATE       // LP-6353 (this LP)
}
```

Users choose privacy level per transfer.

## Test Cases

1. Generate and verify valid Bulletproof range proof
2. Reject range proof for out-of-range value
3. Generate and verify stealth address derivation
4. Scan and detect incoming private payments
5. Verify commitment balance conservation (homomorphic)
6. Reject double-spend via nullifier
7. Private transfer with change output
8. Reveal private balance to public tokens

## Reference Implementation

- Bulletproofs: `/bridge/contracts/contracts/privacy/Bulletproofs.sol`
- Stealth Addresses: `/bridge/contracts/contracts/privacy/StealthAddressRegistry.sol`
- Private Bridge: `/bridge/contracts/contracts/privacy/PrivateBridge.sol`
- Private Token: `/bridge/contracts/contracts/privacy/PrivateToken.sol`
- Client SDK: `/bridge/sdk/src/privacy/`

## Security Considerations

1. **Blinding Factor Security**: Random blinding factors must use secure randomness. Reusing blinding factors leaks amounts.

2. **View Key Separation**: Separate viewing and spending keys allow delegated scanning without spending authority.

3. **Nullifier Uniqueness**: Nullifiers must be deterministically derived from commitment + chain info to prevent cross-chain replay.

4. **Commitment Soundness**: Pedersen commitments are information-theoretically hiding but computationally binding. Discrete log assumption must hold.

5. **Range Proof Completeness**: Range proofs must cover the full token range. Overflow attacks possible if range too small.

6. **Stealth Address Scanning**: View key holders can see incoming payments. Minimize view key exposure.

7. **Timing Analysis**: Private transfers may still be correlated via timing. Consider batching and delays for maximum privacy.

## References

- [Bulletproofs Paper](https://eprint.iacr.org/2017/1066)
- [EIP-5564: Stealth Addresses](https://eips.ethereum.org/EIPS/eip-5564)
- [Pedersen Commitments](https://link.springer.com/chapter/10.1007/3-540-46766-1_9)
- [Monero RingCT](https://eprint.iacr.org/2015/1098)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
