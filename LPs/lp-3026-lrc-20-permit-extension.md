---
lp: 3026
title: LRC-20 Permit Extension
description: Gasless approval extension for LRC-20 tokens via EIP-2612 signatures
author: Lux Industries (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: LRC
created: 2025-12-25
requires: [3020]
tags: [lrc-20, token, permit, gasless, eip-2612]
order: 3026
---

# LP-3026: LRC-20 Permit Extension

## Abstract

This LP defines the Permit extension for LRC-20 tokens, enabling gasless approvals through EIP-2612 signatures.

## Motivation

Traditional ERC-20 approvals require a separate transaction, creating friction:
- Users must hold native tokens for gas
- Two transactions needed for approve-then-transfer flows
- Poor UX for new users without gas tokens

The Permit extension solves this by allowing approvals via off-chain signatures.

## Specification

### Interface

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.31;

import "./ILRC20.sol";

/**
 * @title ILRC20Permit
 * @notice LRC-20 extension for gasless approvals (EIP-2612)
 */
interface ILRC20Permit is ILRC20 {
    /**
     * @notice Sets allowance via signature
     * @param owner Token owner
     * @param spender Approved spender
     * @param value Approval amount
     * @param deadline Signature expiry timestamp
     * @param v Recovery byte
     * @param r ECDSA signature r
     * @param s ECDSA signature s
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @notice Returns current nonce for address
     * @param owner Token owner
     * @return Current nonce
     */
    function nonces(address owner) external view returns (uint256);

    /**
     * @notice Returns EIP-712 domain separator
     * @return Domain separator hash
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}
```

### EIP-712 Typed Data

```solidity
bytes32 public constant PERMIT_TYPEHASH = keccak256(
    "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
);
```

### Implementation

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.31;

import "./LRC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title LRC20Permit
 * @notice LRC-20 with EIP-2612 permit functionality
 */
abstract contract LRC20Permit is LRC20, EIP712 {
    bytes32 private constant PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    mapping(address owner => uint256) private _nonces;

    error LRC20PermitExpiredSignature(uint256 deadline);
    error LRC20PermitInvalidSigner(address signer, address owner);

    constructor(string memory name) EIP712(name, "1") {}

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        if (block.timestamp > deadline) {
            revert LRC20PermitExpiredSignature(deadline);
        }

        bytes32 structHash = keccak256(
            abi.encode(PERMIT_TYPEHASH, owner, spender, value, _useNonce(owner), deadline)
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, v, r, s);

        if (signer != owner) {
            revert LRC20PermitInvalidSigner(signer, owner);
        }

        _approve(owner, spender, value);
    }

    function nonces(address owner) public view virtual returns (uint256) {
        return _nonces[owner];
    }

    function DOMAIN_SEPARATOR() external view virtual returns (bytes32) {
        return _domainSeparatorV4();
    }

    function _useNonce(address owner) internal virtual returns (uint256) {
        unchecked {
            return _nonces[owner]++;
        }
    }
}
```

## Rationale

### EIP-2612 Compliance

Full compliance with EIP-2612 ensures:
- Interoperability with existing tools (Uniswap, etc.)
- Standard signature format
- Familiar developer experience

### Nonce Mechanism

Sequential nonces prevent:
- Replay attacks
- Double-spending of permits
- Out-of-order execution issues

## Backwards Compatibility

This extension is fully compatible with LRC-20 (LP-3020). Standard `approve()` functionality remains available.

## Security Considerations

1. **Deadline Validation**: Always validate signature deadline
2. **Nonce Tracking**: Nonces must increment atomically
3. **Domain Separation**: Use EIP-712 domain separator to prevent cross-chain/contract replay
4. **Front-Running**: Permits can be front-run; consider using permits within atomic transactions

## Reference Implementation

- `~/work/lux/standard/contracts/tokens/LRC20/LRC20Permit.sol`

## Related LPs

- **LP-3020**: LRC-20 Fungible Token Standard (base)
- **LP-3612**: LRC-2612 Permit Extension (detailed specification)
- **LP-3009**: Transfer with Authorization

---

**Document Maintainer**: Lux Industries
**Last Updated**: 2025-12-25
```
