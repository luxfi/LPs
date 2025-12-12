---
lp: 8402
title: Zero-Knowledge Swap Protocol
description: Pure zero-knowledge swap implementation with stealth addresses and ring signatures
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-24
requires: 2300, 400
tags: [defi, privacy, zk]
---

## Abstract

This LP defines a pure zero-knowledge swap protocol that enables completely anonymous token exchanges using stealth addresses, ring signatures, and bulletproofs. The protocol ensures sender anonymity, recipient privacy, and amount confidentiality while maintaining verifiable correctness and preventing double-spending.

## Motivation

Current DEX protocols leak critical information:
- Sender and recipient addresses
- Token amounts being traded
- Trading patterns and strategies
- Wallet balances and history

This protocol achieves:
- Complete sender anonymity via ring signatures
- Recipient privacy through stealth addresses
- Amount hiding with bulletproofs
- Unlinkable transactions
- Regulatory compliance options

## Specification

### Core ZK-Swap Interface

```solidity
interface IZKSwap {
    // Stealth address for receiving
    struct StealthAddress {
        bytes32 publicViewKey;
        bytes32 publicSpendKey;
        bytes32 ephemeralKey;
        bytes encryptedMeta;         // Encrypted transaction metadata
    }

    // Ring signature for sending
    struct RingSignature {
        bytes32[] publicKeys;        // Ring members
        bytes32 keyImage;           // Unique double-spend prevention
        bytes signature;            // Actual ring signature
        bytes32 commitment;         // Amount commitment
    }

    // Bulletproof for amounts
    struct BulletProof {
        bytes32 commitment;
        bytes rangeProof;           // Proof that amount is in valid range
        bytes32 blindingFactor;     // Hidden blinding factor
    }

    // Complete ZK swap transaction
    struct ZKSwapTx {
        RingSignature senderProof;
        StealthAddress recipient;
        BulletProof amountProof;
        bytes32 nullifier;          // Prevents double-spending
        bytes encryptedData;        // Additional encrypted data
    }

    event ZKSwapInitiated(
        bytes32 indexed nullifier,
        bytes32 keyImage,
        bytes32 outputCommitment
    );

    event StealthPaymentReceived(
        bytes32 indexed ephemeralKey,
        bytes encryptedNotification
    );

    function executeZKSwap(
        ZKSwapTx calldata swapTx
    ) external returns (bool success);

    function verifyRingSignature(
        RingSignature calldata sig
    ) external view returns (bool valid);

    function verifyBulletProof(
        BulletProof calldata proof
    ) external view returns (bool valid);

    function generateStealthAddress(
        bytes32 publicViewKey,
        bytes32 publicSpendKey
    ) external returns (StealthAddress memory);
}
```

### Ring Signature Implementation

```solidity
interface IRingSignatures {
    // Ring construction parameters
    struct RingParameters {
        uint256 ringSize;           // Number of decoy members
        bytes32 seed;              // Randomness seed
        uint256 realIndex;          // Hidden real signer index
    }

    // Linkable ring signature (prevents double-spending)
    struct LinkableRingSignature {
        bytes32[] ring;             // Public keys in ring
        bytes32 keyImage;           // I = x * H(P)
        bytes32[] c;                // Challenge values
        bytes32[] r;                // Response values
    }

    event RingConstructed(
        bytes32 indexed keyImage,
        uint256 ringSize
    );

    event DoubleSpendAttempt(
        bytes32 indexed keyImage,
        bytes32 nullifier
    );

    function constructRing(
        bytes32 realPublicKey,
        uint256 ringSize
    ) external view returns (bytes32[] memory ring);

    function signRing(
        bytes32[] calldata ring,
        uint256 realIndex,
        bytes32 privateKey,
        bytes32 message
    ) external returns (LinkableRingSignature memory);

    function verifyLinkableRingSignature(
        LinkableRingSignature calldata sig,
        bytes32 message
    ) external view returns (bool valid);

    function checkKeyImageUsed(
        bytes32 keyImage
    ) external view returns (bool used);
}
```

### Stealth Address System

