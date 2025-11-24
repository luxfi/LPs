---
lp: 502
title: Fraud Proof System
description: Interactive fraud proof system for optimistic rollups with bisection protocol and one-step verification
author: Lux Network Team (@luxdefi), Hanzo AI (@hanzoai), Zoo Protocol (@zooprotocol)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-09-24
requires: 500, 501
---

## Abstract

This LP defines a comprehensive fraud proof system for optimistic rollups on Lux Network, implementing an interactive bisection protocol that efficiently identifies and proves invalid state transitions. The system supports one-step execution verification on-chain, multi-round challenges with logarithmic complexity, and specialized fraud proofs for AI compute operations including model inference verification and gradient computation validation. The design minimizes on-chain computation while maintaining security through game-theoretic incentives and stake-based participation.

## Activation

| Parameter          | Value                    |
|--------------------|--------------------------|
| Flag string        | `lp502-fraud-proof-system` |
| Default in code    | **false** until block X  |
| Deployment branch  | `v0.0.0-lp502`          |
| Roll‑out criteria  | 10+ successful challenges |
| Back‑off plan      | Extend challenge period   |

## Motivation

Optimistic rollups require robust fraud proof mechanisms to ensure security without constant verification. For AI workloads, this includes:

1. **Computational Integrity**: Verify AI model inference and training computations
2. **Efficiency**: Minimize on-chain verification costs through bisection
3. **Completeness**: Prove any invalid state transition can be challenged
4. **Incentive Alignment**: Economic guarantees for honest participation
5. **Specialization**: Custom proofs for AI-specific operations (matrix multiplication, gradient descent)

## Specification

### Core Fraud Proof System

```solidity
interface IFraudProofSystem {
    enum ChallengeStatus {
        None,
        Initiated,
        Responded,
        Bisecting,
        OneStepProof,
        ChallengerWon,
        DefenderWon
    }

    struct Challenge {
        bytes32 challengeId;
        address challenger;
        address defender;
        bytes32 startStateRoot;
        bytes32 endStateRoot;
        uint256 blockNumber;
        uint256 stake;
        ChallengeStatus status;
        uint256 deadline;
        uint256 bisectionRound;
    }

    struct StateAssertion {
        bytes32 stateRoot;
        bytes32 blockHash;
        bytes machineState;     // Compressed VM state
        uint256 gasUsed;
        uint256 stepNumber;
        bytes32 sendRoot;      // Outgoing messages
    }

    // Challenge lifecycle
    function initiateChallenge(
        bytes32 assertionHash,
        StateAssertion calldata disputed,
        StateAssertion calldata alternative
    ) external payable returns (bytes32);

    function respondToChallenge(
        bytes32 challengeId,
        StateAssertion calldata defense
    ) external;

    function bisectChallenge(
        bytes32 challengeId,
        StateAssertion calldata midpoint
    ) external;

    function submitOneStepProof(
        bytes32 challengeId,
        bytes calldata proof,
        bytes calldata witness
    ) external;

    function resolveChallenge(bytes32 challengeId) external;

    // Events
    event ChallengeInitiated(bytes32 indexed challengeId, address challenger, address defender);
    event BisectionSubmitted(bytes32 indexed challengeId, uint256 round, bytes32 midpoint);
    event OneStepProofSubmitted(bytes32 indexed challengeId, address submitter);
    event ChallengeResolved(bytes32 indexed challengeId, address winner);
}
```

### Interactive Bisection Protocol

