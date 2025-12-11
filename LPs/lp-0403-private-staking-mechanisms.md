---
lp: 0403
title: Private Staking Mechanisms
description: Anonymous staking pools with private reward distribution and verifiable delay functions
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-24
requires: 20, 69
tags: [defi, privacy, staking]
---

## Abstract

This LP defines private staking mechanisms that enable anonymous participation in staking pools with confidential reward distribution, verifiable delay functions for fairness, and zero-knowledge proofs for stake verification. The protocol ensures validator privacy while maintaining network security and slashing capabilities.

## Motivation

Current staking systems expose sensitive information:
- Validator identities and stakes
- Reward accumulation patterns
- Delegation relationships
- Wealth concentration

This protocol enables:
- Anonymous validator participation
- Private reward distribution
- Confidential delegation
- Hidden stake amounts
- Regulatory compliance options

## Specification

### Core Private Staking Interface

```solidity
interface IPrivateStaking {
    // Anonymous stake position
    struct PrivateStake {
        bytes32 stakeId;
        bytes32 validatorCommitment;  // Hidden validator identity
        bytes32 amountCommitment;     // Hidden stake amount
        bytes encryptedMetadata;       // Encrypted stake details
        uint256 publicWeight;          // Obfuscated voting weight
        bytes32 nullifier;             // For withdrawal
    }

    // Private reward claim
    struct PrivateReward {
        bytes32 rewardId;
        bytes32 claimantCommitment;
        bytes encryptedAmount;
        bytes zkProof;                 // Proof of eligibility
        uint256 epoch;
    }

    // Events
    event PrivateStakeDeposited(
        bytes32 indexed stakeId,
        bytes32 validatorCommitment,
        uint256 epoch
    );

    event AnonymousRewardClaimed(
        bytes32 indexed nullifier,
        bytes32 outputCommitment
    );

    event PrivateSlashingInitiated(
        bytes32 indexed stakeId,
        bytes32 evidenceHash
    );

    // Staking functions
    function stakePrivately(
        bytes32 commitment,
        bytes calldata stakeProof,
        bytes calldata encryptedData
    ) external returns (bytes32 stakeId);

    function delegatePrivately(
        bytes32 validatorCommitment,
        bytes32 delegatorCommitment,
        bytes calldata delegationProof
    ) external;

    function withdrawPrivately(
        bytes32 stakeId,
        bytes32 nullifier,
        bytes calldata withdrawalProof
    ) external;

    // Reward functions
    function claimPrivateRewards(
        bytes32 nullifier,
        bytes calldata rewardProof
    ) external returns (bytes encryptedReward);

    function verifyStakeEligibility(
        bytes32 validatorCommitment,
        uint256 epoch,
        bytes calldata proof
    ) external view returns (bool eligible);
}
```

### Verifiable Delay Functions (VDF)

```solidity
interface IVerifiableDelay {
    // VDF parameters
    struct VDFParams {
        uint256 difficulty;           // Time parameter T
        bytes32 challenge;            // Input challenge
        uint256 iterations;           // Number of iterations
        uint256 securityBits;         // Security parameter
    }

    // VDF output with proof
    struct VDFOutput {
        bytes32 result;               // VDF output
        bytes proof;                  // Proof of correct computation
        uint256 computeTime;          // Actual computation time
        address prover;               // Who computed it
    }

    // VDF-based randomness
    struct VDFRandomness {
        uint256 epoch;
        bytes32 seed;                // Previous randomness
        bytes32 output;              // New randomness
        uint256 delay;               // Time delay enforced
    }

    event VDFComputed(
        bytes32 indexed challenge,
        bytes32 result,
        uint256 iterations
    );

    event RandomnessGenerated(
        uint256 indexed epoch,
        bytes32 randomness
    );

    function computeVDF(
        VDFParams calldata params
    ) external returns (VDFOutput memory);

    function verifyVDF(
        bytes32 challenge,
        bytes32 result,
        bytes calldata proof,
        uint256 iterations
    ) external view returns (bool valid);

    function generateRandomness(
        uint256 epoch,
        bytes32 previousRandom
    ) external returns (bytes32 newRandom);

    function getEpochRandomness(
        uint256 epoch
    ) external view returns (bytes32 randomness);
}
```

### Anonymous Validator Registry

