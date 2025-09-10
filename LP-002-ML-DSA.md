# LP-002: ML-DSA (FIPS 204) Integration with EVM Optimizations

## Summary
Integrate ML-DSA (Module-Lattice Digital Signature Algorithm, formerly CRYSTALS-Dilithium) as specified in FIPS 204 into the Lux blockchain, with EVM-optimized variants based on ZKNOX's ETHDILITHIUM research.

## Motivation
ML-DSA provides quantum-resistant digital signatures essential for:
- Transaction authentication
- Smart contract signatures
- Validator attestations
- Certificate signing

Based on ZKNOX's research, we implement both NIST-compliant and EVM-optimized versions.

## Specification

### Algorithm Variants

#### Standard ML-DSA (NIST FIPS 204)
- **ML-DSA-44**: Level 2, 1312B pubkey, 2420B signature
- **ML-DSA-65**: Level 3, 1952B pubkey, 3309B signature (recommended)
- **ML-DSA-87**: Level 5, 2592B pubkey, 4627B signature

#### ETH-ML-DSA (EVM-Optimized)
Based on ETHDILITHIUM optimizations:
- Replace SHAKE with Keccak256 (native EVM opcode)
- Precomputed NTT representations
- Uncompressed format for gas efficiency
- **Result**: 20KB pubkey, 9KB signature, 8.8M gas → 4M gas

### Implementation Details

#### Core Library (`/crypto/mldsa/`)
```go
// Standard NIST version
func VerifyMLDSA(sig, msg, pubkey []byte) bool {
    // Uses SHAKE for hashing
    // Compressed encoding
    // ~13M gas on EVM
}

// EVM-optimized version
func VerifyETHMLDSA(sig, msg, pubkeyNTT []byte) bool {
    // Uses Keccak256 (EVM native)
    // NTT precomputed
    // ~4M gas on EVM
}
```

#### Precompiled Contracts
```solidity
// Standard ML-DSA verification
0x110: ML-DSA-44 verify (5M gas)
0x111: ML-DSA-65 verify (7M gas)
0x112: ML-DSA-87 verify (10M gas)

// ETH-optimized verification
0x113: ETH-ML-DSA verify (4M gas)
```

### Key Optimizations (from ZKNOX research)

#### 1. PRNG Replacement
```solidity
// Original: SHAKE-based expansion (4M gas)
function expandSeed(seed) {
    return SHAKE256(seed, outputLen);
}

// Optimized: Keccak counter mode (500K gas)
function expandSeedKeccak(seed) {
    for (uint i = 0; i < blocks; i++) {
        output[i] = keccak256(seed || i);
    }
}
```

#### 2. NTT Optimization
```solidity
// Precompute NTT of public key
pubkeyNTT = NTT_forward(pubkey);
// Store NTT representation on-chain

// Verification uses only forward NTT
verify(sig, msg, pubkeyNTT) {
    sigNTT = NTT_forward(sig);
    // No inverse NTT needed
}
```

#### 3. Encoding Trade-offs
```
Standard ML-DSA: Compressed, 3.3KB signature, 13M gas
ETH-ML-DSA: Uncompressed, 9KB signature, 4M gas
```

### Use Cases

#### 1. Transaction Signing
```go
// Hybrid signing for transition period
tx := Transaction{...}
classicalSig := ecdsa.Sign(tx.Hash())
quantumSig := mldsa.Sign(tx.Hash())
tx.Signatures = append(classicalSig, quantumSig)
```

#### 2. Smart Contract Verification
```solidity
contract QuantumSafeMultisig {
    function verifyMLDSA(
        bytes32 msgHash,
        bytes memory signature,
        bytes memory pubkey
    ) external view returns (bool) {
        // Call ETH-ML-DSA precompile
        (bool success, bytes memory result) = 
            address(0x113).staticcall(
                abi.encode(msgHash, signature, pubkey)
            );
        return success && uint256(bytes32(result)) == 1;
    }
}
```