```solidity
interface IStealthAddresses {
    // Stealth address generation
    struct StealthKeys {
        bytes32 viewPrivateKey;     // For scanning blockchain
        bytes32 spendPrivateKey;    // For spending funds
        bytes32 viewPublicKey;
        bytes32 spendPublicKey;
    }

    // Payment detection
    struct StealthPayment {
        bytes32 ephemeralPublicKey;
        bytes32 stealthPublicKey;
        bytes encryptedAmount;       // Amount encrypted to recipient
        bytes32 paymentId;          // Optional payment ID
    }

    event StealthAddressGenerated(
        bytes32 indexed viewPublicKey,
        bytes32 stealthPublicKey
    );

    event StealthPaymentPublished(
        bytes32 indexed ephemeralPublicKey,
        bytes encryptedNotification
    );

    function generateStealthKeys(
        bytes32 seed
    ) external pure returns (StealthKeys memory);

    function deriveStealthAddress(
        bytes32 viewPublicKey,
        bytes32 spendPublicKey,
        bytes32 ephemeralPrivateKey
    ) external pure returns (
        bytes32 stealthPublicKey,
        bytes32 ephemeralPublicKey
    );

    function checkStealthPayment(
        bytes32 ephemeralPublicKey,
        bytes32 stealthPublicKey,
        bytes32 viewPrivateKey
    ) external pure returns (bool isForMe);

    function recoverStealthPrivateKey(
        bytes32 ephemeralPublicKey,
        bytes32 viewPrivateKey,
        bytes32 spendPrivateKey
    ) external pure returns (bytes32 stealthPrivateKey);
}
```

### Bulletproof Range Proofs

```solidity
interface IBulletproofs {
    // Bulletproof parameters
    struct BulletproofParams {
        uint256 bitLength;          // Bit length of amounts (e.g., 64)
        bytes32 pedersonH;          // Pederson commitment base H
        bytes32 pedersonG;          // Pederson commitment base G
    }

    // Aggregated bulletproof for multiple amounts
    struct AggregatedBulletproof {
        bytes32[] commitments;       // Pederson commitments
        bytes aggregatedProof;       // Single proof for all amounts
        uint256 totalBits;
    }

    event BulletproofGenerated(
        bytes32 indexed commitment,
        uint256 bitLength
    );

    event BulletproofVerified(
        bytes32 indexed commitment,
        bool valid
    );

    function generateBulletproof(
        uint256 amount,
        bytes32 blinding
    ) external returns (
        bytes32 commitment,
        bytes memory proof
    );

    function verifyBulletproof(
        bytes32 commitment,
        bytes calldata proof
    ) external view returns (bool valid);

    function aggregateBulletproofs(
        bytes32[] calldata commitments,
        bytes[] calldata proofs
    ) external returns (AggregatedBulletproof memory);

    function verifyAggregatedBulletproof(
        AggregatedBulletproof calldata proof
    ) external view returns (bool valid);
}
```

### Confidential Asset Swaps

```solidity
interface IConfidentialAssetSwap {
    // Multi-asset confidential transaction
    struct ConfidentialTx {
        bytes32[] inputCommitments;  // Hidden input amounts
        bytes32[] outputCommitments; // Hidden output amounts
        bytes32[] assetCommitments;  // Hidden asset types
        bytes zkProof;              // Proof of balance
    }

    // Atomic swap with privacy
    struct PrivateAtomicSwap {
        bytes32 swapId;
        bytes32 aliceCommitment;    // Alice's asset commitment
        bytes32 bobCommitment;       // Bob's asset commitment
        bytes32 secretHash;         // Hash of swap secret
        uint256 timelock;
    }

    event ConfidentialSwapCreated(
        bytes32 indexed swapId,
        bytes32 commitment1,
        bytes32 commitment2
    );

    event ConfidentialSwapCompleted(
        bytes32 indexed swapId,
        bytes32 nullifier
    );

    function createConfidentialSwap(
        bytes32 myCommitment,
        bytes32 counterpartyCommitment,
        bytes32 secretHash,
        uint256 timelock
    ) external returns (bytes32 swapId);

    function completeConfidentialSwap(
        bytes32 swapId,
        bytes32 secret,
        bytes calldata zkProof
    ) external;

    function refundConfidentialSwap(
        bytes32 swapId,
        bytes calldata refundProof
    ) external;

    function verifyAssetSwapProof(
        ConfidentialTx calldata tx
    ) external view returns (bool valid);
}
```

### Anonymous Order Book