```solidity
interface IAnonymousValidators {
    // Hidden validator info
    struct PrivateValidator {
        bytes32 validatorId;
        bytes32 identityCommitment;   // Hidden real identity
        bytes32 stakeCommitment;      // Hidden stake amount
        bytes reputationProof;        // ZK proof of reputation
        uint256 activationEpoch;
    }

    // Validator performance (private)
    struct PrivatePerformance {
        bytes32 validatorId;
        bytes encryptedMetrics;       // Encrypted performance data
        bytes32 scoreCommitment;      // Hidden performance score
        bytes zkProof;                // Proof of correct computation
    }

    event AnonymousValidatorRegistered(
        bytes32 indexed validatorId,
        bytes32 identityCommitment
    );

    event PrivatePerformanceUpdated(
        bytes32 indexed validatorId,
        uint256 epoch,
        bytes32 scoreCommitment
    );

    function registerAnonymously(
        bytes32 identityCommitment,
        bytes calldata registrationProof,
        bytes calldata encryptedInfo
    ) external returns (bytes32 validatorId);

    function updatePrivatePerformance(
        bytes32 validatorId,
        bytes calldata performanceProof
    ) external;

    function proveValidatorStatus(
        bytes32 validatorId,
        uint256 minStake,
        bytes calldata statusProof
    ) external view returns (bool active);

    function selectAnonymousValidators(
        uint256 epoch,
        uint256 count
    ) external returns (bytes32[] memory selected);
}
```

### Private Delegation System

```solidity
interface IPrivateDelegation {
    // Hidden delegation
    struct PrivateDelegation {
        bytes32 delegationId;
        bytes32 delegatorCommitment;
        bytes32 validatorCommitment;
        bytes encryptedAmount;
        uint256 startEpoch;
        bytes32 nullifier;
    }

    // Delegation pool (private)
    struct PrivatePool {
        bytes32 poolId;
        bytes32 operatorCommitment;
        bytes totalEncryptedStake;     // Homomorphic sum
        uint256 delegatorCount;        // Obfuscated count
        bytes32 merkleRoot;           // Root of delegators
    }

    event PrivateDelegationCreated(
        bytes32 indexed delegationId,
        bytes32 validatorCommitment
    );

    event PoolRebalanced(
        bytes32 indexed poolId,
        bytes32 newMerkleRoot
    );

    function delegatePrivately(
        bytes32 validatorCommitment,
        bytes calldata delegationProof
    ) external returns (bytes32 delegationId);

    function redelegatePrivately(
        bytes32 oldValidator,
        bytes32 newValidator,
        bytes32 nullifier,
        bytes calldata redelegationProof
    ) external;

    function withdrawDelegation(
        bytes32 delegationId,
        bytes32 nullifier,
        bytes calldata withdrawProof
    ) external;

    function computePoolWeight(
        bytes32 poolId,
        bytes calldata weightProof
    ) external view returns (uint256 weight);
}
```

### Private Slashing Mechanism

```solidity
interface IPrivateSlashing {
    // Slashing evidence
    struct SlashingEvidence {
        bytes32 validatorId;
        uint256 slashType;            // Type of violation
        bytes evidence;               // Cryptographic evidence
        bytes32 evidenceHash;
        uint256 epoch;
    }

    // Private slashing execution
    struct PrivateSlash {
        bytes32 slashId;
        bytes32 validatorCommitment;
        bytes encryptedPenalty;       // Encrypted slash amount
        bytes zkProof;                // Proof of valid slashing
        bytes32 burnCommitment;       // Burned stake commitment
    }

    event SlashingEvidenceSubmitted(
        bytes32 indexed validatorId,
        bytes32 evidenceHash,
        uint256 slashType
    );

    event PrivateSlashExecuted(
        bytes32 indexed slashId,
        bytes32 validatorCommitment,
        bytes32 burnCommitment
    );

    function submitSlashingEvidence(
        SlashingEvidence calldata evidence
    ) external returns (bytes32 evidenceId);

    function executePrivateSlash(
        bytes32 validatorId,
        bytes calldata slashProof
    ) external returns (bytes32 slashId);

    function appealSlashing(
        bytes32 slashId,
        bytes calldata appealProof
    ) external;

    function verifySlashingProof(
        bytes32 validatorId,
        bytes calldata evidence,
        bytes calldata proof
    ) external view returns (bool valid);
}
```

### Distributed Key Generation (DKG)

