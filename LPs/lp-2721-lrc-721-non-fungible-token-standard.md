---
lp: 2721
title: LRC-721 Non-Fungible Token Standard
description: This special-numbered LP corresponds to the NFT standard on Lux, equivalent to Ethereum's ERC-721.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
updated: 2025-07-25
tags: [lrc, nft, token-standard]
activation:
  flag: lp721-lrc721-nft-standard
  hfName: ""
  activationHeight: "0"
---

> **See also**: [LP-12: C-Chain (Contract Chain) Specification](./lp-12-c-chain-contract-chain-specification.md), [LP-20: LRC-20 Fungible Token Standard](./lp-20-lrc-20-fungible-token-standard.md), [LP-1155: LRC-1155 Multi-Token Standard](./lp-1155-lrc-1155-multi-token-standard.md)

## Abstract

The LRC-721 standard defines a non-fungible token interface for the Lux Network that extends ERC-721 with AI model ownership, cryptographic provenance tracking, and privacy-preserving ownership transfers. This enhancement enables NFTs to represent trained AI models, datasets, and computational artifacts while maintaining complete lineage tracking and optional ownership privacy through zero-knowledge proofs.

## Activation

| Parameter          | Value                                           |
|--------------------|-------------------------------------------------|
| Flag string        | `lp721-lrc721-nft-standard`                     |
| Default in code    | N/A                                             |
| Deployment branch  | N/A                                             |
| Roll-out criteria  | N/A                                             |
| Back-off plan      | N/A                                             |

This LP defines how unique, non-fungible tokens are created and managed, with special emphasis on AI/ML model ownership and cryptographic provenance. LRC-721 includes the familiar interfaces: ownerOf(tokenId), transferFrom (or safeTransfer), approve/setApprovalForAll, and events like Transfer and Approval targeting individual token IDs, extended with AI model metadata, training provenance, and privacy-preserving ownership capabilities.

## Motivation

A common NFT interface ensures wallets, marketplaces, and tools interoperate seamlessly, enabling portability of digital assets across Lux dApps and infrastructure.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
## Specification

### Core NFT Interface

```solidity
interface ILRC721 {
    // Standard ERC-721 functions
    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    
    // Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
}
```

### AI Model NFT Extension

```solidity
interface ILRC721AIModel {
    struct ModelMetadata {
        string architecture;          // e.g., "transformer", "diffusion", "gan"
        bytes32 modelHash;           // IPFS/Arweave hash of model weights
        bytes32 datasetHash;         // Hash of training dataset
        uint256 trainingEpochs;      // Number of training epochs
        uint256 parameters;          // Number of model parameters
        uint256 flopsRequired;       // FLOPs required for inference
        string framework;            // "pytorch", "tensorflow", "jax"
        bytes32[] checkpointHashes;  // Historical checkpoint hashes
    }
    
    struct TrainingProvenance {
        address[] trainers;          // Addresses that contributed to training
        uint256[] contributions;     // Contribution percentages (basis points)
        bytes32 parentModelHash;     // Hash of parent model (for fine-tuning)
        uint256 trainedAt;          // Timestamp of training completion
        bytes32 verificationHash;    // Hash of training verification proof
    }
    
    // Model NFT management
    function mintModelNFT(
        address to,
        ModelMetadata calldata metadata,
        TrainingProvenance calldata provenance
    ) external returns (uint256 tokenId);
    
    function getModelMetadata(uint256 tokenId) external view returns (ModelMetadata memory);
    function getTrainingProvenance(uint256 tokenId) external view returns (TrainingProvenance memory);
    
    // Model lineage tracking
    function getModelLineage(uint256 tokenId) external view returns (uint256[] memory ancestors);
    function verifyModelAuthenticity(uint256 tokenId, bytes calldata proof) external view returns (bool);
    
    // Model licensing and royalties
    function setModelLicense(uint256 tokenId, string calldata licenseURI) external;
    function setRoyaltyInfo(uint256 tokenId, address receiver, uint96 feeNumerator) external;
    
    // Federated model updates
    function updateModelWeights(
        uint256 tokenId,
        bytes32 newModelHash,
        bytes calldata updateProof
    ) external returns (bool);
    
    // Events
    event ModelNFTMinted(uint256 indexed tokenId, bytes32 modelHash, address indexed creator);
    event ModelUpdated(uint256 indexed tokenId, bytes32 oldHash, bytes32 newHash);
    event ProvenanceVerified(uint256 indexed tokenId, address verifier);
}
```

