---
lp: 3009
title: LRC-3009 Transfer With Authorization
description: Gasless token transfers via cryptographic signatures (meta-transactions)
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
requires: 3020, 3026
tags: [lrc, token-standard, meta-tx, gasless]
order: 160
---

# LP-3009: LRC-3009 Transfer With Authorization

## Abstract

LRC-3009 enables gasless token transfers through cryptographic signatures, allowing third parties to submit transactions on behalf of token holders. This is the foundation for x402 payments and AI agent transactions. Compatible with ERC-3009.

## Motivation

Standard token transfers require:
- Sender holds native tokens for gas
- Sender initiates transaction directly
- No batching of multiple transfers

LRC-3009 enables:
- Gasless transfers (relayer pays gas)
- Delegated execution (AI agents, paymasters)
- Atomic batching of multiple transfers
- Foundation for x402 payment protocol

## Specification

### Core Interface

```solidity
interface ILRC3009 is ILRC20 {
    // Events
    event AuthorizationUsed(
        address indexed authorizer,
        bytes32 indexed nonce
    );
    
    event AuthorizationCanceled(
        address indexed authorizer,
        bytes32 indexed nonce
    );
    
    // Transfer with authorization
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes calldata signature
    ) external;
    
    // Receive with authorization (atomic claim)
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes calldata signature
    ) external;
    
    // Cancel authorization
    function cancelAuthorization(
        bytes32 nonce,
        bytes calldata signature
    ) external;
    
    // Check authorization state
    function authorizationState(
        address authorizer,
        bytes32 nonce
    ) external view returns (bool);
}
```

### EIP-712 Domain

```solidity
bytes32 constant DOMAIN_TYPEHASH = keccak256(
    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
);

bytes32 constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH = keccak256(
    "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
);

bytes32 constant RECEIVE_WITH_AUTHORIZATION_TYPEHASH = keccak256(
    "ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
);
```

### Implementation

```solidity
contract LRC3009Token is LRC20, ILRC3009 {
    mapping(address => mapping(bytes32 => bool)) private _authorizationStates;
    
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes calldata signature
    ) external {
        require(block.timestamp > validAfter, "Not yet valid");
        require(block.timestamp < validBefore, "Expired");
        require(!_authorizationStates[from][nonce], "Already used");
        
        // Verify signature
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
            from, to, value, validAfter, validBefore, nonce
        )));
        
        address signer = ECDSA.recover(digest, signature);
        require(signer == from, "Invalid signature");
        
        // Mark as used
        _authorizationStates[from][nonce] = true;
        emit AuthorizationUsed(from, nonce);
        
        // Execute transfer
        _transfer(from, to, value);
    }
    
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes calldata signature
    ) external {
        require(msg.sender == to, "Caller must be recipient");
        // ... same validation and transfer logic
    }
}
```

### Nonce Management

```solidity
// Random nonces (not sequential) for parallel execution
bytes32 nonce = keccak256(abi.encodePacked(
    block.timestamp,
    msg.sender,
    randomness
));

// Nonces are single-use, no ordering required
```

## Use Cases

### Gasless Onboarding
```solidity
// User signs authorization off-chain
// Relayer submits to blockchain
// User receives tokens without holding ETH
```

### x402 Payments
```solidity
// AI agent creates authorization
// x402 facilitator executes payment
// HTTP 402 response cleared
```

### Batched Transfers
```solidity
function batchTransferWithAuth(
    Authorization[] calldata auths
) external {
    for (uint i = 0; i < auths.length; i++) {
        transferWithAuthorization(
            auths[i].from,
            auths[i].to,
            auths[i].value,
            auths[i].validAfter,
            auths[i].validBefore,
            auths[i].nonce,
            auths[i].signature
        );
    }
}
```

## Rationale

- EIP-712 typed signatures for security
- Random nonces enable parallel execution
- Time bounds prevent stale authorizations
- Recipient-initiated variant prevents frontrunning

## Backwards Compatibility

This standard is fully backwards compatible with existing ERC-20 tokens. The authorization mechanism is additive and does not modify core transfer behavior. Tokens can implement this standard alongside existing transfer functions.

## Security Considerations

- Replay protection via nonce tracking
- Time bounds prevent indefinite validity
- Domain separation prevents cross-chain replay
- Cancellation available for pending authorizations

## References

- [ERC-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009)
- [x402 Payment Protocol](https://x402.org)
- [LP-3026: LRC-2612 Permit](./lp-3026-lrc-2612-permit-extension.md)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