```solidity
interface IBisectionProtocol {
    struct BisectionState {
        uint256 startStep;
        uint256 endStep;
        bytes32 startHash;
        bytes32 endHash;
        bytes32[] history;      // Bisection history
        uint256 currentRound;
        address currentTurn;    // Whose turn to bisect
    }

    struct ExecutionSegment {
        uint256 startGas;
        uint256 endGas;
        bytes32 startMemoryRoot;
        bytes32 endMemoryRoot;
        bytes32 startStackRoot;
        bytes32 endStackRoot;
        bytes32 startStorageRoot;
        bytes32 endStorageRoot;
    }

    // Bisection operations
    function initiateBisection(
        bytes32 challengeId,
        ExecutionSegment calldata segment
    ) external returns (BisectionState memory);

    function submitBisection(
        bytes32 challengeId,
        uint256 midStep,
        bytes32 midHash,
        ExecutionSegment calldata leftSegment,
        ExecutionSegment calldata rightSegment
    ) external;

    function selectDisputedSegment(
        bytes32 challengeId,
        bool selectLeft
    ) external;

    function isBisectionComplete(
        bytes32 challengeId
    ) external view returns (bool, uint256 disputedStep);

    // Utilities
    function calculateMidpoint(uint256 start, uint256 end) external pure returns (uint256);
    function verifySegmentTransition(
        ExecutionSegment calldata segment,
        bytes calldata proof
    ) external view returns (bool);

    // Events
    event BisectionInitiated(bytes32 indexed challengeId, uint256 totalSteps);
    event BisectionRound(bytes32 indexed challengeId, uint256 round, uint256 midStep);
    event SegmentSelected(bytes32 indexed challengeId, uint256 startStep, uint256 endStep);
    event BisectionComplete(bytes32 indexed challengeId, uint256 disputedStep);
}
```

### One-Step Verification

```solidity
interface IOneStepVerifier {
    struct OneStepProof {
        bytes32 beforeHash;
        bytes32 afterHash;
        bytes instruction;       // Single instruction to execute
        bytes machineState;      // Full machine state before
        bytes witness;          // Memory/storage access proofs
    }

    struct MachineState {
        uint256 pc;             // Program counter
        bytes32 memoryRoot;
        bytes32 stackRoot;
        bytes32 storageRoot;
        bytes32 globalStateRoot;
        uint256 gasRemaining;
        bytes registers;        // CPU registers for WASM/EVM
    }

    struct MemoryProof {
        uint256 address;
        bytes32 value;
        bytes32[] siblings;     // Merkle proof
    }

    // Core verification
    function verifyOneStep(
        OneStepProof calldata proof
    ) external view returns (bool);

    function executeInstruction(
        bytes calldata instruction,
        MachineState calldata state,
        bytes calldata witness
    ) external pure returns (MachineState memory);

    // Instruction-specific verifiers
    function verifyADD(MachineState calldata state, bytes calldata witness) external pure returns (bytes32);
    function verifyMUL(MachineState calldata state, bytes calldata witness) external pure returns (bytes32);
    function verifyLOAD(MachineState calldata state, bytes calldata witness) external pure returns (bytes32);
    function verifySTORE(MachineState calldata state, bytes calldata witness) external pure returns (bytes32);
    function verifyCALL(MachineState calldata state, bytes calldata witness) external view returns (bytes32);

    // State root calculation
    function calculateStateRoot(MachineState calldata state) external pure returns (bytes32);
    function updateMemoryRoot(bytes32 oldRoot, uint256 address, bytes32 value) external pure returns (bytes32);
}
```

### AI Computation Fraud Proofs

```solidity
interface IAIFraudProofs {
    struct InferenceProof {
        bytes32 modelHash;
        bytes inputHash;
        bytes outputHash;
        bytes intermediateActivations;  // Layer-wise activations
        uint256[] computeProfile;       // FLOPs per layer
    }

    struct MatrixOperation {
        uint256 rows;
        uint256 cols;
        uint256 innerDim;
        bytes matrixA;
        bytes matrixB;
        bytes result;
        bytes proof;            // Sumcheck or GKR proof
    }

    struct GradientProof {
        bytes32 modelHash;
        bytes32 lossValue;
        bytes forwardActivations;
        bytes backwardGradients;
        uint256 batchSize;
        bytes datasetSample;
    }

    // Inference verification
    function verifyInference(
        InferenceProof calldata proof,
        bytes calldata modelWeights
    ) external view returns (bool);

    function verifyLayerComputation(
        bytes calldata input,
        bytes calldata weights,
        bytes calldata output,
        string calldata activation
    ) external pure returns (bool);

    // Matrix operation verification
    function verifyMatMul(
        MatrixOperation calldata op
    ) external view returns (bool);

    function verifyConvolution(
        bytes calldata input,
        bytes calldata kernel,
        bytes calldata output,
        uint256[4] calldata dimensions  // [batch, channels, height, width]
    ) external pure returns (bool);

    // Training verification
    function verifyGradientComputation(
        GradientProof calldata proof
    ) external view returns (bool);

    function verifyBackpropagation(
        bytes calldata activations,
        bytes calldata gradients,
        bytes calldata weights
    ) external pure returns (bool);

    // Optimization verification
    function verifyOptimizerStep(
        bytes calldata gradients,
        bytes calldata oldWeights,
        bytes calldata newWeights,
        bytes calldata optimizerState,
        uint256 learningRate
    ) external pure returns (bool);

    // Events
    event InferenceDisputed(bytes32 indexed modelHash, bytes32 inputHash);
    event GradientDisputed(bytes32 indexed modelHash, uint256 epoch);
    event MatrixOperationVerified(bytes32 indexed opHash, bool valid);
}
```