#### 3. Validator Signatures
```go
// Validators can choose signature scheme
validator := Validator{
    ClassicalKey: ecdsaKey,
    QuantumKey:   mldsaKey,
    Preference:   "ml-dsa-65",
}
```

### Hardware Considerations (from ZKNOX insights)

ML-DSA advantages for hardware:
- **Simple arithmetic**: No floating-point operations
- **Deterministic signing**: No complex samplers
- **Memory efficient**: Lower RAM requirements than FALCON
- **Secure element friendly**: Expected hardware wallet support

### Comparison Table (from ZKNOX data)

| Feature | FALCON | ML-DSA |
|---------|--------|--------|
| Verification Gas | 1.9M ✅ | 4M ❌ |
| Signature Size | 1KB ✅ | 9KB ❌ |
| Pubkey Size | 1KB ✅ | 20KB ❌ |
| Signer Complexity | Complex ❌ | Simple ✅ |
| Hardware Support | Limited ❌ | Good ✅ |
| MPC Friendly | No ❌ | Yes ✅ |
| ZK Friendly | No ❌ | Yes ✅ |

## Migration Strategy

### Phase 1: Dual Signatures (Month 1-3)
- Deploy ML-DSA alongside ECDSA
- Both signatures required

### Phase 2: ML-DSA Primary (Month 4-6)
- ML-DSA becomes primary
- ECDSA as fallback

### Phase 3: Quantum-Safe (Month 7+)
- ML-DSA only for new accounts
- Legacy support for ECDSA

## Gas Cost Analysis

```
Operation           | Standard | ETH-Optimized | With EVMMAX (future)
--------------------|----------|---------------|--------------------
ML-DSA-65 Verify    | 13M      | 4M            | 1M
Signature Storage   | 105K     | 295K          | 295K
Public Key Storage  | 62K      | 656K          | 656K
```

## Test Cases

```solidity
contract TestMLDSA {
    function testETHMLDSAVerification() public {
        bytes memory pubkeyNTT = hex"..."; // 20KB
        bytes memory signature = hex"...";  // 9KB
        bytes32 message = keccak256("test");
        
        // Verify using ETH-ML-DSA precompile
        bool valid = verifyETHMLDSA(
            message,
            signature,
            pubkeyNTT
        );
        
        require(valid, "Invalid signature");
    }
}
```

## Security Considerations

### Quantum Security
- Based on Module-LWE and Module-SIS problems
- 128/192/256-bit quantum security levels

### Implementation Security
- Constant-time operations
- No secret-dependent branches
- Protected against side-channels

### Signature Malleability
- Fixed coefficient signs (ZKNOX approach)
- Unique encoding enforcement
- Replay protection via nonces

## Future Work

### ZK-ML-DSA
- BabyBear field adaptation for STARKs
- RISC0 compatibility
- 2-3x proving efficiency vs FALCON

### MPC-ML-DSA
- Threshold signatures
- TSS wallet integration
- Distributed key generation

### EVMMAX Optimization
- Potential 4x speedup (4M → 1M gas)
- Native modular arithmetic
- Awaiting EIP-6690

## Implementation Timeline
- Week 1-2: Core ML-DSA implementation
- Week 3: ETH-ML-DSA optimizations
- Week 4: EVM precompiles
- Week 5: Hardware wallet integration
- Week 6: Audit and testing

## Acknowledgments
Special thanks to ZKNOX team for their groundbreaking work on ETHDILITHIUM and gas optimizations.

## References
- [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final)
- [ZKNOX ETHDILITHIUM](https://github.com/ZKNOX/ETHDILITHIUM)
- [Dilithium Specification](https://pq-crystals.org/dilithium/)
- [EIP-6690 EVMMAX](https://eips.ethereum.org/EIPS/eip-6690)

## Copyright
Copyright (C) 2025, Lux Industries Inc. All rights reserved.