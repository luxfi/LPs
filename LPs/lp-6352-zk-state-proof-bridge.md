---
lp: 6352
title: Zero-Knowledge State Proof Bridge
description: Succinct ZK proofs for cross-chain state verification, enabling fast and gas-efficient trustless bridging.
author: Claude (@anthropic)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-27
tags: [teleport, bridge, zk-proof, snark, trustless]
requires: [3001, 6350, 6351]
order: 352
---

## Abstract

This LP specifies a zero-knowledge proof system for bridge verification that compresses light client proofs into constant-size ZK proofs. Instead of verifying full block headers and receipt proofs on-chain (~500k gas), users submit succinct ZK proofs (~200k gas) that prove the same facts. This enables faster finality, lower gas costs, and better scalability for trustless cross-chain transfers.

## Motivation

While light client verification (LP-6350) and receipt proofs (LP-6351) provide trustless bridging, they have limitations:

| Limitation | Light Client | ZK Proofs |
|------------|-------------|-----------|
| Gas cost | ~500k per claim | ~200k per claim |
| Finality delay | Must wait for finality | Can prove in parallel |
| Verification complexity | Complex on-chain logic | Single pairing check |
| Proof size | ~10-50 KB | ~256 bytes |

ZK proofs provide:

* **Constant Verification Cost**: O(1) regardless of what's being proven
* **Proof Aggregation**: Batch multiple claims into one proof
* **Privacy Potential**: Foundation for private bridging
* **Faster UX**: Generate proofs while waiting for finality

## Specification

### 1. Proof System Selection

We use Groth16 for production and Plonk for flexibility:

| System | Proof Size | Verification Gas | Setup |
|--------|-----------|-----------------|-------|
| Groth16 | 128 bytes | ~200k | Trusted per-circuit |
| Plonk | 384 bytes | ~300k | Universal |
| STARK | ~50 KB | ~500k | Transparent |

### 2. Circuit Design

The ZK circuit proves:

1. **Block Finality**: The source block is finalized on the source chain
2. **Receipt Inclusion**: A burn event exists in the receipts trie
3. **Event Validity**: The burn event matches the claim parameters

```
Public Inputs:
- sourceChainId: uint256
- destinationChainId: uint256
- token: address
- amount: uint256
- recipient: address
- nonce: uint256

Private Inputs (witness):
- blockHeader: BlockHeader
- receiptProof: bytes[]
- receipt: TransactionReceipt
- syncCommitteeSignature: bytes (for Ethereum)
- validatorSignatures: bytes (for Lux)

Circuit Constraints:
1. Verify block header against light client state
2. Verify receipt proof against receiptsRoot
3. Extract and validate BridgeBurned event
4. Hash public inputs to single field element
```

### 3. Verifier Contract

```solidity
interface IZKBridgeVerifier {
    /// @notice Verify a Groth16 proof
    /// @param proof The proof (a, b, c points)
    /// @param publicInputs The public inputs
    function verifyProof(
        uint256[8] calldata proof,
        uint256[] calldata publicInputs
    ) external view returns (bool);
}

contract ZKBridge {
    IZKBridgeVerifier public verifier;
    
    /// @notice The verification key hash (for upgrades)
    bytes32 public vkHash;
    
    mapping(bytes32 => bool) public claimed;
    
    event ZKBridgeClaimed(
        bytes32 indexed claimId,
        uint256 indexed sourceChainId,
        address indexed recipient,
        address token,
        uint256 amount
    );
    
    /// @notice Claim with ZK proof
    function claimWithZKProof(
        uint256[8] calldata proof,
        ClaimData calldata claim
    ) external returns (bytes32 claimId) {
        // 1. Compute public inputs hash
        uint256[] memory publicInputs = new uint256[](6);
        publicInputs[0] = claim.sourceChainId;
        publicInputs[1] = block.chainid;
        publicInputs[2] = uint256(uint160(claim.token));
        publicInputs[3] = claim.amount;
        publicInputs[4] = uint256(uint160(claim.recipient));
        publicInputs[5] = claim.nonce;
        
        // 2. Verify ZK proof
        require(verifier.verifyProof(proof, publicInputs), "Invalid proof");
        
        // 3. Compute claim ID and check replay
        claimId = keccak256(abi.encode(claim));
        require(!claimed[claimId], "Already claimed");
        claimed[claimId] = true;
        
        // 4. Mint tokens
        IERC20B(claim.token).bridgeMint(claim.recipient, claim.amount);
        
        emit ZKBridgeClaimed(
            claimId,
            claim.sourceChainId,
            claim.recipient,
            claim.token,
            claim.amount
        );
    }
}
```