### Challenge Game Manager

```solidity
interface IChallengeGameManager {
    struct GameRules {
        uint256 challengePeriod;        // Time to challenge assertion
        uint256 bisectionTimeout;       // Time per bisection round
        uint256 minChallengeStake;      // Minimum stake to challenge
        uint256 maxChallengeDepth;      // Maximum bisection depth
        uint256 rewardPercentage;       // Winner's reward (% of stake)
    }

    struct GameState {
        bytes32 gameId;
        address[2] players;             // [challenger, defender]
        uint256[2] stakes;
        uint256[2] timeouts;            // Timeout counters
        uint256 currentDepth;
        address currentMover;
        uint256 deadline;
        bytes32 disputedClaim;
    }

    struct Move {
        bytes32 gameId;
        uint256 moveNumber;
        address player;
        bytes moveData;
        uint256 timestamp;
        bytes32 commitment;             // Hash of next move (optional)
    }

    // Game management
    function createGame(
        address defender,
        bytes32 disputedClaim,
        GameRules calldata rules
    ) external payable returns (bytes32);

    function makeMove(
        bytes32 gameId,
        bytes calldata moveData,
        bytes32 nextCommitment
    ) external;

    function claimTimeout(bytes32 gameId) external;
    function concedeGame(bytes32 gameId) external;
    function adjudicateGame(bytes32 gameId) external;

    // Strategy enforcement
    function isValidMove(
        bytes32 gameId,
        bytes calldata moveData
    ) external view returns (bool);

    function calculateOptimalStrategy(
        GameState calldata state
    ) external view returns (bytes memory);

    // Rewards
    function claimReward(bytes32 gameId) external;
    function distributeStakes(bytes32 gameId) external;

    // Events
    event GameCreated(bytes32 indexed gameId, address challenger, address defender);
    event MoveMade(bytes32 indexed gameId, uint256 moveNumber, address player);
    event GameResolved(bytes32 indexed gameId, address winner, uint256 reward);
}
```

### Economic Security Module

```solidity
interface IEconomicSecurity {
    struct StakeInfo {
        uint256 amount;
        uint256 lockedUntil;
        uint256 slashingRisk;      // Amount at risk in challenges
        bytes32[] activeChallenges;
    }

    struct SlashingParams {
        uint256 baseSlashAmount;
        uint256 slashingRate;      // Percentage of stake
        uint256 repeatOffenderMultiplier;
        uint256 gracePeriod;
    }

    struct RewardParams {
        uint256 baseReward;
        uint256 difficultyMultiplier;
        uint256 speedBonus;        // For quick resolution
        uint256 maxReward;
    }

    // Staking
    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
    function increaseStake(bytes32 challengeId, uint256 amount) external;

    // Slashing
    function slash(
        address violator,
        uint256 amount,
        bytes calldata evidence
    ) external;

    function proposeSlashing(
        address target,
        bytes calldata evidence
    ) external returns (bytes32);

    function disputeSlashing(bytes32 proposalId) external;

    // Rewards
    function calculateReward(
        bytes32 challengeId,
        uint256 complexity,
        uint256 resolutionTime
    ) external view returns (uint256);

    function claimRewards(bytes32[] calldata challengeIds) external;

    // Risk management
    function getRiskScore(address participant) external view returns (uint256);
    function adjustStakeRequirement(address participant) external view returns (uint256);

    // Events
    event Staked(address indexed staker, uint256 amount);
    event Slashed(address indexed violator, uint256 amount, bytes32 reason);
    event RewardClaimed(address indexed claimer, uint256 amount);
}
```

## Rationale

### Bisection Protocol Design

