---
lp: 6352
title: Zero-Knowledge State Proof Bridge
description: Succinct ZK proofs for cross-chain state verification using Z-Chain zkVM, enabling fast and gas-efficient trustless bridging with optional FHE privacy.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-27
tags: [teleport, bridge, zk-proof, snark, trustless, z-chain, quasar, fhe]
requires: [3001, 6350, 6351]
order: 352
---

## Abstract

This LP specifies a zero-knowledge proof system for bridge verification that compresses light client proofs into constant-size ZK proofs. Instead of verifying full Quasar dual-certificates and receipt proofs on-chain (~500k gas), users submit succinct ZK proofs (~200k gas) that prove the same facts. Proofs are generated on **Z-Chain** (Lux's zkVM chain) and verified on Ethereum or other destinations.

## Motivation

While light client verification (LP-6350) and receipt proofs (LP-6351) provide trustless bridging, they have limitations:

| Limitation | Light Client | ZK Proofs |
|------------|-------------|-----------|
| Gas cost | ~500k per claim | ~200k per claim |
| Finality delay | Must wait for finality | Can prove in parallel |
| Verification complexity | Complex on-chain logic | Single pairing check |
| Proof size | ~10-50 KB | ~256 bytes |
| Ringtail on ETH | Not practical (~2M gas) | Wrapped in circuit |

**Key Insight**: Verifying Ringtail PQ signatures directly on Ethereum is prohibitively expensive. ZK proofs solve this by verifying Quasar dual-cert (BLS + Ringtail) inside the circuit, then outputting a constant-size Groth16/Plonk proof verifiable on any EVM.

ZK proofs provide:

* **Constant Verification Cost**: O(1) regardless of what's being proven
* **Proof Aggregation**: Batch multiple claims into one proof
* **PQ-Safe Bridging**: Ringtail verified in circuit, not on-chain
* **Privacy Foundation**: Same circuits enable private bridging (LP-6353)
* **Z-Chain Acceleration**: Hardware-optimized ZK proof generation

## Specification

### 1. Z-Chain: Lux's zkVM Chain

Z-Chain is Lux's dedicated zero-knowledge virtual machine chain optimized for:
- **ZK Proof Generation**: GPU/FPGA-accelerated circuit proving
- **Recursive Proofs**: Aggregate multiple proofs efficiently
- **zkEVM Execution**: Run Solidity contracts privately via zkFHE

```
┌────────────────────────────────────────────────────────────────────┐
│  Z-Chain (Chain ID: 800Z)                                          │
│  ──────────────────────────────────────────────────────────────── │
│                                                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │  zkVM Core   │    │  FHE Runtime │    │  Proof Store │         │
│  │  - Groth16   │    │  - TFHE      │    │  - IPFS/DA   │         │
│  │  - Plonk     │    │  - Concrete  │    │  - Celestia  │         │
│  │  - Halo2     │    │  - OpenFHE   │    │              │         │
│  └──────────────┘    └──────────────┘    └──────────────┘         │
│                                                                    │
│  Prover Network: GPU clusters for parallel proof generation        │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Groth16 proof (~200 bytes)
┌────────────────────────────────────────────────────────────────────┐
│  Ethereum / Base / Arbitrum / Any EVM                              │
│  ──────────────────────────────────────────────────────────────── │
│  ZKBridgeVerifier.sol: Single pairing check (~200k gas)            │
└────────────────────────────────────────────────────────────────────┘
```

### 2. Proof System Selection

| System | Proof Size | Verification Gas | Setup | Z-Chain Support |
|--------|-----------|-----------------|-------|-----------------|
| Groth16 | 128 bytes | ~200k | Trusted per-circuit | ✓ Primary |
| Plonk | 384 bytes | ~300k | Universal | ✓ Supported |
| Halo2 | 400 bytes | ~280k | None (IPA) | ✓ Supported |
| STARK | ~50 KB | ~500k | Transparent | Planned |

### 3. Circuit Design (Quasar-Aware)

The ZK circuit proves the complete two-layer verification:

**Layer 1: Quasar Finality** (for Lux source)
- Verify BLS aggregate signature
- Verify Ringtail PQ threshold signature
- Confirm dual-certificate over block hash

**Layer 2: Event Inclusion**
- MPT receipt proof verification
- BridgeBurned event extraction and validation

```
Public Inputs:
- sourceChainId: uint256
- destinationChainId: uint256  
- token: address
- amount: uint256
- recipient: address
- nonce: uint256
- quasarAnchorRoot: bytes32  // Commitment to validator set

Private Inputs (witness):
- blockHeader: BlockHeader
- receiptProof: bytes[]
- receipt: TransactionReceipt

// For Ethereum source:
- syncCommitteeSignature: bytes
- syncCommitteeBits: bytes32

// For Lux source (Quasar dual-cert):
- blsSignature: bytes          // BLS aggregate signature
- ringtailSignature: bytes     // Ringtail PQ threshold signature  
- validatorBits: bytes32       // Which validators signed
- validatorSet: Validator[]    // Current validator set with dual keys

Circuit Constraints:
1. IF sourceChainId == LUX:
   a. Verify BLS signature over blockHeader
   b. Verify Ringtail signature over blockHeader
   c. Check 2/3+ stake signed BOTH
2. ELSE (Ethereum):
   a. Verify sync committee BLS signature
   b. Check 2/3 of 512 validators signed
3. Verify receipt MPT proof against header.receiptsRoot
4. Extract BridgeBurned event, validate fields match public inputs
5. Hash public inputs for efficient verification
```

### 4. Circom Circuit (Quasar + Ringtail)

```circom
pragma circom 2.1.0;

include "bls12_381.circom";
include "ringtail.circom";  // LWE-based threshold sig
include "mpt.circom";
include "poseidon.circom";

template QuasarBridgeProof(maxProofDepth, maxValidators) {
    // Public inputs
    signal input sourceChainId;
    signal input destChainId;
    signal input token;
    signal input amount;
    signal input recipient;
    signal input nonce;
    signal input validatorSetRoot;  // Merkle root of validator set
    
    // Private inputs - Block
    signal input blockHash;
    signal input receiptsRoot;
    
    // Private inputs - Quasar dual-cert (for Lux source)
    signal input blsSigR[2];
    signal input blsSigS;
    signal input ringtailSig[RINGTAIL_SIG_SIZE];
    signal input validatorBits;
    signal input validators[maxValidators][VALIDATOR_SIZE];  // BLS + Ringtail pubkeys
    
    // Private inputs - Receipt proof
    signal input receiptProof[maxProofDepth];
    signal input receipt;
    
    // 1. Verify validator set matches commitment
    component valSetHasher = ValidatorSetHasher(maxValidators);
    valSetHasher.validators <== validators;
    valSetHasher.root === validatorSetRoot;
    
    // 2. Verify BLS aggregate signature
    component blsVerifier = BLS12_381_AggregateVerify(maxValidators);
    blsVerifier.message <== blockHash;
    blsVerifier.signature <== [blsSigR, blsSigS];
    blsVerifier.pubkeys <== extractBLSKeys(validators);
    blsVerifier.bits <== validatorBits;
    blsVerifier.valid === 1;
    
    // 3. Verify Ringtail PQ threshold signature
    component ringtailVerifier = RingtailThresholdVerify(maxValidators);
    ringtailVerifier.message <== blockHash;
    ringtailVerifier.signature <== ringtailSig;
    ringtailVerifier.pubkeys <== extractRingtailKeys(validators);
    ringtailVerifier.bits <== validatorBits;
    ringtailVerifier.valid === 1;
    
    // 4. Check 2/3+ stake threshold for BOTH signatures
    component stakeCheck = StakeThreshold(maxValidators);
    stakeCheck.bits <== validatorBits;
    stakeCheck.stakes <== extractStakes(validators);
    stakeCheck.threshold === 2/3;
    
    // 5. Verify receipt MPT proof
    component mptVerifier = MPTVerifier(maxProofDepth);
    mptVerifier.root <== receiptsRoot;
    mptVerifier.proof <== receiptProof;
    mptVerifier.value <== receipt;
    mptVerifier.valid === 1;
    
    // 6. Extract and verify burn event
    component eventExtractor = BurnEventExtractor();
    eventExtractor.receipt <== receipt;
    eventExtractor.token === token;
    eventExtractor.amount === amount;
    eventExtractor.recipient === recipient;
    eventExtractor.toChainId === destChainId;
    eventExtractor.nonce === nonce;
    
    // 7. Output public input hash
    component hasher = Poseidon(7);
    hasher.inputs[0] <== sourceChainId;
    hasher.inputs[1] <== destChainId;
    hasher.inputs[2] <== token;
    hasher.inputs[3] <== amount;
    hasher.inputs[4] <== recipient;
    hasher.inputs[5] <== nonce;
    hasher.inputs[6] <== validatorSetRoot;
    
    signal output publicInputHash;
    publicInputHash <== hasher.out;
}

component main = QuasarBridgeProof(32, 100);
```

### 5. Verifier Contract

```solidity
interface IZKBridgeVerifier {
    /// @notice Verify a Groth16 proof
    function verifyProof(
        uint256[8] calldata proof,
        uint256[] calldata publicInputs
    ) external view returns (bool);
}

contract ZKBridge {
    IZKBridgeVerifier public verifier;
    
    /// @notice Current Quasar validator set root (updated by light client)
    bytes32 public quasarValidatorSetRoot;
    
    mapping(bytes32 => bool) public claimed;
    
    event ZKBridgeClaimed(
        bytes32 indexed claimId,
        uint256 indexed sourceChainId,
        address indexed recipient,
        address token,
        uint256 amount
    );
    
    /// @notice Claim with ZK proof (verifies Quasar inside circuit)
    function claimWithZKProof(
        uint256[8] calldata proof,
        ClaimData calldata claim
    ) external returns (bytes32 claimId) {
        // 1. Build public inputs
        uint256[] memory publicInputs = new uint256[](7);
        publicInputs[0] = claim.sourceChainId;
        publicInputs[1] = block.chainid;
        publicInputs[2] = uint256(uint160(claim.token));
        publicInputs[3] = claim.amount;
        publicInputs[4] = uint256(uint160(claim.recipient));
        publicInputs[5] = claim.nonce;
        publicInputs[6] = uint256(quasarValidatorSetRoot);
        
        // 2. Verify ZK proof (BLS + Ringtail verified inside circuit!)
        require(verifier.verifyProof(proof, publicInputs), "Invalid proof");
        
        // 3. Replay protection
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

### 6. Z-Chain Proof Generation

```typescript
import { ZChainProver } from '@lux/zchain-sdk';

interface QuasarBridgeWitness {
    // Block data
    blockHash: string;
    receiptsRoot: string;
    
    // Quasar dual-cert
    blsSignature: { r: [bigint, bigint], s: bigint };
    ringtailSignature: bigint[];
    validatorBits: bigint;
    validators: QuasarValidator[];
    
    // Receipt proof
    receiptProof: string[];
    receipt: TransactionReceipt;
}

async function generateBridgeProofOnZChain(
    claim: ClaimData,
    witness: QuasarBridgeWitness
): Promise<{ proof: bigint[]; publicInputs: bigint[] }> {
    // Connect to Z-Chain prover network
    const prover = new ZChainProver({
        endpoint: 'https://zchain.lux.network/prover',
        circuit: 'quasar-bridge-v1'
    });
    
    // Submit proving job (runs on GPU cluster)
    const job = await prover.prove({
        publicInputs: {
            sourceChainId: claim.sourceChainId,
            destChainId: claim.destChainId,
            token: claim.token,
            amount: claim.amount,
            recipient: claim.recipient,
            nonce: claim.nonce,
            validatorSetRoot: computeValidatorSetRoot(witness.validators)
        },
        witness
    });
    
    // Wait for proof (typically 10-30 seconds on Z-Chain)
    const result = await job.waitForCompletion();
    
    return {
        proof: result.proof,  // 8 field elements for Groth16
        publicInputs: result.publicInputs
    };
}
```

### 7. zkFHE: Fully Private Bridge Execution

Z-Chain supports **Fully Homomorphic Encryption** for private smart contract execution:

```solidity
// Compile standard Solidity → runs privately on Z-Chain FHE runtime
contract PrivateBridgeClaim {
    // All values are FHE-encrypted on Z-Chain
    mapping(address => euint256) private balances;  // Encrypted balances
    
    /// @notice Claim with encrypted amount (ZK proves validity)
    function privateClaim(
        bytes calldata zkProof,
        ebytes calldata encryptedClaim  // FHE-encrypted claim data
    ) external {
        // 1. Verify ZK proof of valid source burn
        require(zkVerifier.verify(zkProof), "Invalid proof");
        
        // 2. Decrypt claim inside FHE (only Z-Chain can decrypt)
        ClaimData memory claim = fheDecrypt(encryptedClaim);
        
        // 3. Update encrypted balance
        balances[claim.recipient] = balances[claim.recipient] + claim.amount;
        
        // 4. Emit encrypted event (only recipient can decrypt)
        emit PrivateClaim(fheEncryptFor(claim.recipient, claim));
    }
}
```

**zkFHE Flow**:
```
User                    Z-Chain FHE Runtime              Ethereum
  │                            │                            │
  │─── Encrypted claim ───────▶│                            │
  │                            │─── Execute privately ──────│
  │                            │    (all values encrypted)  │
  │                            │                            │
  │                            │─── ZK proof of execution ─▶│
  │◀── Encrypted result ───────│                            │
  │                            │                            │
```

### 8. Proof Aggregation

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

ZK proofs solve the key challenge of Quasar → Ethereum bridging:

1. **Ringtail Verification**: Ringtail PQ signatures are expensive to verify on Ethereum (~2M gas). ZK wrapping reduces this to ~200k gas.

2. **Z-Chain Acceleration**: Dedicated proving infrastructure with GPU/FPGA acceleration for fast proof generation.

3. **FHE Option**: Same Z-Chain infrastructure enables fully private DeFi via zkFHE.

4. **Constant Gas Cost**: ~200k gas regardless of proof complexity.

5. **PQ-Safe**: Full post-quantum security from Lux, verified inside ZK circuit.

## Backwards Compatibility

This extends the bridge with an additional proof type:

```solidity
enum ProofType {
    MPC_ORACLE,      // LP-3001: Fast, trusted
    LIGHT_CLIENT,    // LP-6350 + LP-6351: Trustless, ~500k gas
    ZK_PROOF,        // LP-6352: Trustless, ~200k gas (this LP)
    ZK_PRIVATE       // LP-6353: Private bridging
}
```

## Test Cases

1. Generate valid Groth16 proof on Z-Chain
2. Verify Quasar dual-cert (BLS + Ringtail) inside circuit
3. Reject proof with only BLS signature (missing Ringtail)
4. Reject proof with invalid validator set root
5. Verify gas consumption < 250k on Ethereum
6. Test proof aggregation for batch claims
7. Verify zkFHE encrypted claim flow

## Reference Implementation

- Z-Chain Prover: `/zchain/prover/`
- Circuits: `/bridge/circuits/quasar-bridge.circom`
- Ringtail Circuit: `/bridge/circuits/ringtail.circom`
- Verifier: `/bridge/contracts/contracts/zk/Groth16Verifier.sol`
- FHE Runtime: `/zchain/fhe/`

## Security Considerations

1. **Trusted Setup**: Groth16 requires trusted setup. Z-Chain provides public ceremony participation.

2. **Circuit Soundness**: Both BLS and Ringtail verification must be complete in circuit. Missing constraints allow forged proofs.

3. **Validator Set Sync**: On-chain `quasarValidatorSetRoot` must track P-Chain validator changes.

4. **FHE Key Management**: zkFHE keys must be managed securely. Threshold FHE recommended for decentralization.

5. **Proof Malleability**: Use claim ID for replay protection, not proof bytes.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
