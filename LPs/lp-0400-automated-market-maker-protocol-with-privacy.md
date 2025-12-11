---
lp: 0400
title: Automated Market Maker Protocol with Privacy
description: Privacy-preserving AMM protocol with zkSNARK proofs for confidential swaps and MEV protection
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-24
requires: 20, 2
---

## Abstract

This LP defines a privacy-preserving Automated Market Maker (AMM) protocol for Lux Network that combines traditional AMM mechanics with zero-knowledge proofs, enabling confidential swaps while maintaining MEV resistance. The protocol leverages zkSNARKs for transaction privacy, homomorphic encryption for private order books, and commit-reveal schemes for front-running protection.

## Motivation

Traditional AMMs expose all transaction details on-chain, enabling:
- Front-running and sandwich attacks
- MEV extraction at users' expense
- Privacy violations for traders
- Information leakage about trading strategies

This standard addresses these issues through cryptographic privacy while maintaining:
- Liquidity provider transparency
- Verifiable fair pricing
- Regulatory compliance options
- Capital efficiency

## Specification

### Core Privacy AMM Interface

```solidity
interface IPrivateAMM {
    // Commitment structure for private swaps
    struct SwapCommitment {
        bytes32 commitment;      // Hash of swap parameters
        uint256 timestamp;
        address committer;
        bool revealed;
    }

    // Zero-knowledge swap proof
    struct ZKSwapProof {
        bytes32 nullifier;       // Prevents double-spending
        bytes32 outputCommitment; // Commitment to output amounts
        bytes zkProof;           // zkSNARK proof
        bytes32 merkleRoot;      // State root for verification
    }

    // Events
    event PrivateSwapCommitted(
        bytes32 indexed commitment,
        address indexed committer,
        uint256 deadline
    );

    event PrivateSwapExecuted(
        bytes32 indexed nullifier,
        bytes32 outputCommitment
    );

    event ConfidentialLiquidityAdded(
        bytes32 indexed commitment,
        bytes32 poolId
    );

    // Commit-reveal swap mechanism
    function commitSwap(
        bytes32 commitment,
        uint256 deadline
    ) external payable returns (bytes32 swapId);

    function revealAndExecuteSwap(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline,
        uint256 nonce
    ) external returns (uint256[] memory amounts);

    // Zero-knowledge swap
    function privateSwap(
        ZKSwapProof calldata proof,
        bytes calldata encryptedData
    ) external returns (bool success);

    // Verify swap proof without execution
    function verifySwapProof(
        ZKSwapProof calldata proof
    ) external view returns (bool valid);
}
```

### Homomorphic Order Book

```solidity
interface IHomomorphicOrderBook {
    // Encrypted order structure
    struct EncryptedOrder {
        bytes encryptedAmount;    // Homomorphically encrypted amount
        bytes encryptedPrice;     // Homomorphically encrypted price
        bytes32 traderId;         // Anonymous trader identifier
        uint256 timestamp;
        bytes publicKey;          // For response encryption
    }

    // Private market making
    struct PrivateMarketMaker {
        bytes32 mmId;             // Anonymous MM identifier
        bytes encryptedLiquidity; // Total liquidity (encrypted)
        uint256 feeRate;          // Public fee rate
        bytes zkCredential;       // Proof of liquidity
    }

    event EncryptedOrderPlaced(
        bytes32 indexed orderId,
        bytes32 indexed traderId,
        bytes encryptedData
    );

    event PrivateMatchExecuted(
        bytes32 indexed orderId,
        bytes32 nullifier,
        bytes encryptedResult
    );

    function placeEncryptedOrder(
        EncryptedOrder calldata order
    ) external returns (bytes32 orderId);

    function matchOrders(
        bytes32 orderId1,
        bytes32 orderId2,
        bytes calldata matchProof
    ) external returns (bytes encryptedResult);

    function addPrivateLiquidity(
        bytes calldata encryptedAmount,
        bytes calldata liquidityProof
    ) external returns (bytes32 positionId);
}
```

### MEV Protection Layer

```solidity
interface IMEVProtection {
    // Time-locked transaction
    struct TimeLockTx {
        bytes32 txHash;
        uint256 unlockTime;
        uint256 priority;
        bytes encryptedContent;
    }

    // Batch auction for fair ordering
    struct BatchAuction {
        uint256 startBlock;
        uint256 endBlock;
        bytes32 merkleRoot;      // Root of all committed trades
        uint256 clearingPrice;
        bool settled;
    }

    event BatchAuctionCreated(
        uint256 indexed auctionId,
        uint256 startBlock,
        uint256 endBlock
    );

    event TradeCommittedToBatch(
        uint256 indexed auctionId,
        bytes32 commitment
    );

    event BatchSettled(
        uint256 indexed auctionId,
        uint256 clearingPrice,
        bytes32 merkleRoot
    );

    function submitToMempool(
        bytes calldata encryptedTx,
        uint256 maxDelay
    ) external payable returns (bytes32 txId);

    function commitToBatch(
        uint256 auctionId,
        bytes32 tradeCommitment
    ) external;

    function settleBatch(
        uint256 auctionId,
        uint256 clearingPrice,
        bytes32[] calldata merkleProof
    ) external;

    function executeTimeLocked(
        bytes32 txId,
        bytes calldata decryptionKey
    ) external;
}
```