### Privacy-Preserving Ownership Extension

```solidity
interface ILRC721Private {
    // Private ownership management
    function privateOwnerOf(uint256 tokenId) external view returns (bytes32); // Returns commitment
    function getOwnershipProof(uint256 tokenId, address claimer) external view returns (bytes memory);
    
    // Zero-knowledge ownership transfers
    function privateTransfer(
        uint256 tokenId,
        bytes calldata ownershipProof,
        bytes32 newOwnerCommitment,
        bytes32 nullifier
    ) external returns (bool);
    
    // Stealth addresses for NFT receiving
    function transferToStealth(
        uint256 tokenId,
        bytes32 stealthAddress,
        bytes calldata ephemeralPubKey
    ) external;
    
    // Selective disclosure
    function revealOwnership(
        uint256 tokenId,
        bytes calldata zkProof
    ) external returns (address owner);
    
    // Events
    event PrivateTransfer(uint256 indexed tokenId, bytes32 nullifier, bytes32 newCommitment);
    event StealthTransfer(uint256 indexed tokenId, bytes32 stealthAddress);
    event OwnershipRevealed(uint256 indexed tokenId, address owner);
}
```

### Provenance Verification Structure

```solidity
struct ProvenanceProof {
    bytes32 merkleRoot;           // Root of provenance tree
    bytes32[] merkleProof;         // Proof path
    uint256[2] aggregateSignature; // BLS aggregate signature
    address[] signers;            // Contributors who signed
    uint256 timestamp;             // Proof generation time
}
```

## Rationale

### Core Design Philosophy

The approach balances practicality with future‑proofing within the Lux ecosystem, specifically addressing the unique requirements of AI model ownership and provenance in the age of machine learning.

### AI Model NFT Rationale

The explosion of AI model development creates a need for cryptographically verifiable ownership and provenance tracking. This design draws from "Model Cards for Model Reporting" (Mitchell et al., 2019) and extends it with blockchain-based verification:

1. **Immutable Model Registry**: Every trained model becomes a unique, tradeable asset with complete training history
2. **Contribution Tracking**: Federated learning participants receive proportional ownership/royalties
3. **Lineage Preservation**: Fine-tuned models maintain references to parent models, creating a genealogy tree
4. **Verification Mechanisms**: Cryptographic proofs ensure model authenticity and prevent tampering

### Privacy Considerations

Private ownership capabilities address several critical use cases:

1. **Intellectual Property Protection**: Companies can own valuable AI models without revealing their identity
2. **Compliance**: GDPR-compliant ownership transfers without exposing personal data
3. **Market Making**: Anonymous liquidity provision for AI model marketplaces
4. **Research Collaboration**: Academic institutions can share models while maintaining attribution privacy

The design follows principles from Hopwood et al. (2016) "Zcash Protocol Specification" adapted for NFT ownership.

### Provenance Security

The provenance system ensures:

1. **Training Data Integrity**: Cryptographic hashes prevent dataset tampering
2. **Contributor Attribution**: BLS signatures aggregate multiple trainer attestations efficiently
3. **Model Evolution Tracking**: Complete history from base model to current version
4. **Regulatory Compliance**: Auditable trail for AI ethics and bias assessment

## Backwards Compatibility

Additive change with no breaking effects; rollout is optional and incremental.

## Security Considerations

### Standard NFT Security
Consider attack surfaces discussed herein; validate inputs and use safe primitives and rate‑limits where applicable.

### AI Model Security

1. **Model Poisoning Prevention**:
   - Verify training data hashes before model minting
   - Implement reputation systems for model trainers
   - Require stake/bond from contributors to incentivize honest behavior
   - Reference: Bagdasaryan et al. (2020) "How To Backdoor Federated Learning"

2. **Weight Verification**:
   - Store model hashes on-chain, weights off-chain (IPFS/Arweave)
   - Implement merkle proofs for partial weight verification
   - Use homomorphic hashing for weight update validation
   - Enable challenge-response protocols for disputed models

3. **Intellectual Property Protection**:
   - Implement watermarking schemes for model weights
   - Support encrypted model storage with key management
   - Enable time-locked reveal mechanisms for proprietary architectures

### Privacy Attack Vectors

1. **Ownership Correlation Attacks**:
   - Use different nullifiers for each transfer to prevent tracking
   - Implement mix networks or time delays for transfers
   - Rotate stealth addresses to prevent address reuse

