---
lp: 0503
title: Validity Proof System
description: Zero-knowledge validity proof system for ZK-rollups with STARK/SNARK support
author: Lux Network Team (@luxfi), Hanzo AI (@hanzoai), Zoo Protocol (@zooprotocol)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-09-24
requires: 500, 501
tags: [l2, zk]
---

## Abstract

This LP specifies a comprehensive validity proof system for ZK-rollups on Lux Network, supporting both STARK and SNARK proof systems with recursive composition and aggregation. The system enables succinct verification of arbitrary computations including AI model inference, distributed training aggregation, and complex smart contract execution. It implements universal circuits for general-purpose computation, specialized circuits for AI operations, and efficient batch proof aggregation to minimize on-chain verification costs.

## Activation

| Parameter          | Value                    |
|--------------------|--------------------------|
| Flag string        | `lp503-validity-proofs`  |
| Default in code    | **false** until block X  |
| Deployment branch  | `v0.0.0-lp503`          |
| Roll‑out criteria  | 1M proofs verified       |
| Back‑off plan      | Dual proof systems       |

## Motivation

ZK-rollups require efficient validity proof systems to achieve:

1. **Succinctness**: Constant-time verification regardless of computation size
2. **Zero Knowledge**: Privacy preservation for sensitive computations
3. **Universality**: Support for arbitrary programs without trusted setup per circuit
4. **AI Optimization**: Efficient proof generation for neural network operations
5. **Composability**: Recursive proof composition and aggregation

## Specification

### Core Validity Proof Interface

```solidity
interface IValidityProofSystem {
    enum ProofSystem { SNARK_Groth16, SNARK_PLONK, STARK, Bulletproofs, Halo2 }
    
    struct ProofConfig {
        ProofSystem system;
        bytes verificationKey;
        uint256 maxCircuitSize;
        uint256 securityLevel;      // Bits of security
        bool recursionEnabled;
        bytes trustedSetup;         // For SNARKs requiring setup
    }

    struct ValidityProof {
        bytes proof;
        bytes publicInputs;
        bytes32 programHash;        // Hash of executed program
        uint256 numSteps;           // Computational steps proven
        ProofSystem system;
        bytes metadata;
    }

    struct BatchProof {
        ValidityProof[] proofs;
        bytes aggregationProof;     // Proof of proof validity
        bytes32 batchRoot;          // Merkle root of all proofs
    }

    // Core verification
    function verifyProof(
        ValidityProof calldata proof,
        ProofConfig calldata config
    ) external view returns (bool);

    function verifyBatchProof(
        BatchProof calldata batch,
        ProofConfig calldata config
    ) external view returns (bool);

    // Proof composition
    function composeProofs(
        ValidityProof[] calldata proofs,
        bytes calldata compositionCircuit
    ) external returns (ValidityProof memory);

    function recursiveVerify(
        ValidityProof calldata innerProof,
        ValidityProof calldata outerProof
    ) external view returns (bool);

    // Events
    event ProofVerified(bytes32 indexed proofHash, bool valid);
    event BatchVerified(bytes32 indexed batchRoot, uint256 numProofs);
    event ProofComposed(bytes32 indexed composedHash, uint256 numComponents);
}
```

### STARK Proof System

```solidity
interface ISTARKProofs {
    struct STARKConfig {
        uint256 fieldModulus;        // Prime field
        uint256 expansionFactor;     // Blow-up factor
        uint256 numQueries;          // Number of queries
        uint256 foldingFactor;       // For FRI protocol
        bytes32 hashFunction;        // Rescue, Poseidon, etc.
    }

    struct STARKProof {
        bytes arithmetization;      // AIR representation
        bytes commitment;            // Merkle commitments
        bytes friProof;              // FRI low-degree proof
        bytes[] queryProofs;         // Query responses
        bytes witness;               // Execution trace
    }

    struct AIR {
        uint256 traceWidth;          // Number of registers
        uint256 traceLength;         // Number of steps
        bytes constraints;           // Algebraic constraints
        bytes boundaryConditions;    // Initial/final states
    }

    // STARK operations
    function generateSTARK(
        bytes calldata program,
        bytes calldata input,
        STARKConfig calldata config
    ) external returns (STARKProof memory);

    function verifySTARK(
        STARKProof calldata proof,
        bytes calldata publicInput,
        STARKConfig calldata config
    ) external view returns (bool);

    // FRI protocol
    function friCommit(
        bytes calldata polynomial,
        uint256 blowupFactor
    ) external pure returns (bytes memory);

    function friQuery(
        bytes calldata commitment,
        uint256 index
    ) external pure returns (bytes memory);

    function friVerify(
        bytes calldata commitment,
        bytes calldata proof,
        uint256 maxDegree
    ) external pure returns (bool);

    // Cairo integration
    function verifyCairoProgram(
        bytes calldata cairoCode,
        STARKProof calldata proof
    ) external view returns (bool);
}
```