### 4. Groth16 Verifier

```solidity
library Pairing {
    struct G1Point {
        uint256 X;
        uint256 Y;
    }
    
    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }
    
    /// @notice Perform pairing check
    function pairing(
        G1Point[] memory p1,
        G2Point[] memory p2
    ) internal view returns (bool) {
        // Uses EIP-197 precompile at 0x08
        uint256 inputSize = p1.length * 6;
        uint256[] memory input = new uint256[](inputSize);
        
        for (uint256 i = 0; i < p1.length; i++) {
            input[i*6 + 0] = p1[i].X;
            input[i*6 + 1] = p1[i].Y;
            input[i*6 + 2] = p2[i].X[0];
            input[i*6 + 3] = p2[i].X[1];
            input[i*6 + 4] = p2[i].Y[0];
            input[i*6 + 5] = p2[i].Y[1];
        }
        
        uint256[1] memory out;
        bool success;
        assembly {
            success := staticcall(
                sub(gas(), 2000),
                8,  // Pairing precompile
                add(input, 0x20),
                mul(inputSize, 0x20),
                out,
                0x20
            )
        }
        require(success, "Pairing failed");
        return out[0] == 1;
    }
}

contract Groth16Verifier is IZKBridgeVerifier {
    using Pairing for *;
    
    // Verification key (generated during trusted setup)
    Pairing.G1Point public alfa1;
    Pairing.G2Point public beta2;
    Pairing.G2Point public gamma2;
    Pairing.G2Point public delta2;
    Pairing.G1Point[] public IC;
    
    function verifyProof(
        uint256[8] calldata proof,
        uint256[] calldata input
    ) external view override returns (bool) {
        // Parse proof points
        Pairing.G1Point memory A = Pairing.G1Point(proof[0], proof[1]);
        Pairing.G2Point memory B = Pairing.G2Point(
            [proof[2], proof[3]],
            [proof[4], proof[5]]
        );
        Pairing.G1Point memory C = Pairing.G1Point(proof[6], proof[7]);
        
        // Compute linear combination of public inputs
        Pairing.G1Point memory vk_x = IC[0];
        for (uint256 i = 0; i < input.length; i++) {
            vk_x = Pairing.addition(
                vk_x,
                Pairing.scalar_mul(IC[i + 1], input[i])
            );
        }
        
        // Verify pairing equation
        return Pairing.pairing(
            [Pairing.negate(A), alfa1, vk_x, C],
            [B, beta2, gamma2, delta2]
        );
    }
}
```

### 5. Proof Generation (Off-Chain)

```typescript
import { groth16 } from 'snarkjs';

interface BridgeProofInput {
    // Public
    sourceChainId: bigint;
    destinationChainId: bigint;
    token: string;
    amount: bigint;
    recipient: string;
    nonce: bigint;
    
    // Private (witness)
    blockHeader: BlockHeader;
    receiptProof: string[];
    receipt: TransactionReceipt;
    lightClientState: LightClientState;
    signatures: string;
}

async function generateBridgeProof(
    input: BridgeProofInput
): Promise<{ proof: Proof; publicInputs: bigint[] }> {
    const { proof, publicSignals } = await groth16.fullProve(
        input,
        'circuits/bridge.wasm',
        'circuits/bridge_final.zkey'
    );
    
    // Format for Solidity
    return {
        proof: [
            proof.pi_a[0], proof.pi_a[1],
            proof.pi_b[0][1], proof.pi_b[0][0],
            proof.pi_b[1][1], proof.pi_b[1][0],
            proof.pi_c[0], proof.pi_c[1]
        ],
        publicInputs: publicSignals.map(BigInt)
    };
}
```

### 6. Circuit Implementation (Circom)