2. **Model Extraction Attacks**:
   - Limit API access to model inference
   - Implement rate limiting and query budgets
   - Use differential privacy for model outputs (Abadi et al., 2016)

3. **Provenance Forgery**:
   - Require multi-signature attestation from known validators
   - Implement slashing for false provenance claims
   - Use TEE (Trusted Execution Environment) for training verification

## Test Cases

### AI Model NFT Tests

```javascript
describe("LRC721 AI Model NFTs", () => {
    it("should mint model NFT with complete metadata", async () => {
        const metadata = {
            architecture: "transformer",
            modelHash: keccak256("model-weights"),
            datasetHash: keccak256("training-data"),
            trainingEpochs: 100,
            parameters: 175_000_000_000, // 175B parameters
            flopsRequired: ethers.parseUnits("1", 24), // 1 YottaFLOP
            framework: "pytorch",
            checkpointHashes: [keccak256("checkpoint-1"), keccak256("checkpoint-2")]
        };
        
        const provenance = {
            trainers: [addr1, addr2, addr3],
            contributions: [5000, 3000, 2000], // 50%, 30%, 20%
            parentModelHash: bytes32(0),
            trainedAt: Date.now(),
            verificationHash: keccak256("training-proof")
        };
        
        const tokenId = await nft.mintModelNFT(owner, metadata, provenance);
        expect(await nft.ownerOf(tokenId)).to.equal(owner);
        
        const stored = await nft.getModelMetadata(tokenId);
        expect(stored.modelHash).to.equal(metadata.modelHash);
    });
    
    it("should track model lineage through fine-tuning", async () => {
        const parentId = await mintBaseModel();
        const childId = await mintFineTunedModel(parentId);
        
        const lineage = await nft.getModelLineage(childId);
        expect(lineage).to.include(parentId);
    });
    
    it("should verify model authenticity with proof", async () => {
        const tokenId = await mintModelWithProvenance();
        const proof = generateAuthenticityProof(tokenId);
        
        const isValid = await nft.verifyModelAuthenticity(tokenId, proof);
        expect(isValid).to.be.true;
    });
});
```

### Privacy Tests

```javascript
describe("LRC721 Private Ownership", () => {
    it("should transfer NFT privately with ZK proof", async () => {
        const tokenId = await mintNFT();
        const commitment = generateOwnershipCommitment(newOwner, randomness);
        const proof = generateOwnershipProof(currentOwner, tokenId);
        const nullifier = generateNullifier(currentOwner, tokenId);
        
        await nft.privateTransfer(tokenId, proof, commitment, nullifier);
        
        const privateOwner = await nft.privateOwnerOf(tokenId);
        expect(privateOwner).to.equal(commitment);
    });
    
    it("should prevent double-spending with nullifiers", async () => {
        const tokenId = await mintNFT();
        const proof = generateOwnershipProof(owner, tokenId);
        const nullifier = generateNullifier(owner, tokenId);
        const commitment = generateCommitment();
        
        await nft.privateTransfer(tokenId, proof, commitment, nullifier);
        
        // Attempt to reuse nullifier
        await expect(
            nft.privateTransfer(tokenId, proof, anotherCommitment, nullifier)
        ).to.be.revertedWith("Nullifier already used");
    });
    
    it("should enable stealth transfers", async () => {
        const tokenId = await mintNFT();
        const { stealthAddress, ephemeralKey } = generateStealthAddress(recipient);
        
        await nft.transferToStealth(tokenId, stealthAddress, ephemeralKey);
        
        // Recipient can claim with private key
        const claimed = await recoverFromStealth(stealthAddress, recipientPrivKey);
        expect(claimed).to.equal(tokenId);
    });
});
```

## Implementation

### LRC-721 Token Contracts