### SNARK Proof Systems

```solidity
interface ISNARKProofs {
    struct Groth16Proof {
        bytes32[2] a;
        bytes32[2][2] b;
        bytes32[2] c;
    }

    struct PLONKProof {
        bytes32[32] commitments;     // Wire and permutation commitments
        bytes32[7] evaluations;      // Polynomial evaluations
        bytes32[2] openingProof;     // KZG opening proof
    }

    struct R1CSCircuit {
        uint256 numConstraints;
        uint256 numVariables;
        uint256 numInputs;
        bytes constraints;           // Serialized R1CS matrices
    }

    struct UniversalSRS {
        bytes g1Powers;              // [g^τ^0, g^τ^1, ..., g^τ^n]
        bytes g2Powers;              // [h^τ^0, h^τ^1, ..., h^τ^n]
        uint256 maxDegree;
        bytes32 setupHash;          // Hash of setup ceremony
    }

    // Groth16
    function setupGroth16(
        R1CSCircuit calldata circuit
    ) external returns (bytes memory vk, bytes memory pk);

    function proveGroth16(
        R1CSCircuit calldata circuit,
        bytes calldata witness,
        bytes calldata pk
    ) external returns (Groth16Proof memory);

    function verifyGroth16(
        Groth16Proof calldata proof,
        bytes calldata publicInputs,
        bytes calldata vk
    ) external view returns (bool);

    // PLONK
    function setupPLONK(
        bytes calldata circuit,
        UniversalSRS calldata srs
    ) external returns (bytes memory vk);

    function provePLONK(
        bytes calldata circuit,
        bytes calldata witness,
        UniversalSRS calldata srs
    ) external returns (PLONKProof memory);

    function verifyPLONK(
        PLONKProof calldata proof,
        bytes calldata publicInputs,
        bytes calldata vk
    ) external view returns (bool);

    // Recursive SNARKs
    function proveRecursive(
        bytes calldata innerProof,
        bytes calldata outerCircuit
    ) external returns (bytes memory);
}
```

### AI Circuit Library

```solidity
interface IAICircuits {
    struct TensorOp {
        uint256[] shape;
        bytes data;
        string dtype;                // "float32", "int8", etc.
    }

    struct NeuralNetworkCircuit {
        bytes32 architectureHash;
        uint256 numLayers;
        bytes[] layerConfigs;
        uint256 totalParameters;
    }

    // Matrix operations
    function matMulCircuit(
        uint256 m, uint256 n, uint256 k
    ) external pure returns (bytes memory);

    function convolutionCircuit(
        uint256[4] calldata inputShape,   // [batch, channels, height, width]
        uint256[4] calldata kernelShape,  // [filters, channels, kh, kw]
        uint256[2] calldata stride
    ) external pure returns (bytes memory);

    // Activation functions
    function reluCircuit(uint256 size) external pure returns (bytes memory);
    function softmaxCircuit(uint256 size) external pure returns (bytes memory);
    function sigmoidCircuit(uint256 size) external pure returns (bytes memory);

    // Layer circuits
    function denseLayerCircuit(
        uint256 inputSize,
        uint256 outputSize,
        bool bias,
        string calldata activation
    ) external pure returns (bytes memory);

    function attentionCircuit(
        uint256 seqLength,
        uint256 embedDim,
        uint256 numHeads
    ) external pure returns (bytes memory);

    // Full model circuits
    function transformerCircuit(
        uint256 numLayers,
        uint256 seqLength,
        uint256 embedDim,
        uint256 numHeads
    ) external pure returns (bytes memory);

    // Training circuits
    function backpropCircuit(
        bytes calldata forwardCircuit
    ) external pure returns (bytes memory);

    function adamOptimizerCircuit(
        uint256 numParameters,
        uint256 learningRate
    ) external pure returns (bytes memory);

    // Quantization
    function quantizeCircuit(
        uint256 inputBits,
        uint256 outputBits
    ) external pure returns (bytes memory);
}
```