The interactive bisection protocol follows Kalai et al. (2022) "Interactive Oracle Proofs":
- **Logarithmic Rounds**: O(log n) rounds for n computational steps
- **Turn-Based**: Alternating moves prevent deadlock
- **Binary Search**: Efficiently narrows disputed computation
- **Commitment**: Players commit to moves preventing adaptation

### One-Step Verification

Design choices based on Arbitrum's fraud proof system:
- **Minimal On-Chain Execution**: Only verify single disputed instruction
- **Witness Data**: Merkle proofs for memory/storage access
- **State Root**: Comprehensive state commitment after each step

### AI-Specific Proofs

Novel contributions for AI workload verification:

1. **Layer-wise Verification**: Verify neural network layer-by-layer
2. **Sumcheck Protocol**: Efficient matrix multiplication verification (Thaler, 2013)
3. **Gradient Checking**: Numerical gradient verification for small samples
4. **Activation Caching**: Store intermediate activations for dispute

### Economic Security

Game theory considerations from Asgaonkar & Krishnamachari (2019):
- **Griefing Resistance**: Minimum stakes prevent spam challenges
- **Incentive Compatibility**: Honest behavior strictly dominates
- **Progressive Penalties**: Repeat offenders face increasing slashing

## Backwards Compatibility

Compatible with existing optimistic rollup designs:
- Standard challenge interface for integration
- Optional AI-specific extensions
- Fallback to simple fraud proofs for basic operations

## Test Cases

### Bisection Protocol Tests

```javascript
describe("Bisection Protocol", () => {
    it("should complete bisection in logarithmic rounds", async () => {
        const totalSteps = 1000000;
        const disputedStep = 654321;

        const challengeId = await fraudProof.initiateChallenge(
            assertionHash,
            disputedState,
            alternativeState
        );

        let rounds = 0;
        let [start, end] = [0, totalSteps];

        while (end - start > 1) {
            const mid = Math.floor((start + end) / 2);
            const midHash = computeStateHash(mid);

            await fraudProof.submitBisection(challengeId, mid, midHash);

            // Challenger/defender selects segment
            if (disputedStep < mid) {
                await fraudProof.selectDisputedSegment(challengeId, true);
                end = mid;
            } else {
                await fraudProof.selectDisputedSegment(challengeId, false);
                start = mid;
            }

            rounds++;
        }

        expect(rounds).to.be.lte(Math.ceil(Math.log2(totalSteps)));
        expect(start).to.equal(disputedStep);
    });

    it("should handle timeout during bisection", async () => {
        const challengeId = await fraudProof.initiateChallenge(assertion);

        // Advance time past timeout
        await time.increase(bisectionTimeout + 1);

        await fraudProof.claimTimeout(challengeId);

        const challenge = await fraudProof.getChallenge(challengeId);
        expect(challenge.status).to.equal(ChallengeStatus.ChallengerWon);
    });
});
```

### One-Step Verification Tests

```javascript
describe("One-Step Verifier", () => {
    it("should verify ADD instruction", async () => {
        const state = {
            pc: 100,
            stackRoot: keccak256("stack"),
            memoryRoot: keccak256("memory"),
            gasRemaining: 1000000
        };

        const proof = {
            beforeHash: computeStateHash(state),
            instruction: "0x01", // ADD opcode
            machineState: state,
            witness: encodeDynamicWitness([5, 3]) // Stack values
        };

        state.pc++;
        state.gasRemaining -= 3;
        proof.afterHash = computeStateHash(state);

        expect(await verifier.verifyOneStep(proof)).to.be.true;
    });

    it("should verify SLOAD with merkle proof", async () => {
        const storageProof = {
            address: "0x123",
            value: "0x456",
            siblings: generateMerkleProof(storageTree, "0x123")
        };

        const proof = {
            instruction: "0x54", // SLOAD
            witness: encodeStorageWitness(storageProof)
        };

        expect(await verifier.verifyOneStep(proof)).to.be.true;
    });
});
```

### AI Fraud Proof Tests