**Location**: `~/work/lux/standard/src/tokens/`
**GitHub**: [`github.com/luxfi/standard/tree/main/src/tokens`](https://github.com/luxfi/standard/tree/main/src/tokens)

**Core Contracts**:
- [`ERC721.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC721.sol) - Base LRC-721 implementation
- [`ERC721Enumerable.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC721Enumerable.sol) - Enumeration extension
- [`ERC721URIStorage.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC721URIStorage.sol) - Metadata URI management
- [`ERC721Burnable.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC721Burnable.sol) - Burnable NFTs

**AI Model Extension** (from specification):
- Location: `~/work/lux/standard/src/tokens/ai/`
- Contracts: `LRC721AIModel.sol`, `ProvenanceRegistry.sol`
- ZK Circuits: `circuits/ownership.circom`

**Privacy Extensions**:
- Location: `~/work/lux/standard/src/tokens/privacy/`
- Contracts: `LRC721Private.sol`, `StealthTransfer.sol`
- Integration with Ringtail ring signatures

**Testing**:
```bash
cd ~/work/lux/standard
forge test --match-contract ERC721Test
forge test --match-contract LRC721AIModelTest
forge test --match-contract LRC721PrivateTest
```

### AI Model NFT Implementation

**Model Metadata Storage**:
- On-chain: Model hash, architecture type, parameter count
- Off-chain (IPFS): Full model weights, training data hash
- Provenance: Training lineage, checkpoint hashes

**Training Verification**:
```solidity
// Example from LRC721AIModel.sol
function mintModelNFT(
    address to,
    ModelMetadata calldata metadata,
    TrainingProvenance calldata provenance
) external returns (uint256 tokenId) {
    // Verify provenance hash
    bytes32 provenanceHash = keccak256(abi.encode(provenance));
    require(verify(provenanceHash, metadata.verificationHash));

    // Mint NFT
    tokenId = _mint(to);
    modelMetadata[tokenId] = metadata;
    trainingProvenance[tokenId] = provenance;
}
```

### Privacy-Preserving Ownership

**ZK Ownership Proofs**:
- Circuit: Proves ownership without revealing owner address
- Commitment scheme: Pedersen commitments for hidden ownership
- Nullifier tracking: Prevents double-spending

**Stealth Transfers**:
```solidity
// Transfer to ephemeral stealth address
function transferToStealth(
    uint256 tokenId,
    address stealthAddress,
    bytes32 ephemeralKey
) external {
    // Only real owner can initiate
    require(ownerOf(tokenId) == msg.sender);

    // Transfer to stealth address
    _transfer(msg.sender, stealthAddress, tokenId);

    // Emit event with recovery data
    emit StealthTransfer(tokenId, ephemeralKey);
}
```

### Marketplace Integration

**OpenSea Compatibility**:
```solidity
// ERC721URIStorage provides OpenSea metadata
function tokenURI(uint256 tokenId) public view override returns (string memory) {
    return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
}
```

**Royalty Support** (EIP-2981):
```solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice)
    external view returns (address receiver, uint256 royaltyAmount)
{
    receiver = modelMetadata[tokenId].creator;
    royaltyAmount = (salePrice * royaltyBasisPoints) / 10000;
}
```

### Gas Costs

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| Mint basic NFT | ~80,000 | Standard ERC721 |
| Mint AI model NFT | ~150,000 | With metadata + provenance |
| Transfer | ~50,000 | safeTransferFrom |
| Private transfer | ~250,000 | With ZK proof verification |
| Stealth transfer | ~120,000 | With ephemeral key |
| Approve | ~45,000 | Single token approval |
| setApprovalForAll | ~46,000 | Operator approval |

## Reference Implementation

A reference implementation is available at: https://github.com/luxfi/lrc721-ai-enhanced

Key components:
- `contracts/LRC721AIModel.sol`: AI model NFT implementation
- `contracts/LRC721Private.sol`: Privacy-preserving ownership
- `contracts/ProvenanceRegistry.sol`: On-chain provenance tracking
- `circuits/ownership.circom`: ZK circuits for private ownership
- `scripts/model-verification.js`: Off-chain model authenticity verification

## References

1. Mitchell, M., et al. (2019). "Model Cards for Model Reporting." FAT* Conference.
2. Bagdasaryan, E., et al. (2020). "How To Backdoor Federated Learning." AISTATS.
3. Hopwood, D., et al. (2016). "Zcash Protocol Specification." Technical Report.
4. Abadi, M., et al. (2016). "Deep Learning with Differential Privacy." CCS.
5. Tramèr, F., et al. (2016). "Stealing Machine Learning Models via Prediction APIs." USENIX Security.
6. Adi, Y., et al. (2018). "Turning Your Weakness Into a Strength: Watermarking Deep Neural Networks by Backdooring." USENIX Security.
7. Chen, X., et al. (2021). "Dataset Security for Machine Learning: Data Poisoning, Backdoor Attacks, and Defenses." IEEE TPAMI.
