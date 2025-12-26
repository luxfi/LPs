---
lp: 3670
title: EOA Account Code (EIP-7702)
description: Set code for EOAs enabling smart account features without migration
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-01-23
tags: [core, evm, account-abstraction]
order: 1000
---

# LP-3670: EOA Account Code (EIP-7702)

## Abstract

This LP enables EOAs (Externally Owned Accounts) to temporarily delegate to smart contract code, providing smart account features without permanent migration. Compatible with EIP-7702 from the Pectra upgrade.

## Motivation

Account abstraction requires smart contract wallets, but:
- Users have assets in EOAs
- Migration is complex and risky  
- Gas sponsorship needs contract logic

EIP-7702 allows EOAs to act as smart accounts temporarily:
- No migration required
- Backwards compatible
- Enables batching, sponsorship, permissions

## Specification

### New Transaction Type (0x04)

```go
type SetCodeTransaction struct {
    ChainID     *big.Int
    Nonce       uint64
    MaxPriorityFeePerGas *big.Int
    MaxFeePerGas *big.Int
    Gas         uint64
    To          *common.Address
    Value       *big.Int
    Data        []byte
    AccessList  AccessList
    
    // NEW: Code delegation authorizations
    AuthorizationList []Authorization
}

type Authorization struct {
    ChainID   uint256
    Address   common.Address  // Contract to delegate to
    Nonce     uint64
    V, R, S   *big.Int        // Signature from EOA
}
```

### Authorization Signature

EOAs sign authorization to delegate:

```go
func SignAuthorization(
    chainID *big.Int,
    contractAddress common.Address,
    nonce uint64,
    privateKey *ecdsa.PrivateKey,
) (v, r, s *big.Int, err error) {
    // MAGIC prefix for domain separation
    message := []byte{0x05}
    message = append(message, rlpEncode(chainID, contractAddress, nonce)...)
    
    hash := crypto.Keccak256Hash(message)
    return sign(hash, privateKey)
}
```

### Account State

During transaction execution:

```go
func (evm *EVM) ProcessSetCodeTx(tx *SetCodeTransaction) error {
    for _, auth := range tx.AuthorizationList {
        // Verify signature
        signer := recoverSigner(auth)
        
        // Check nonce matches EOA's current nonce
        if evm.StateDB.GetNonce(signer) != auth.Nonce {
            continue // Skip invalid
        }
        
        // Set delegation for this transaction
        code := evm.StateDB.GetCode(auth.Address)
        evm.StateDB.SetCode(signer, code)
        
        // Increment nonce
        evm.StateDB.SetNonce(signer, auth.Nonce + 1)
    }
    
    // Execute transaction with EOA having contract code
    return evm.Call(...)
}
```

### Delegation Persistence

Code delegation persists until:
- EOA sends another transaction (nonce increment)
- Explicit revocation via empty authorization

```go
// Revoke delegation
auth := Authorization{
    ChainID:  chainID,
    Address:  common.Address{}, // Zero address = revoke
    Nonce:    currentNonce,
}
```

### Gas Costs

| Operation | Gas |
|-----------|-----|
| Authorization (cold) | 2500 |
| Authorization (warm) | 100 |
| Per authorization in list | 12500 |

## Use Cases

### Batched Transactions
```solidity
// Smart contract code that EOA delegates to
contract BatchExecutor {
    function execute(Call[] calldata calls) external {
        for (uint i = 0; i < calls.length; i++) {
            calls[i].target.call(calls[i].data);
        }
    }
}
```

### Gas Sponsorship
```solidity
contract SponsoredExecution {
    function executeSponsored(
        address sponsor,
        bytes calldata userOp,
        bytes calldata sponsorSig
    ) external {
        // Verify sponsor signature
        // Execute user operation
        // Sponsor pays gas
    }
}
```

## Rationale

EIP-7702 chosen over EIP-3074:
- More flexible (any contract code)
- Better security (explicit authorization)
- Simpler implementation

## Backwards Compatibility

- EOAs still function normally
- New tx type ignored by old nodes
- No state format changes

## Security Considerations

- Authorization replay prevented by nonce
- Chain ID binding prevents cross-chain replay
- Revocation available via empty authorization

## References

- [EIP-7702: Set EOA Account Code](https://eips.ethereum.org/EIPS/eip-7702)
- [LP-3337: LRC-4337 Account Abstraction](./lp-3337-lrc-4337-account-abstraction.md)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