### zkSNARK Circuit Specifications

```solidity
interface IZKSwapCircuit {
    // Public inputs for swap verification
    struct PublicInputs {
        bytes32 nullifierHash;
        bytes32 outputCommitmentHash;
        bytes32 poolStateRoot;
        uint256 timestamp;
    }

    // Private witness for swap proof
    struct PrivateWitness {
        uint256 inputAmount;
        uint256 outputAmount;
        address tokenIn;
        address tokenOut;
        uint256 nonce;
        bytes32 secret;
    }

    // Verify swap maintains constant product
    function verifyConstantProduct(
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 amountIn,
        uint256 amountOut,
        bytes calldata proof
    ) external view returns (bool);

    // Verify slippage tolerance
    function verifySlippage(
        uint256 amountOut,
        uint256 amountOutMin,
        bytes calldata proof
    ) external view returns (bool);

    // Verify fee calculation
    function verifyFees(
        uint256 amountIn,
        uint256 fee,
        uint256 feeRate,
        bytes calldata proof
    ) external view returns (bool);
}
```

### Confidential Liquidity Provision

```solidity
interface IConfidentialLP {
    // Private liquidity position
    struct PrivatePosition {
        bytes32 positionId;
        bytes32 commitment;       // Commitment to amounts
        bytes encryptedData;      // Encrypted position details
        uint256 unlockTime;
        bytes32 nullifier;        // For withdrawal
    }

    // Shielded pool state
    struct ShieldedPool {
        bytes32 liquidityRoot;    // Merkle root of all positions
        bytes totalEncrypted;     // Homomorphic sum of liquidity
        uint256 publicReserve;    // Publicly visible reserve
        uint256 privateReserve;   // Approximate private reserve
    }

    event PrivateLiquidityAdded(
        bytes32 indexed positionId,
        bytes32 commitment
    );

    event PrivateLiquidityRemoved(
        bytes32 indexed nullifier,
        bytes32 newCommitment
    );

    function addPrivateLiquidity(
        bytes32 commitment,
        bytes calldata zkProof,
        bytes calldata encryptedAmounts
    ) external returns (bytes32 positionId);

    function removePrivateLiquidity(
        bytes32 positionId,
        bytes32 nullifier,
        bytes calldata zkProof
    ) external returns (bytes encryptedAmounts);

    function rebalancePrivatePool(
        bytes32 poolId,
        bytes calldata rebalanceProof
    ) external;
}
```

### Regulatory Compliance Module

```solidity
interface ICompliantPrivateAMM {
    // Viewing key for authorized parties
    struct ViewingKey {
        address authority;
        bytes publicKey;
        uint256 accessLevel;
        uint256 expiry;
    }

    // Selective disclosure
    struct DisclosureRequest {
        bytes32 transactionId;
        address requester;
        string reason;
        bytes signature;
    }

    event ViewingKeyGranted(
        address indexed authority,
        uint256 accessLevel
    );

    event SelectiveDisclosure(
        bytes32 indexed transactionId,
        address indexed authority
    );

    function grantViewingKey(
        address authority,
        bytes calldata publicKey,
        uint256 accessLevel
    ) external;

    function requestDisclosure(
        bytes32 transactionId,
        string calldata reason
    ) external returns (bytes encryptedData);

    function auditTransaction(
        bytes32 transactionId,
        bytes calldata viewingKey
    ) external view returns (
        uint256 amountIn,
        uint256 amountOut,
        address tokenIn,
        address tokenOut
    );
}
```

## Rationale

### zkSNARK-based Privacy

Zero-knowledge proofs provide:
- Complete transaction privacy
- Verifiable correctness without revealing details
- Efficient on-chain verification
- Composability with other protocols

### Commit-Reveal for MEV Protection

The commit-reveal pattern ensures:
- Transactions cannot be front-run
- Order flow remains private until execution
- Fair ordering through time-based priority
- Protection against sandwich attacks

### Homomorphic Encryption for Order Books

Enables:
- Private order matching
- Encrypted liquidity aggregation
- Statistical arbitrage prevention
- Market maker privacy

### Hybrid Public-Private Pools

Maintaining both public and private liquidity:
- Ensures price discovery
- Provides fallback liquidity
- Enables gradual privacy adoption
- Supports regulatory requirements

## Test Cases

### Private Swap Test

```solidity
function testPrivateSwap() public {
    IPrivateAMM privateAMM = IPrivateAMM(ammAddress);

    // Create swap commitment
    uint256 amountIn = 1000 * 10**18;
    uint256 nonce = 12345;
    bytes32 commitment = keccak256(abi.encode(
        amountIn,
        amountOutMin,
        path,
        msg.sender,
        nonce
    ));

    // Commit phase
    bytes32 swapId = privateAMM.commitSwap(
        commitment,
        block.timestamp + 100
    );

    // Wait for commitment period
    vm.warp(block.timestamp + 10);

    // Reveal and execute
    uint256[] memory amounts = privateAMM.revealAndExecuteSwap(
        amountIn,
        amountOutMin,
        path,
        msg.sender,
        deadline,
        nonce
    );

    assertTrue(amounts[amounts.length - 1] >= amountOutMin);
}
```

