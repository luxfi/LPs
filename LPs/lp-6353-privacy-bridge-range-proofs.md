---
lp: 6353
title: Privacy Bridge with FHE-EVM Execution
description: Private cross-chain transfers using Bulletproofs, stealth addresses, and Z-Chain FHE-EVM for fully private DeFi execution.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-27
tags: [teleport, bridge, privacy, bulletproofs, stealth-address, fhe, z-chain, zkfhe]
requires: [3001, 6352]
order: 353
---

## Abstract

This LP specifies a privacy-preserving bridge using Bulletproofs for confidential transfers, stealth addresses for recipient privacy, and **Z-Chain FHE-EVM** for fully private smart contract execution. Users can bridge assets, execute DeFi operations, and withdraw—all without revealing amounts, addresses, or transaction logic on-chain.

The key innovation is **FHE-EVM**: compile standard Solidity to run on Z-Chain's Fully Homomorphic Encryption runtime, where all values remain encrypted throughout execution. Only ZK proofs of correct execution are published.

## Motivation

Current bridge implementations expose full transfer details:

| Data Exposed | Public | Bulletproofs | FHE-EVM |
|--------------|--------|--------------|---------|
| Amount | ✗ Visible | ✓ Hidden | ✓ Encrypted |
| Sender | ✗ Visible | ✓ Stealth | ✓ Encrypted |
| Recipient | ✗ Visible | ✓ Stealth | ✓ Encrypted |
| Token type | ✗ Visible | Configurable | ✓ Encrypted |
| DeFi logic | ✗ Visible | ✗ Visible | ✓ Encrypted |

**FHE-EVM** enables:

* **Fully Private DeFi**: Swap, lend, stake—all values encrypted
* **Compile-to-Private**: Standard Solidity → private execution
* **Encrypted State**: Contract storage is encrypted on Z-Chain
* **ZK Proofs Only**: Destination chains see only validity proofs

## Specification

### 1. Privacy Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Confidential Transfers (Bulletproofs + Stealth)                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Pedersen commitments: Hide amounts                                       │
│  • Bulletproofs: Prove range without revealing value                        │
│  • Stealth addresses: One-time recipient addresses (EIP-5564)               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: FHE-EVM Private Execution (Z-Chain)                               │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Compile Solidity → FHE bytecode                                          │
│  • All variables: euint256, ebool, eaddress (encrypted types)               │
│  • Execute on encrypted values (TFHE/Concrete operations)                   │
│  • Output: ZK proof of correct execution                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: Private Bridge Claims (ZK + FHE)                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • ZK proof: Valid burn on source chain (LP-6352)                           │
│  • FHE claim: Encrypted mint on destination                                 │
│  • Private withdrawal: Reveal only to recipient                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Cryptographic Primitives

#### 2.1 Pedersen Commitments

Hide amounts using additive homomorphic commitments:

```
Commitment = amount * G + blinding * H
```

Properties:
- **Hiding**: Cannot extract amount without blinding factor
- **Binding**: Cannot open to different amount
- **Homomorphic**: `C(a) + C(b) = C(a+b)`

#### 2.2 Bulletproofs

Prove amount is in valid range [0, 2^64) without revealing it:

```
RangeProof = Bulletproof.prove(amount, blinding, [0, 2^64))
```

Properties:
- Proof size: ~700 bytes (logarithmic in range size)
- Verification: ~50k gas
- No trusted setup required

#### 2.3 Stealth Addresses (EIP-5564)

```
// Sender generates ephemeral keypair
(r, R) = generateKeyPair()

// Compute shared secret with recipient's public key
sharedSecret = ECDH(r, recipientPublicKey)

// Derive one-time address
stealthAddress = recipientPublicKey + hash(sharedSecret) * G
```

### 3. FHE-EVM: Compile Solidity to Private

Z-Chain's FHE-EVM allows standard Solidity to execute on encrypted data:

```solidity
// BEFORE: Standard public Solidity
contract PublicDEX {
    mapping(address => uint256) public balances;
    
    function swap(uint256 amountIn, address tokenOut) public {
        require(balances[msg.sender] >= amountIn);
        uint256 amountOut = calculateOutput(amountIn);
        balances[msg.sender] -= amountIn;
        balances[msg.sender] += amountOut;
    }
}

// AFTER: FHE-EVM private execution (same logic, encrypted types)
contract PrivateDEX {
    mapping(eaddress => euint256) private balances;  // Encrypted!
    
    function swap(euint256 amountIn, eaddress tokenOut) public {
        // All operations happen on encrypted values
        ebool sufficient = balances[msg.sender].gte(amountIn);
        require(sufficient.decrypt());  // Only reveals true/false
        
        euint256 amountOut = calculateOutput(amountIn);  // Private calculation
        balances[msg.sender] = balances[msg.sender].sub(amountIn);
        balances[msg.sender] = balances[msg.sender].add(amountOut);
        
        // Emit encrypted event (only recipient can decrypt)
        emit PrivateSwap(amountIn.encryptFor(msg.sender));
    }
}
```

#### FHE Type System

```solidity
// Z-Chain FHE types (from @lux/fhe-evm)
euint8    // Encrypted uint8
euint16   // Encrypted uint16
euint32   // Encrypted uint32
euint64   // Encrypted uint64
euint256  // Encrypted uint256
ebool     // Encrypted bool
eaddress  // Encrypted address
ebytes32  // Encrypted bytes32

// Homomorphic operations
euint256.add(euint256)    // Encrypted addition
euint256.sub(euint256)    // Encrypted subtraction
euint256.mul(euint256)    // Encrypted multiplication
euint256.lt(euint256)     // Encrypted comparison → ebool
euint256.select(ebool, euint256)  // Encrypted conditional

// Decrypt (returns to public domain)
euint256.decrypt() → uint256     // Requires decryption key
euint256.encryptFor(address)     // Re-encrypt for specific recipient
```

### 4. Private Bridge Flow

```solidity
contract FHEPrivateBridge {
    IZKVerifier public zkVerifier;
    IFHERuntime public fheRuntime;
    
    // Encrypted balances per stealth address
    mapping(eaddress => euint256) private balances;
    
    // Nullifier set for replay protection
    mapping(bytes32 => bool) public nullifiers;
    
    /// @notice Private claim: ZK proof + FHE execution
    function privateClaim(
        bytes calldata zkProof,           // LP-6352 Quasar proof
        bytes calldata encryptedClaim,    // FHE-encrypted claim data
        bytes32 stealthAddress,           // One-time address
        bytes32 ephemeralPubKey           // For stealth derivation
    ) external {
        // 1. Verify ZK proof of valid source burn
        require(zkVerifier.verify(zkProof), "Invalid burn proof");
        
        // 2. Extract nullifier from proof public inputs
        bytes32 nullifier = extractNullifier(zkProof);
        require(!nullifiers[nullifier], "Already claimed");
        nullifiers[nullifier] = true;
        
        // 3. Decrypt claim inside FHE runtime (Z-Chain only)
        euint256 amount = fheRuntime.decrypt(encryptedClaim);
        
        // 4. Update encrypted balance at stealth address
        eaddress recipient = fheRuntime.toEAddress(stealthAddress);
        balances[recipient] = balances[recipient].add(amount);
        
        // 5. Emit announcement for recipient scanning
        emit PrivateClaim(ephemeralPubKey, stealthAddress);
    }
    
    /// @notice Private transfer (entirely in FHE domain)
    function privateTransfer(
        euint256 amount,
        bytes32 commitment,       // Pedersen commitment
        bytes calldata rangeProof,// Bulletproof
        eaddress recipient
    ) external {
        // Verify range proof (public verification)
        require(Bulletproofs.verify(commitment, rangeProof), "Invalid range");
        
        // All of this executes on encrypted values
        balances[msg.sender] = balances[msg.sender].sub(amount);
        balances[recipient] = balances[recipient].add(amount);
    }
    
    /// @notice Exit to public (reveal and withdraw)
    function reveal(
        bytes32 commitment,
        uint256 amount,
        uint256 blindingFactor,
        address recipient
    ) external {
        // Verify commitment opening
        require(verifyCommitment(commitment, amount, blindingFactor));
        
        // Convert from encrypted to public
        // (proves you know the amount without revealing it earlier)
        IERC20(token).transfer(recipient, amount);
    }
}
```