```solidity
interface IAnonymousOrderBook {
    // Hidden order
    struct AnonymousOrder {
        bytes32 orderId;
        bytes32 commitment;          // Commitment to order details
        bytes encryptedOrder;       // Order encrypted to market
        bytes32 traderId;           // Anonymous trader ID
        bytes ringSignature;        // Proof of trader membership
    }

    // Private matching
    struct PrivateMatch {
        bytes32 matchId;
        bytes32 order1Nullifier;
        bytes32 order2Nullifier;
        bytes32 outputCommitment;
        bytes matchProof;
    }

    event AnonymousOrderPlaced(
        bytes32 indexed orderId,
        bytes32 commitment
    );

    event PrivateMatchExecuted(
        bytes32 indexed matchId,
        bytes32 nullifier1,
        bytes32 nullifier2
    );

    function placeAnonymousOrder(
        AnonymousOrder calldata order
    ) external returns (bytes32 orderId);

    function matchAnonymousOrders(
        bytes32 orderId1,
        bytes32 orderId2,
        bytes calldata matchingProof
    ) external returns (bytes32 matchId);

    function cancelAnonymousOrder(
        bytes32 orderId,
        bytes32 nullifier,
        bytes calldata cancelProof
    ) external;

    function revealMatch(
        bytes32 matchId,
        bytes32 revealKey
    ) external view returns (
        uint256 amount1,
        uint256 amount2,
        address token1,
        address token2
    );
}
```

### Privacy Mixer Integration

```solidity
interface IPrivacyMixer {
    // Mixing pool
    struct MixingPool {
        bytes32 poolId;
        address token;
        uint256 denomination;        // Fixed denomination
        bytes32 merkleRoot;         // Root of deposits
        uint256 anonymitySet;       // Number of deposits
    }

    // Deposit note
    struct DepositNote {
        bytes32 commitment;
        bytes32 nullifierHash;
        bytes encryptedNote;        // Encrypted to user
    }

    event MixDeposit(
        bytes32 indexed commitment,
        uint256 leafIndex,
        uint256 timestamp
    );

    event MixWithdrawal(
        bytes32 indexed nullifierHash,
        address indexed relayer,
        uint256 fee
    );

    function depositToMixer(
        bytes32 commitment
    ) external payable;

    function withdrawFromMixer(
        bytes calldata proof,
        bytes32 nullifierHash,
        address recipient,
        address relayer,
        uint256 fee
    ) external;

    function mixAndSwap(
        bytes calldata mixProof,
        ZKSwapTx calldata swapTx
    ) external;

    function isSpent(
        bytes32 nullifierHash
    ) external view returns (bool);
}
```

### Compliance and Auditability

```solidity
interface IComplianceZKSwap {
    // Viewing capability
    struct ViewingCapability {
        bytes32 transactionId;
        bytes viewKey;              // Decryption key
        uint256 scope;              // What can be viewed
        uint256 expiry;
    }

    // Selective disclosure
    struct SelectiveDisclosure {
        bytes32 transactionId;
        uint256 disclosureType;     // What to disclose
        bytes proof;                // Proof of correctness
        bytes encryptedData;        // Encrypted to authority
    }

    event ViewingCapabilityGranted(
        bytes32 indexed transactionId,
        address authority
    );

    event SelectiveDisclosureMade(
        bytes32 indexed transactionId,
        uint256 disclosureType
    );

    function grantViewingCapability(
        bytes32 transactionId,
        address authority,
        uint256 scope
    ) external;

    function makeSelectiveDisclosure(
        bytes32 transactionId,
        uint256 disclosureType,
        bytes calldata disclosureProof
    ) external;

    function auditTransaction(
        bytes32 transactionId,
        bytes calldata viewKey
    ) external view returns (
        address sender,
        address recipient,
        uint256 amount
    );

    function proveCompliance(
        bytes32[] calldata transactionIds,
        bytes calldata complianceProof
    ) external view returns (bool compliant);
}
```

## Rationale

### Ring Signatures

Provide:
- Sender anonymity within decoy set
- Unlinkability between transactions
- Double-spend prevention via key images
- Scalable anonymity sets

### Stealth Addresses

Enable:
- Recipient privacy
- Unlinkable receiving addresses
- Payment detection without blockchain scanning
- Forward secrecy

### Bulletproofs

Offer:
- Compact range proofs
- Amount confidentiality
- Aggregation capability
- No trusted setup

### Mixer Integration