### Proof Aggregation

```solidity
interface IProofAggregation {
    struct AggregationConfig {
        uint256 maxProofs;           // Max proofs per batch
        uint256 targetProofSize;     // Target aggregated proof size
        ProofSystem targetSystem;    // Output proof system
        bytes aggregationCircuit;
    }

    struct ProofTree {
        bytes32 root;
        uint256 depth;
        bytes32[][] layers;          // Merkle tree layers
        ValidityProof[] leaves;      // Individual proofs
    }

    // Aggregation methods
    function aggregateProofs(
        ValidityProof[] calldata proofs,
        AggregationConfig calldata config
    ) external returns (ValidityProof memory);

    function recursiveAggregate(
        ProofTree calldata tree,
        uint256 branchingFactor
    ) external returns (ValidityProof memory);

    function snarkifySTARK(
        STARKProof calldata stark
    ) external returns (Groth16Proof memory);

    // Batch verification
    function batchVerifyDifferentCircuits(
        ValidityProof[] calldata proofs,
        bytes[] calldata verificationKeys
    ) external view returns (bool[] memory);

    function parallelVerify(
        ValidityProof[] calldata proofs,
        uint256 numThreads
    ) external view returns (bool);

    // Compression
    function compressProof(
        ValidityProof calldata proof
    ) external pure returns (bytes memory);

    function decompressProof(
        bytes calldata compressed
    ) external pure returns (ValidityProof memory);
}
```

## Rationale

### Proof System Selection

Multiple proof systems for different use cases:

| System | Proof Size | Prover Time | Verifier Time | Setup | Use Case |
|--------|-----------|------------|--------------|-------|----------|
| Groth16 | 128 bytes | O(n log n) | O(1) | Trusted | Small circuits |
| PLONK | 380 bytes | O(n log n) | O(1) | Universal | General purpose |
| STARK | 45 KB | O(n log² n) | O(log² n) | None | Large computations |
| Halo2 | 1 KB | O(n log n) | O(log n) | None | Recursive proofs |

### STARK for AI Workloads

STARKs chosen for AI due to:
- No trusted setup required
- Post-quantum secure
- Efficient for repeated similar computations
- Natural arithmetic over large fields

### Recursive Proof Composition

Following Chiesa et al. (2019) "Recursive Proof Composition":
- Proof-carrying data for incremental computation
- Tree-based aggregation for parallelization
- SNARK-STARK composition for size optimization

## Backwards Compatibility

Compatible with existing ZK frameworks:
- Standard Groth16/PLONK verifiers
- Cairo program compatibility
- Circom circuit support
- Integration with existing L2s

## Test Cases

### Basic Proof Verification

```javascript
describe("Validity Proofs", () => {
    it("should verify Groth16 proof", async () => {
        const circuit = await loadCircuit("simple-computation");
        const [vk, pk] = await snark.setupGroth16(circuit);

        const witness = computeWitness(circuit, input);
        const proof = await snark.proveGroth16(circuit, witness, pk);

        expect(await snark.verifyGroth16(proof, publicInputs, vk)).to.be.true;
    });

    it("should verify STARK proof", async () => {
        const config = {
            fieldModulus: BigInt("270497897142230380135924736767050121217"),
            expansionFactor: 8,
            numQueries: 30,
            foldingFactor: 4
        };

        const program = compileCairo("fibonacci.cairo");
        const proof = await stark.generateSTARK(program, input, config);

        expect(await stark.verifySTARK(proof, publicInput, config)).to.be.true;
    });
});
```

### AI Circuit Tests

```javascript
describe("AI Circuits", () => {
    it("should prove matrix multiplication", async () => {
        const circuit = await aiCircuits.matMulCircuit(32, 64, 128);
        
        const A = randomMatrix(32, 128);
        const B = randomMatrix(128, 64);
        const C = matMul(A, B);

        const witness = {
            A: encodeMatrix(A),
            B: encodeMatrix(B),
            C: encodeMatrix(C)
        };

        const proof = await prover.prove(circuit, witness);
        expect(await verifier.verify(proof, C)).to.be.true;
    });

    it("should prove transformer inference", async () => {
        const circuit = await aiCircuits.transformerCircuit(
            12,    // layers
            512,   // sequence length
            768,   // embedding dimension
            12     // attention heads
        );

        const model = loadModel("bert-base");
        const input = tokenize("Hello, world!");
        const output = model.forward(input);

        const proof = await generateInferenceProof(circuit, model, input, output);
        expect(await verifyInferenceProof(proof)).to.be.true;
    });
});
```