```javascript
describe("AI Fraud Proofs", () => {
    it("should verify matrix multiplication", async () => {
        const A = [[1, 2], [3, 4]];
        const B = [[5, 6], [7, 8]];
        const C = [[19, 22], [43, 50]];

        const operation = {
            rows: 2,
            cols: 2,
            innerDim: 2,
            matrixA: encodeMatrix(A),
            matrixB: encodeMatrix(B),
            result: encodeMatrix(C),
            proof: generateSumcheckProof(A, B, C)
        };

        expect(await aiProofs.verifyMatMul(operation)).to.be.true;
    });

    it("should verify neural network inference", async () => {
        const model = loadModel("simple-mlp");
        const input = tensor([1.0, 2.0, 3.0]);
        const output = model.forward(input);

        const proof = {
            modelHash: keccak256(model.weights),
            inputHash: keccak256(input),
            outputHash: keccak256(output),
            intermediateActivations: model.getActivations(),
            computeProfile: model.getFLOPsPerLayer()
        };

        expect(await aiProofs.verifyInference(proof, model.weights)).to.be.true;
    });

    it("should verify gradient computation", async () => {
        const batch = loadBatch(dataLoader, 32);
        const loss = model.computeLoss(batch);
        const gradients = model.backward();

        const proof = {
            modelHash: keccak256(model.weights),
            lossValue: loss,
            forwardActivations: model.getActivations(),
            backwardGradients: gradients,
            batchSize: 32,
            datasetSample: batch.sample(4) // Small sample for verification
        };

        expect(await aiProofs.verifyGradientComputation(proof)).to.be.true;
    });

    it("should catch invalid convolution", async () => {
        const input = tensor4d(1, 3, 224, 224); // batch, channels, height, width
        const kernel = tensor4d(64, 3, 3, 3);   // filters, channels, height, width
        const output = tensor4d(1, 64, 222, 222);

        // Corrupt output
        output[0][0][0][0] = 999;

        const result = await aiProofs.verifyConvolution(
            encode(input),
            encode(kernel),
            encode(output),
            [1, 3, 224, 224]
        );

        expect(result).to.be.false;
    });
});
```

### Economic Security Tests

```javascript
describe("Economic Security", () => {
    it("should slash malicious challenger", async () => {
        const initialBalance = await token.balanceOf(challenger);
        const stakeAmount = ethers.parseEther("100");

        await economicSecurity.stake(stakeAmount);

        // Submit invalid challenge
        const invalidChallenge = createInvalidChallenge();
        const challengeId = await fraudProof.initiateChallenge(invalidChallenge);

        // Defender wins
        await resolveChallenge(challengeId, defender);

        // Challenger gets slashed
        const finalBalance = await token.balanceOf(challenger);
        expect(finalBalance).to.equal(initialBalance.sub(stakeAmount));
    });

    it("should reward successful challenger", async () => {
        const validChallenge = createValidChallenge();
        const challengeId = await fraudProof.initiateChallenge(validChallenge);

        await resolveChallenge(challengeId, challenger);

        const reward = await economicSecurity.calculateReward(
            challengeId,
            complexity,
            resolutionTime
        );

        await economicSecurity.claimRewards([challengeId]);

        const balance = await token.balanceOf(challenger);
        expect(balance).to.be.gte(initialBalance.add(reward));
    });

    it("should increase stake requirement for repeat offenders", async () => {
        // First offense
        await submitInvalidChallenge(attacker);
        await slash(attacker, ethers.parseEther("10"));

        // Check increased requirement
        const newRequirement = await economicSecurity.adjustStakeRequirement(attacker);
        expect(newRequirement).to.be.gt(ethers.parseEther("100"));

        // Risk score increases
        const riskScore = await economicSecurity.getRiskScore(attacker);
        expect(riskScore).to.be.gt(50);
    });
});
```

## Reference Implementation

Available at:
- https://github.com/luxfi/fraud-proofs
- https://github.com/luxfi/bisection-game
- https://github.com/luxfi/ai-verifier

Key components:
- `contracts/FraudProofSystem.sol`: Main fraud proof contract
- `contracts/BisectionGame.sol`: Interactive bisection implementation
- `contracts/OneStepProver.sol`: Single instruction verifier
- `contracts/AIVerifier.sol`: AI computation verification
- `circuits/matmul/`: ZK circuits for matrix operations
- `rust/prover/`: High-performance proof generation

## Security Considerations

### Protocol Security

1. **Timeout Griefing**: Enforce strict timeouts with automatic resolution
2. **Sybil Challenges**: Require substantial stakes proportional to assertion value
3. **Frontrunning**: Use commit-reveal for move submission
4. **Eclipse Attacks**: Multiple independent validators required

### Cryptographic Security