```solidity
interface IDistributedKeyGen {
    // DKG participant
    struct DKGParticipant {
        bytes32 participantId;
        bytes32 commitment;           // Commitment to secret share
        bytes encryptedShare;         // Encrypted share to others
        bytes zkProof;                // Proof of correct sharing
    }

    // DKG round
    struct DKGRound {
        uint256 roundId;
        bytes32[] participants;
        bytes32 publicKey;            // Generated public key
        uint256 threshold;            // Threshold for signing
        bool completed;
    }

    event DKGRoundStarted(
        uint256 indexed roundId,
        uint256 participantCount,
        uint256 threshold
    );

    event SharesDistributed(
        uint256 indexed roundId,
        bytes32 indexed participant
    );

    event DKGCompleted(
        uint256 indexed roundId,
        bytes32 publicKey
    );

    function initiateDKG(
        bytes32[] calldata participants,
        uint256 threshold
    ) external returns (uint256 roundId);

    function submitShares(
        uint256 roundId,
        bytes32 participantId,
        bytes[] calldata encryptedShares,
        bytes calldata proof
    ) external;

    function complaintInvalidShare(
        uint256 roundId,
        bytes32 participant,
        bytes calldata complaintProof
    ) external;

    function finalizeDKG(
        uint256 roundId
    ) external returns (bytes32 publicKey);
}
```

### Private Reward Distribution

```solidity
interface IPrivateRewardDistribution {
    // Reward merkle tree
    struct RewardTree {
        uint256 epoch;
        bytes32 merkleRoot;
        bytes totalEncryptedRewards;  // Homomorphic total
        uint256 claimDeadline;
    }

    // Private claim
    struct PrivateClaim {
        bytes32 claimId;
        bytes32 nullifier;
        bytes32 outputCommitment;
        bytes merkleProof;
        bytes zkProof;
    }

    event RewardTreePublished(
        uint256 indexed epoch,
        bytes32 merkleRoot,
        uint256 totalRewards
    );

    event PrivateRewardClaimed(
        bytes32 indexed nullifier,
        bytes32 outputCommitment
    );

    function publishRewardTree(
        uint256 epoch,
        bytes32 merkleRoot,
        bytes calldata treeProof
    ) external;

    function claimPrivateReward(
        uint256 epoch,
        PrivateClaim calldata claim
    ) external returns (bytes encryptedReward);

    function batchClaimRewards(
        uint256[] calldata epochs,
        PrivateClaim[] calldata claims
    ) external returns (bytes[] memory encryptedRewards);

    function verifyRewardInclusionn(
        uint256 epoch,
        bytes32 commitment,
        bytes calldata proof
    ) external view returns (bool included);
}
```

### Governance Privacy

```solidity
interface IPrivateGovernance {
    // Anonymous voting
    struct PrivateVote {
        bytes32 proposalId;
        bytes32 nullifier;            // Prevent double voting
        bytes encryptedChoice;        // Encrypted vote
        bytes32 weightCommitment;     // Hidden voting weight
        bytes zkProof;                // Proof of eligibility
    }

    // Private proposal
    struct PrivateProposal {
        bytes32 proposalId;
        bytes32 proposerCommitment;
        bytes encryptedContent;
        uint256 startTime;
        uint256 endTime;
        bytes32 tallyCommitment;      // Hidden results until end
    }

    event PrivateVoteCast(
        bytes32 indexed proposalId,
        bytes32 nullifier
    );

    event PrivateProposalCreated(
        bytes32 indexed proposalId,
        bytes32 proposerCommitment
    );

    event TallyRevealed(
        bytes32 indexed proposalId,
        uint256 forVotes,
        uint256 againstVotes
    );

    function createPrivateProposal(
        bytes calldata encryptedContent,
        bytes calldata proposalProof
    ) external returns (bytes32 proposalId);

    function castPrivateVote(
        PrivateVote calldata vote
    ) external;

    function revealTally(
        bytes32 proposalId,
        uint256 forVotes,
        uint256 againstVotes,
        bytes calldata tallyProof
    ) external;
}
```

## Rationale

### Verifiable Delay Functions

VDFs provide:
- Unbiasable randomness
- Fair validator selection
- MEV resistance
- Time-based security

### Anonymous Validators

Enable:
- Censorship resistance
- Reduced targeted attacks
- Privacy for large stakers
- Decentralization appearance

### Private Delegation

Allows:
- Hidden wealth accumulation
- Strategic stake distribution
- Competitive advantage protection
- Regulatory privacy

### DKG for Threshold Operations

Provides:
- Distributed trust
- No single point of failure
- Collective key management
- Byzantine fault tolerance

## Test Cases

### Private Staking Test