### Proof Aggregation Tests

```javascript
describe("Proof Aggregation", () => {
    it("should aggregate multiple proofs", async () => {
        const proofs = [];
        for(let i = 0; i < 100; i++) {
            const proof = await generateSimpleProof(i);
            proofs.push(proof);
        }

        const config = {
            maxProofs: 100,
            targetProofSize: 1024,
            targetSystem: ProofSystem.SNARK_Groth16
        };

        const aggregated = await aggregation.aggregateProofs(proofs, config);
        expect(aggregated.proof.length).to.be.lte(1024);

        // Verify aggregated proof verifies all individual proofs
        expect(await verifier.verifyBatchProof(aggregated)).to.be.true;
    });

    it("should recursively compose proofs", async () => {
        const innerProof = await generateProof(innerCircuit, innerWitness);
        const outerProof = await prover.proveRecursive(innerProof, outerCircuit);

        expect(await verifier.recursiveVerify(innerProof, outerProof)).to.be.true;
    });
});
```

## Reference Implementation

Available at:
- https://github.com/luxfi/validity-proofs
- https://github.com/luxfi/stark-verifier
- https://github.com/luxfi/ai-circuits

Key components:
- `contracts/STARKVerifier.sol`: STARK proof verification
- `contracts/SNARKVerifier.sol`: Groth16/PLONK verification
- `circuits/ai/`: AI operation circuits
- `rust/prover/`: High-performance proof generation
- `cairo/`: Cairo program compilation

## Security Considerations

### Cryptographic Assumptions

1. **SNARK Security**: Relies on discrete log/pairing assumptions
2. **STARK Security**: Collision-resistant hash functions only
3. **Trusted Setup**: Ceremony security for Groth16
4. **Quantum Resistance**: STARKs are post-quantum secure

### Implementation Security

1. **Fiat-Shamir**: Use domain separation for different proofs
2. **Randomness**: Cryptographically secure RNG for challenges
3. **Side Channels**: Constant-time verification algorithms
4. **Denial of Service**: Gas limits on verification

### Economic Security

1. **Proof Generation Cost**: Amortize across multiple transactions
2. **Verification Cost**: Batch verification for efficiency
3. **Data Availability**: Ensure witness data available for disputes

## Economic Impact

### Cost Comparison

| Operation | Optimistic | ZK-SNARK | ZK-STARK |
|-----------|-----------|----------|----------|
| Proof Generation | 0 | $0.10 | $1.00 |
| Verification Gas | 0 | 200k | 2M |
| Challenge Period | 7 days | 0 | 0 |
| Capital Efficiency | Low | High | High |

### Market Opportunities

- Proof generation market: $10M+ annually
- Privacy-preserving AI: $100M+ market
- Verifiable compute: $1B+ total addressable market

## Open Questions

1. **Proof System Standardization**: Common format across systems
2. **Hardware Acceleration**: ASIC/FPGA for proof generation
3. **Distributed Proving**: Parallel proof generation across nodes
4. **Proof Compression**: Further size reduction techniques

## References

1. Ben-Sasson, E., et al. (2018). "Scalable, Transparent, and Post-quantum Secure Computational Integrity"
2. Gabizon, A., et al. (2019). "PLONK: Permutations over Lagrange-bases for Oecumenical Noninteractive arguments of Knowledge"
3. Groth, J. (2016). "On the Size of Pairing-Based Non-Interactive Arguments"
4. Chiesa, A., et al. (2019). "Recursive Proof Composition without a Trusted Setup"
5. Cairo Whitepaper (2021). "Cairo – a Turing-complete STARK-friendly CPU Architecture"
6. Bünz, B., et al. (2020). "Halo: Recursive Proof Composition without a Trusted Setup"
7. Kate, A., et al. (2010). "Constant-Size Commitments to Polynomials and Their Applications"
8. StarkWare (2018). "Stark 101: The Theory"

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).