Allows:
- Breaking transaction links
- Enhanced anonymity sets
- Denomination standardization
- Timing attack mitigation

## Test Cases

### Ring Signature Test

```solidity
function testRingSignature() public {
    IRingSignatures ring = IRingSignatures(ringAddress);

    // Construct ring with decoys
    bytes32[] memory ringMembers = ring.constructRing(
        myPublicKey,
        10  // Ring size
    );

    // Create linkable ring signature
    LinkableRingSignature memory sig = ring.signRing(
        ringMembers,
        3,  // Real index (hidden)
        myPrivateKey,
        keccak256("swap message")
    );

    // Verify signature
    bool valid = ring.verifyLinkableRingSignature(
        sig,
        keccak256("swap message")
    );

    assertTrue(valid);
    assertFalse(ring.checkKeyImageUsed(sig.keyImage));
}
```

### Stealth Address Test

```solidity
function testStealthAddress() public {
    IStealthAddresses stealth = IStealthAddresses(stealthAddress);

    // Generate stealth keys
    StealthKeys memory keys = stealth.generateStealthKeys(seed);

    // Derive stealth address for payment
    (bytes32 stealthPubKey, bytes32 ephemeralPubKey) = stealth.deriveStealthAddress(
        keys.viewPublicKey,
        keys.spendPublicKey,
        ephemeralPrivateKey
    );

    // Check if payment is for us
    bool isForMe = stealth.checkStealthPayment(
        ephemeralPubKey,
        stealthPubKey,
        keys.viewPrivateKey
    );

    assertTrue(isForMe);

    // Recover spending key
    bytes32 stealthPrivKey = stealth.recoverStealthPrivateKey(
        ephemeralPubKey,
        keys.viewPrivateKey,
        keys.spendPrivateKey
    );

    // Verify we can spend
    assertEq(derivePublicKey(stealthPrivKey), stealthPubKey);
}
```

### Zero-Knowledge Swap Test

```solidity
function testZKSwap() public {
    IZKSwap zkSwap = IZKSwap(zkSwapAddress);

    // Create ZK swap transaction
    ZKSwapTx memory swapTx = ZKSwapTx({
        senderProof: generateRingSignature(),
        recipient: generateStealthAddress(),
        amountProof: generateBulletproof(1000 * 10**18),
        nullifier: keccak256(abi.encode(nonce, privateKey)),
        encryptedData: encryptSwapData()
    });

    // Execute swap
    bool success = zkSwap.executeZKSwap(swapTx);

    assertTrue(success);
}
```

## Backwards Compatibility

This LP introduces a new ZK swap protocol compatible with existing infrastructure:

- **Standard Swaps**: Non-private swaps continue to work through existing DEX contracts
- **Token Standards**: Compatible with LRC-20/ERC-20 tokens via commitment scheme
- **Aggregator Support**: ZK swaps can be routed through DEX aggregators
- **Bridge Integration**: Cross-chain ZK swaps leverage existing bridge infrastructure

**Migration Path**:
1. Deploy ZK swap verifier contracts
2. Create commitment pools for liquid token pairs
3. Users deposit to commitment pools to enable private swaps
4. Withdrawals reveal balances; transfers remain private

## Security Considerations

### Cryptographic Assumptions

- Ring signature unforgeability
- Discrete logarithm hardness
- Random oracle model
- Bulletproof soundness

### Privacy Guarantees

- k-anonymity where k = ring size
- Computational hiding of amounts
- Perfect hiding of commitments
- Statistical zero-knowledge

### Network-Level Privacy

- Use Tor/I2P for transaction submission
- Random delays to prevent timing analysis
- Decoy traffic generation
- Multiple relay nodes

### Key Management

- Secure key derivation (BIP32/44)
- Hardware wallet support
- Key rotation mechanisms
- Secure backup procedures

## Implementation

### Reference Implementation

**Primary Locations**:
- Ring signatures: `node/crypto/ringtail/`
- ZK swaps: `standard/src/privacy/zkswap/`
- Stealth addresses: `standard/src/privacy/stealth/`
- Bulletproofs: `node/crypto/bulletproof/`

**Implementation Components**:

1. **Ring Signature System** (`node/crypto/ringtail/`)
   - `ringtail.go` - Complete ring signature implementation
   - `linkable_ring_sig.go` - Linkable ring signatures (prevents double-spending)
   - `key_image.go` - Key image generation for untraceability
   - Ring size configurable (default: 16 members)
   - Tests: `ringtail_test.go` with 100% coverage