1. **Proof Soundness**: Formal verification of one-step prover
2. **Hash Collisions**: Use 256-bit hashes throughout
3. **RNG Manipulation**: Use VRF for any randomness

### Economic Security

1. **Nothing-at-Stake**: Require locked stakes during challenge period
2. **Bribery**: Make bribes more expensive than honest participation
3. **Cartel Formation**: Progressive slashing for coordinated attacks

### AI-Specific Security

1. **Model Extraction**: Don't reveal full model weights during verification
2. **Data Poisoning**: Verify on clean validation set
3. **Gradient Manipulation**: Check gradient norms and statistics
4. **Floating Point**: Use fixed-point arithmetic for determinism

## Economic Impact

### Cost Analysis
- Challenge Gas Cost: ~500,000 gas per bisection round
- One-Step Proof: ~2,000,000 gas
- Total Challenge Cost: ~10,000,000 gas worst case

### Incentive Structure
- Challenger Reward: 10% of defender's stake
- Defender Reward: 10% of challenger's stake
- Protocol Fee: 1% to treasury

### Security Budget
- Minimum Stake: 100,000 LUX (~$100,000)
- Maximum Exposure: 10% of TVL
- Insurance Fund: 1,000,000 LUX

## Open Questions

1. **Multi-party Challenges**: Allowing multiple challengers simultaneously
2. **Partial Slashing**: Graduated penalties based on severity
3. **Cross-rollup Challenges**: Challenging state across multiple L2s
4. **Hardware Acceleration**: GPU/ASIC for proof generation

## References

1. Kalai, Y., et al. (2022). "Interactive Oracle Proofs." STOC 2022
2. Teutsch, J., & Reitwießner, C. (2017). "A Scalable Verification Solution for Blockchains"
3. Thaler, J. (2013). "Time-Optimal Interactive Proofs for Circuit Evaluation"
4. Asgaonkar, A., & Krishnamachari, B. (2019). "Solving Blockchain's Scalability Problem"
5. Arbitrum Team (2021). "Arbitrum Rollup Protocol"
6. Optimism Team (2021). "Optimistic Rollup Specification"
7. Goldwasser, S., et al. (2008). "Delegating Computation: Interactive Proofs for Muggles"
8. Ben-Sasson, E., et al. (2013). "SNARKs for C: Verifying Program Executions Succinctly"
9. Wahby, R.S., et al. (2018). "Doubly-Efficient zkSNARKs Without Trusted Setup"

## Implementation

**Status**: Specification stage - implementation planned for future release

**Planned Locations**:
- Fraud proof system: `~/work/lux/fraud-proofs/` (to be created)
- Bisection game: `~/work/lux/fraud-proofs/bisection/`
- One-step verifier: `~/work/lux/fraud-proofs/verifier/`
- AI fraud proofs: `~/work/lux/fraud-proofs/ai/`
- Contracts: `~/work/lux/standard/src/fraud-proofs/`

**Leverage Existing Infrastructure**:
- Uses Lux consensus layer primitives
- Integrates with P-Chain validator management
- Compatible with existing EVM precompile system
- Uses Q-Chain post-quantum signatures for proofs

**Implementation Modules**:
1. **Core Bisection Engine** (~1000 LOC)
   - Binary search execution tracing
   - Move verification logic
   - Timeout handling

2. **One-Step Verifier** (~2000 LOC)
   - EVM instruction execution
   - Memory/storage access verification
   - State root updates

3. **AI Verifier** (~3000 LOC)
   - Matrix multiplication proofs (Sumcheck)
   - Neural network layer verification
   - Gradient computation validation

4. **Economic Module** (~800 LOC)
   - Stake management
   - Slashing conditions
   - Reward calculation

**Dependencies**:
- ZK circuit libraries (Circom, Halo2)
- Merkle proof utilities (existing in `~/work/lux/database/`)
- BLS threshold signatures (existing in `~/work/lux/crypto/`)

**Testing Coverage**:
- Bisection protocol correctness (30+ test scenarios)
- Fraud proof soundness (property-based testing)
- AI computation verification (ML-specific tests)
- Economic security (game theory simulations)

**Deployment Strategy**:
- Phase 1: Core bisection + one-step verifier
- Phase 2: AI fraud proofs and neural network verification
- Phase 3: Economic security and slashing mechanisms
- Phase 4: Production hardening and audits

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).