### 5. Private DeFi Composability

With FHE-EVM, entire DeFi protocols run privately:

```solidity
// Private AMM on Z-Chain
contract PrivateAMM {
    euint256 private reserve0;
    euint256 private reserve1;
    
    function privateSwap(
        euint256 amountIn,
        ebool zeroForOne
    ) external returns (euint256 amountOut) {
        // Constant product formula on encrypted values
        euint256 reserveIn = zeroForOne.select(reserve0, reserve1);
        euint256 reserveOut = zeroForOne.select(reserve1, reserve0);
        
        // amountOut = reserveOut * amountIn / (reserveIn + amountIn)
        euint256 numerator = reserveOut.mul(amountIn);
        euint256 denominator = reserveIn.add(amountIn);
        amountOut = numerator.div(denominator);
        
        // Update reserves (all encrypted)
        reserve0 = zeroForOne.select(
            reserve0.add(amountIn),
            reserve0.sub(amountOut)
        );
        reserve1 = zeroForOne.select(
            reserve1.sub(amountOut),
            reserve1.add(amountIn)
        );
    }
}

// Private lending on Z-Chain
contract PrivateLending {
    mapping(eaddress => euint256) private collateral;
    mapping(eaddress => euint256) private debt;
    
    function privateBorrow(
        euint256 collateralAmount,
        euint256 borrowAmount
    ) external {
        // Check collateral ratio (encrypted comparison)
        euint256 maxBorrow = collateralAmount.mul(75).div(100);
        ebool valid = borrowAmount.lte(maxBorrow);
        require(valid.decrypt(), "Undercollateralized");
        
        collateral[msg.sender] = collateral[msg.sender].add(collateralAmount);
        debt[msg.sender] = debt[msg.sender].add(borrowAmount);
    }
}
```

### 6. Stealth Address Registry

```solidity
contract StealthAddressRegistry {
    // Meta-address = (spendingPubKey, viewingPubKey)
    struct MetaAddress {
        bytes32 spendingPubKey;
        bytes32 viewingPubKey;
    }
    
    mapping(address => MetaAddress) public metaAddresses;
    
    event Announcement(
        bytes32 indexed ephemeralPubKey,
        bytes32 indexed stealthAddress,
        bytes32 viewTag  // First 4 bytes of shared secret for fast scanning
    );
    
    /// @notice Register stealth meta-address
    function register(
        bytes32 spendingPubKey,
        bytes32 viewingPubKey
    ) external {
        metaAddresses[msg.sender] = MetaAddress(spendingPubKey, viewingPubKey);
    }
    
    /// @notice Announce payment to stealth address
    function announce(
        bytes32 ephemeralPubKey,
        bytes32 stealthAddress,
        bytes32 viewTag
    ) external {
        emit Announcement(ephemeralPubKey, stealthAddress, viewTag);
    }
}
```

### 7. Client SDK

```typescript
import { FHEBridge, StealthAddress, Bulletproofs } from '@lux/privacy-sdk';

async function privateBridge(
    token: string,
    amount: bigint,
    recipientMetaAddress: MetaAddress
) {
    // 1. Generate stealth address for recipient
    const { stealthAddress, ephemeralPubKey, viewTag } = 
        StealthAddress.derive(recipientMetaAddress);
    
    // 2. Create Pedersen commitment + Bulletproof
    const { commitment, blinding, rangeProof } = 
        Bulletproofs.commit(amount);
    
    // 3. Encrypt claim data for FHE execution
    const encryptedClaim = await FHEBridge.encrypt({
        amount,
        blinding,
        recipient: stealthAddress
    });
    
    // 4. Generate ZK proof of source burn (LP-6352)
    const zkProof = await generateQuasarBridgeProof({
        commitment,
        sourceChain: 'ethereum',
        destChain: 'lux'
    });
    
    // 5. Submit to private bridge on Z-Chain
    const tx = await fheBridge.privateClaim(
        zkProof,
        encryptedClaim,
        stealthAddress,
        ephemeralPubKey
    );
    
    // 6. Return receipt for recipient scanning
    return { stealthAddress, ephemeralPubKey, viewTag, commitment };
}

// Recipient scans for payments
async function scanPayments(viewingKey: bigint) {
    const announcements = await registry.getAnnouncements();
    
    return announcements.filter(ann => {
        // Fast check using viewTag (first 4 bytes)
        const sharedSecret = ecdh(viewingKey, ann.ephemeralPubKey);
        const expectedViewTag = keccak256(sharedSecret).slice(0, 4);
        if (expectedViewTag !== ann.viewTag) return false;
        
        // Full stealth address derivation
        const expectedAddress = deriveStealthAddress(sharedSecret);
        return expectedAddress === ann.stealthAddress;
    });
}
```