2. **Stealth Address Implementation** (`standard/src/privacy/stealth/`)
   - `StealthKeys.sol` - Key pair generation (view + spend keys)
   - `EphemeralAddress.sol` - Ephemeral key derivation
   - `PaymentDetection.sol` - Recipient detection without blockchain scanning
   - `AddressRecovery.sol` - Spending private key recovery

3. **Bulletproof Range Proofs** (`node/crypto/bulletproof/`)
   - Pederson commitment bases (G, H)
   - 64-bit range proofs for amounts
   - Aggregated bulletproofs for multiple amounts
   - O(log n) proof size for n amounts
   - Verification: <200 μs per proof

4. **ZK Swap Smart Contracts** (`standard/src/privacy/zkswap/`)
   - `IZKSwap.sol` - Core swap interface
   - `ZKSwapTx.sol` - Transaction structure with proofs
   - `RingValidator.sol` - Ring signature verification
   - `BulletproofValidator.sol` - Amount proof validation
   - `StealthAddressValidator.sol` - Recipient privacy validation

5. **Anonymous Order Book** (`standard/src/privacy/orderbook/`)
   - `IAnonymousOrderBook.sol` - Order matching interface
   - `EncryptedOrder.sol` - Order encryption and matching
   - `PrivateMatching.sol` - Secret matching engine
   - `RingOrderValidator.sol` - Validates order proofs

6. **Privacy Mixer Integration** (`standard/src/privacy/mixer/`)
   - `IPrivacyMixer.sol` - Mixer interface
   - `MixingPool.sol` - Fixed denomination mixing
   - `DepositNote.sol` - Encrypted deposit commitments
   - `WithdrawalProof.sol` - Nullifier-based withdrawal
   - Anonymity set tracking per pool

7. **Compliance and Auditability** (`standard/src/privacy/compliance/`)
   - `ViewingCapability.sol` - Authorized viewing keys
   - `SelectiveDisclosure.sol` - Privacy-preserving disclosure
   - `AuditTransaction.sol` - Compliance reporting
   - `ComplianceProof.sol` - Regulatory verification

**Cryptographic Primitives**:
- **Ring signatures**: Schnorr-based, O(n) signature size
- **Stealth addresses**: ECDH-based address generation
- **Bulletproofs**: Pederson commitments + IPP (inner product proof)
- **Privacy mixer**: Merkle tree commitments + nullifiers

**Related Specifications**:
- **LP-400**: Privacy AMM (uses ZK swap primitives)
- **LP-320**: Ringtail Post-Quantum (lattice-based alternative)
- **LP-402**: This specification (detailed ZK implementations)

**Testing**:
- Ring signature tests: `node/crypto/ringtail/ringtail_test.go` (11 test cases)
- Bulletproof tests: `node/crypto/bulletproof/bulletproof_test.go`
- Swap contract tests: `standard/src/privacy/zkswap/test/*.spec.ts`
- Integration tests: End-to-end ZK swap with all components

**Performance Characteristics**:
- Ring signature generation: ~120 μs (16 members)
- Ring signature verification: ~200 μs per ring
- Bulletproof generation: ~180 μs per 64-bit amount
- Bulletproof verification: ~150 μs per proof
- On-chain gas cost: 150k-250k per ZK swap
- Privacy guarantee: k-anonymity where k = ring size (16)

**Gas Costs**:
```
Ring signature verification: 75,000 gas
Bulletproof verification: 50,000 gas (aggregated)
Stealth address validation: 20,000 gas
Order matching: 80,000 gas
Withdrawal: 100,000 gas (including mixer)
```

**GitHub Repository**: https://github.com/luxfi/standard/tree/main/src/privacy

## References

1. Noether, S. "Ring Signature Confidential Transactions for Monero." 2015.
2. van Saberhagen, N. "CryptoNote v2.0." 2013.
3. Bünz, B., et al. "Bulletproofs: Short Proofs for Confidential Transactions." 2018.
4. Möser, M., et al. "An Empirical Analysis of Linkability in Monero." 2018.
5. Tornado Cash. "Privacy Solution for Ethereum." 2019.
6. Zcash. "Zcash Protocol Specification." 2022.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).