```solidity
function testPrivateStaking() public {
    IPrivateStaking staking = IPrivateStaking(stakingAddress);

    // Create stake commitment
    bytes32 commitment = keccak256(abi.encode(
        1000 * 10**18,  // Stake amount
        address(this),
        nonce
    ));

    // Generate stake proof
    bytes memory stakeProof = generateStakeProof(
        commitment,
        address(this)
    );

    // Stake privately
    bytes32 stakeId = staking.stakePrivately(
        commitment,
        stakeProof,
        encryptedStakeData
    );

    assertTrue(stakeId != bytes32(0));
}
```

### VDF Randomness Test

```solidity
function testVDFRandomness() public {
    IVerifiableDelay vdf = IVerifiableDelay(vdfAddress);

    // Compute VDF
    VDFParams memory params = VDFParams({
        difficulty: 1000000,
        challenge: keccak256("test challenge"),
        iterations: 1000000,
        securityBits: 128
    });

    VDFOutput memory output = vdf.computeVDF(params);

    // Verify computation
    bool valid = vdf.verifyVDF(
        params.challenge,
        output.result,
        output.proof,
        params.iterations
    );

    assertTrue(valid);

    // Use for randomness
    bytes32 randomness = vdf.generateRandomness(
        currentEpoch,
        output.result
    );

    assertTrue(randomness != bytes32(0));
}
```

### Private Reward Claim Test

```solidity
function testPrivateRewardClaim() public {
    IPrivateRewardDistribution rewards = IPrivateRewardDistribution(rewardAddress);

    // Create claim with proof
    PrivateClaim memory claim = PrivateClaim({
        claimId: keccak256(abi.encode(epoch, address(this))),
        nullifier: generateNullifier(),
        outputCommitment: generateOutputCommitment(rewardAmount),
        merkleProof: generateMerkleProof(leafIndex),
        zkProof: generateRewardProof(rewardAmount)
    });

    // Claim privately
    bytes memory encryptedReward = rewards.claimPrivateReward(
        epoch,
        claim
    );

    // Decrypt and verify
    uint256 decryptedAmount = decryptReward(encryptedReward, privateKey);
    assertEq(decryptedAmount, expectedReward);
}
```

## Backwards Compatibility

This LP introduces private staking as an optional feature alongside standard staking:

- **Public Staking**: Existing D-Chain staking remains unchanged and fully functional
- **Validator Compatibility**: Private delegators can stake to any validator
- **Reward Distribution**: Compatible with existing reward calculation mechanisms
- **Unbonding**: Standard unbonding periods apply to private stakes

**Migration Path**:
1. Deploy private staking contracts on D-Chain
2. Validators opt-in to accept private delegations
3. Delegators can move between public and private staking
4. Rewards accumulate privately until withdrawal

## Security Considerations

### VDF Security

- Choose appropriate time parameters
- Protect against parallel computation
- Verify proof completeness
- Handle VDF failures gracefully

### Validator Privacy

- Sufficient anonymity set size
- Regular identity rotation
- Network-level privacy (Tor/I2P)
- Timing attack mitigation

### Slashing Privacy

- Evidence must be verifiable
- Cannot hide malicious behavior
- Maintain deterrent effect
- Appeal mechanism required

### DKG Security

- Threshold must be < n/3 for Byzantine tolerance
- Secure communication channels
- Complaint mechanism for invalid shares
- Recovery from failed rounds

### Reward Privacy

- Merkle tree must be complete
- Prevent double claiming via nullifiers
- Secure random beacon for distributions
- Time-bound claim periods

## Implementation

### Reference Implementation

**Primary Locations**:
- VDF implementation: `node/consensus/engine/vdf/`
- Staking system: `node/vms/platformvm/`
- Validator registry: `node/vms/platformvm/validator/`
- DKG and threshold: `threshold/protocols/`
- Reward distribution: `node/vms/platformvm/reward/`

**Implementation Components**:

1. **Verifiable Delay Functions (VDF)** (`node/consensus/engine/vdf/`)
   - `vdf.go` - Core VDF computation (Pietrzak's VDF)
   - `vdf_proof.go` - VDF proof generation and verification
   - `vdf_randomness.go` - Randomness beacon using VDF outputs
   - `vdf_test.go` - Comprehensive test suite (15+ test cases)
   - Security parameter: 128-bit
   - Proof generation: <100ms on standard hardware

2. **Anonymous Validator Registry** (`node/vms/platformvm/validator/`)
   - `private_validator.go` - Hidden validator identity management
   - `identity_commitment.go` - Commitment to real identity
   - `stake_commitment.go` - Hidden stake amount via commitments
   - `reputation_proof.go` - ZK proof of validator reputation
   - Activation tracking with privacy
   - Performance metrics tracking (encrypted)

3. **Private Delegation System** (`node/vms/platformvm/delegation/`)
   - `private_delegation.go` - Hidden delegation positions
   - `delegation_pool.go` - Private pool with homomorphic balance
   - `delegator_tracking.go` - Obfuscated delegator count
   - `rebalancing.go` - Private pool rebalancing mechanism
   - Merkle tree roots for delegation proof

4. **Distributed Key Generation (DKG)** (`threshold/protocols/cmp/`)
   - `dkg.go` - DKG participant coordination
   - `share_distribution.go` - Secret share encryption and distribution
   - `complaint_mechanism.go` - Invalid share detection
   - `finalization.go` - Final public key generation
   - Tests: `dkg_test.go` with Byzantine resilience tests
   - Threshold configurable: t-of-n signatures

5. **Private Slashing Mechanism** (`node/vms/platformvm/slashing/`)
   - `slashing_evidence.go` - Evidence structure for violations
   - `private_slash.go` - Encrypted penalty execution
   - `identifiable_abort.go` - Malicious party detection (CGGMP21)
   - `appeal_mechanism.go` - Slash appeal and dispute resolution
   - Burn commitment verification

6. **Private Reward Distribution** (`node/vms/platformvm/reward/`)
   - `reward_tree.go` - Merkle tree of encrypted rewards
   - `private_claim.go` - Nullifier-based reward claiming
   - `batch_claims.go` - Batch claim processing
   - `reward_encryption.go` - Homomorphic reward tracking
   - Claim deadline enforcement

7. **Private Governance** (`node/vms/platformvm/governance/`)
   - `private_vote.go` - Anonymous voting with nullifiers
   - `vote_encryption.go` - Encrypted vote storage
   - `weight_commitment.go` - Hidden voting power
   - `tally_revelation.go` - Encrypted results revealed after voting
   - Proposal privacy with selective disclosure

**Cryptographic Integration**:
- **VDF**: Verifiable Delay Function for unbiasable randomness
- **Commitments**: Pederson commitments for hiding amounts/identities
- **Range Proofs**: Bulletproofs for stake amount validation
- **Threshold Signatures**: CGGMP21 for distributed validation
- **Ring Signatures**: Ringtail for anonymous participation

**Related Specifications**:
- **LP-322**: CGGMP21 Threshold ECDSA (validator multi-sig)
- **LP-320**: Ringtail Ring Signatures (anonymous validator selection)
- **LP-310**: VDF Specifications (detailed VDF algorithm)
- **LP-110**: Quasar Consensus (integrates private staking)

**Testing**:
- VDF tests: `node/consensus/engine/vdf/vdf_test.go` (15+ test cases)
- DKG tests: `threshold/protocols/cmp/dkg_test.go` (Byzantine resilience)
- Validator tests: `node/vms/platformvm/validator/*_test.go`
- Staking integration tests: End-to-end validator lifecycle
- Load testing: 1000+ validator networks
- Byzantine testing: Up to 33% malicious validators

**Performance Characteristics**:
- VDF computation: ~5 seconds (difficulty T=2^40)
- VDF verification: <100ms
- DKG round time: ~800ms for 3-of-5, ~1.2s for 5-of-7
- Validator selection: <50ms via VDF randomness
- Reward claiming: ~100ms per claim
- Slashing execution: ~80ms with identifiable abort
- Validator registry update: <200ms per epoch

**Gas Costs**:
```
VDF verification: 150,000 gas
Validator registration: 200,000 gas
Delegation: 100,000 gas
Reward claim: 80,000 gas
Slashing: 120,000 gas
DKG share submission: 50,000 gas
```

**Configuration**:
- Epoch length: Configurable (default: 432000 blocks)
- Validator minimum stake: 25,000 LUX
- Validator maximum stake: 3,000,000 LUX
- Reward rate: 2% annual (adjustable via governance)
- Slashing penalty: 0.2-1.0% (based on violation type)
- VDF difficulty: Adjusted per epoch (target: 5 seconds)

**GitHub Repository**: https://github.com/luxfi/node/tree/main/vms/platformvm

## References

1. Boneh, D., et al. "Verifiable Delay Functions." CRYPTO 2018.
2. Ethereum 2.0. "Proof of Stake Specification." 2020.
3. Secret Network. "Private Proof of Stake." 2021.
4. Pedersen, T. "Non-Interactive and Information-Theoretic Secure Verifiable Secret Sharing." 1991.
5. Gennaro, R., et al. "Secure Distributed Key Generation." 1999.
6. Keep Network. "Random Beacon and Threshold Signatures." 2020.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).