### 8. zkFHE: Proof of Private Execution

Z-Chain generates ZK proofs that FHE execution was correct:

```
┌─────────────────────────────────────────────────────────────────┐
│  Z-Chain FHE Execution                                          │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  Input: Encrypted state + encrypted transaction                 │
│  Execution: FHE operations on ciphertexts                       │
│  Output: Encrypted new state + ZK proof of correct execution    │
│                                                                 │
│  ZK Proof proves:                                               │
│  1. FHE operations followed EVM semantics                       │
│  2. State transition is valid                                   │
│  3. No decryption occurred (except authorized reveals)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ ZK proof (~256 bytes)
┌─────────────────────────────────────────────────────────────────┐
│  Ethereum / Lux C-Chain                                         │
│  ───────────────────────────────────────────────────────────── │
│  Verify ZK proof (~200k gas)                                    │
│  Accept state root update                                       │
│  No visibility into actual values or logic                      │
└─────────────────────────────────────────────────────────────────┘
```

## Rationale

This LP combines three privacy technologies:

| Technology | Provides | Trade-off |
|------------|----------|-----------|
| Bulletproofs | Amount privacy | ~50k gas, ~700 byte proofs |
| Stealth Addresses | Recipient privacy | Scanning required |
| FHE-EVM | Full logic privacy | Higher computation cost |

**Why FHE-EVM?**
- Standard Solidity → private execution (no new language)
- Entire DeFi protocols run privately
- Only ZK proofs published (not encrypted data)
- Composable with existing contracts

## Backwards Compatibility

Private bridging is an additional proof type:

```solidity
enum ProofType {
    MPC_ORACLE,      // LP-3001: Fast
    LIGHT_CLIENT,    // LP-6350: Trustless
    ZK_PROOF,        // LP-6352: Efficient
    ZK_PRIVATE       // LP-6353: Private (this LP)
}
```

## Test Cases

1. Generate Bulletproof range proof
2. Derive and verify stealth addresses
3. Encrypt claim data for FHE execution
4. Execute private swap on FHE-EVM
5. Verify zkFHE execution proof
6. Scan and detect incoming private payments
7. Private transfer with change commitment
8. Reveal and exit to public tokens

## Reference Implementation

- Bulletproofs: `/bridge/contracts/contracts/privacy/Bulletproofs.sol`
- Stealth Registry: `/bridge/contracts/contracts/privacy/StealthAddressRegistry.sol`
- FHE Bridge: `/zchain/contracts/FHEPrivateBridge.sol`
- FHE-EVM Compiler: `/zchain/fhe-compiler/`
- Client SDK: `/bridge/sdk/src/privacy/`

## Security Considerations

1. **FHE Key Management**: Threshold FHE keys across Z-Chain validators. No single party can decrypt.

2. **Blinding Factor Security**: Random blinding factors must use secure randomness.

3. **View Key Separation**: Viewing keys for scanning, spending keys for transfers. Separate trust levels.

4. **Nullifier Uniqueness**: Deterministic derivation prevents cross-chain replay.

5. **FHE Performance**: FHE operations are ~1000x slower than plaintext. Z-Chain uses GPU/FPGA acceleration.

6. **Decryption Oracles**: Minimize decrypt() calls. Each reveal leaks information.

## References

- [Bulletproofs Paper](https://eprint.iacr.org/2017/1066)
- [EIP-5564: Stealth Addresses](https://eips.ethereum.org/EIPS/eip-5564)
- [Lux FHE Library](https://github.com/luxfi/fhe) - OpenFHE-based C++ implementation
- [Lux Lattice Library](https://github.com/luxfi/lattice) - Pure Go HE with multiparty support