```circom
pragma circom 2.1.0;

include "poseidon.circom";
include "mpt.circom";
include "ecdsa.circom";

template BridgeProof(maxProofDepth) {
    // Public inputs
    signal input sourceChainId;
    signal input destChainId;
    signal input token;
    signal input amount;
    signal input recipient;
    signal input nonce;
    
    // Private inputs
    signal input blockHeaderHash;
    signal input receiptsRoot;
    signal input receiptProof[maxProofDepth];
    signal input receipt;
    signal input burnEventLog;
    
    // 1. Verify receipt inclusion
    component mptVerifier = MPTVerifier(maxProofDepth);
    mptVerifier.root <== receiptsRoot;
    mptVerifier.proof <== receiptProof;
    mptVerifier.value <== receipt;
    
    // 2. Extract and verify burn event
    component eventExtractor = BurnEventExtractor();
    eventExtractor.receipt <== receipt;
    eventExtractor.token === token;
    eventExtractor.amount === amount;
    eventExtractor.recipient === recipient;
    eventExtractor.toChainId === destChainId;
    eventExtractor.nonce === nonce;
    
    // 3. Compute public input hash (for efficient verification)
    component hasher = Poseidon(6);
    hasher.inputs[0] <== sourceChainId;
    hasher.inputs[1] <== destChainId;
    hasher.inputs[2] <== token;
    hasher.inputs[3] <== amount;
    hasher.inputs[4] <== recipient;
    hasher.inputs[5] <== nonce;
    
    signal output publicInputHash;
    publicInputHash <== hasher.out;
}

component main = BridgeProof(32);
```

### 7. Proof Aggregation

Batch multiple claims into a single proof:

```solidity
function claimBatchWithZKProof(
    uint256[8] calldata aggregateProof,
    ClaimData[] calldata claims
) external {
    // Single proof verifies all claims
    uint256[] memory batchInputs = encodeBatchInputs(claims);
    require(verifier.verifyProof(aggregateProof, batchInputs), "Invalid batch proof");
    
    for (uint256 i = 0; i < claims.length; i++) {
        _processClaim(claims[i]);
    }
}
```

## Rationale

ZK proofs provide the optimal end-game for bridge verification:

1. **Constant Gas Cost**: ~200k gas regardless of proof complexity
2. **Composability**: Can prove arbitrary statements about source chain state
3. **Privacy Foundation**: Same circuits can add privacy features (LP-6353)
4. **Future-Proof**: Works with any consensus mechanism

The trusted setup requirement for Groth16 is mitigated by:
- Large multi-party ceremonies (100+ participants)
- Universal setup alternatives (Plonk, Halo2)
- Transparent alternatives for maximum security (STARKs)

## Backwards Compatibility

This extends the bridge with an additional proof type. All existing methods remain functional:

```solidity
enum ProofType {
    MPC_ORACLE,      // LP-3001
    LIGHT_CLIENT,    // LP-6350 + LP-6351
    ZK_PROOF,        // LP-6352 (this LP)
    ZK_PRIVATE       // LP-6353 (future)
}
```

## Test Cases

1. Generate and verify valid Groth16 proof
2. Reject proof with invalid public inputs
3. Reject proof with tampered witness
4. Verify gas consumption < 250k
5. Test proof aggregation for batch claims
6. Verify circuit constraints match Solidity checks

## Reference Implementation

- Circuits: `/bridge/circuits/bridge.circom`
- Verifier: `/bridge/contracts/contracts/zk/Groth16Verifier.sol`
- Prover: `/bridge/prover/src/bridge_prover.ts`
- Trusted Setup: `/bridge/setup/powers_of_tau/`

## Security Considerations

1. **Trusted Setup**: Groth16 requires trusted setup ceremony. Ensure sufficient participants and verify final parameters.

2. **Circuit Soundness**: Audit circuits for constraint completeness. Missing constraints can allow invalid proofs.

3. **Proof Malleability**: Groth16 proofs can be malleable. Use claim ID for replay protection, not proof bytes.

4. **Frontend Security**: Proof generation in browser requires secure delivery of WASM and zkey files.

5. **Upgrade Path**: Verification key must be upgradeable for circuit fixes. Use timelock for governance.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