### zkSNARK Swap Verification

```solidity
function testZKSwapProof() public {
    IPrivateAMM privateAMM = IPrivateAMM(ammAddress);

    // Generate ZK proof (off-chain)
    ZKSwapProof memory proof = generateSwapProof(
        1000 * 10**18,  // input amount
        500 * 10**18,   // output amount
        address(tokenA),
        address(tokenB),
        nonce
    );

    // Verify proof on-chain
    assertTrue(privateAMM.verifySwapProof(proof));

    // Execute private swap
    bool success = privateAMM.privateSwap(
        proof,
        encryptedSwapData
    );

    assertTrue(success);
}
```

## Backwards Compatibility

This LP introduces a new protocol that can coexist with existing AMM implementations:

- **Existing Pools**: Standard Uniswap/SushiSwap-style pools continue to operate unchanged
- **Liquidity Migration**: LPs can choose to migrate liquidity to privacy-enabled pools
- **Interface Compatibility**: Core swap interface remains compatible with existing DEX aggregators
- **Token Standards**: Compatible with existing LRC-20 and ERC-20 tokens
- **Router Integration**: Private AMM exposes standard `swap()` interface with additional privacy parameters

**Migration Path**:
1. Deploy PrivateAMM contracts alongside existing pools
2. Create private pools for high-value pairs
3. Update DEX aggregators to route through private pools when privacy is requested
4. Existing integrations continue to work with public pools

## Security Considerations

### Cryptographic Assumptions

- zkSNARK security relies on proper trusted setup
- Use of Groth16 or PLONK proving systems
- Regular security audits of circuits
- Secure randomness for commitments

### Privacy Guarantees

- Nullifiers prevent double-spending
- Commitments hide transaction details
- Merkle trees provide membership proofs
- Time delays prevent correlation attacks

### MEV Resistance

- Commit-reveal prevents front-running
- Batch auctions ensure fair ordering
- Encrypted mempool protects pending transactions
- Time-locks prevent sandwich attacks

### Emergency Procedures

```solidity
function emergencyReveal(bytes32 txId) external onlyGovernance {
    // Force reveal for stuck transactions
}

function pausePrivateSwaps() external onlyGovernance {
    // Emergency pause for private operations
}
```

## Implementation

### Reference Implementation

**Primary Locations**:
- Privacy protocols: `standard/src/privacy/`
- AMM reference: `standard/deploy/19_uniswapv2.ts` (base AMM structure)
- EVM precompiles: `evm/precompile/contracts/pqcrypto/`

**Implementation Components**:

1. **Zero-Knowledge Circuits** (`standard/src/privacy/circuits/`)
   - Pederson commitment implementations
   - Range proof circuits (bulletproofs)
   - Balance validation circuits
   - Swap correctness proofs

2. **Homomorphic Encryption Module** (`standard/src/privacy/encryption/`)
   - Paillier homomorphic encryption (used in order books)
   - Encrypted arithmetic for price aggregation
   - Safe key generation and management

3. **Privacy AMM Implementation** (`standard/src/privacy/amm/`)
   - `IPrivateAMM.sol` - Core interface and contract
   - `CommitReveal.sol` - Commit-reveal swap mechanism
   - `OrderBook.sol` - Encrypted order book with homomorphic matching
   - `MixingPool.sol` - Privacy mixer for MEV prevention

4. **zkSNARK Verifier Integration** (`evm/precompile/contracts/pqcrypto/`)
   - Groth16 proof verification via precompile address `0x0200000000000000000000000000000000000008`
   - PLONK proof support (extensible interface)
   - Gas-efficient on-chain verification

5. **Consensus Integration** (`node/vms/platformvm/`)
   - MEV protection via validator filtering
   - Commit-reveal block production coordination
   - Encrypted mempool implementation references

**Related Specifications**:
- **LP-402**: Zero-Knowledge Swap Protocol (detailed privacy primitives)
- **LP-311**: ML-DSA Post-Quantum Signatures (for validator proofs)
- **LP-700**: Quasar Consensus (native privacy features)

**Testing**:
- Unit tests: `standard/src/privacy/test/*.spec.ts`
- Integration tests for AMM + privacy layer
- Gas benchmarks for on-chain verification

**GitHub Repository**: https://github.com/luxfi/standard/tree/main/src/privacy

## References

1. Buterin, V., et al. "Automated Market Makers with Concentrated Liquidity." 2021.
2. Ben-Sasson, E., et al. "Zerocash: Decentralized Anonymous Payments from Bitcoin." 2014.
3. Bünz, B., et al. "Zether: Towards Privacy in a Smart Contract World." 2020.
4. Aztec Protocol. "Privacy-Preserving DeFi on Ethereum." 2021.
5. Penumbra. "Private Decentralized Exchange." 2022.
6. Anoma. "Intent-Centric Privacy Architecture." 2023.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).