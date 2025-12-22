---
lp: 3528
title: LRC-5528 Refundable Token
description: Tokens with built-in escrow and refund mechanics for reversible payments
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 3020
tags: [lrc, token-standard, escrow, payments]
order: 3528
---

# LP-3528: LRC-5528 Refundable Fungible Token

## Abstract

LRC-5528 extends LRC-20 with escrow-based refundable transfers, enabling reversible payments with dispute resolution. Funds are held in escrow until confirmed or refunded.

## Motivation

Irreversible crypto payments cause problems:
- No recourse for fraud/mistakes
- Difficult for commerce adoption
- Trust required before payment

LRC-5528 provides:
- Escrow-based payment flow
- Configurable refund windows
- Partial refund support
- Dispute resolution hooks

## Specification

### Core Interface

```solidity
interface ILRC5528 is ILRC20 {
    enum EscrowStatus {
        None,
        Pending,
        Completed,
        Refunded,
        Disputed
    }
    
    struct Escrow {
        address payer;
        address payee;
        uint256 amount;
        uint256 createdAt;
        uint256 expiresAt;
        EscrowStatus status;
    }
    
    // Events
    event EscrowCreated(
        bytes32 indexed escrowId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        uint256 expiresAt
    );
    
    event EscrowCompleted(bytes32 indexed escrowId);
    event EscrowRefunded(bytes32 indexed escrowId, uint256 amount);
    event EscrowDisputed(bytes32 indexed escrowId);
    
    // Escrow operations
    function escrowTransfer(
        address payee,
        uint256 amount,
        uint256 duration
    ) external returns (bytes32 escrowId);
    
    function completeEscrow(bytes32 escrowId) external;
    function refundEscrow(bytes32 escrowId) external;
    function partialRefund(bytes32 escrowId, uint256 amount) external;
    function disputeEscrow(bytes32 escrowId) external;
    
    // View functions
    function getEscrow(bytes32 escrowId) external view returns (Escrow memory);
    function escrowBalance(address account) external view returns (uint256);
}
```

### Implementation

```solidity
contract RefundableToken is ERC20, ILRC5528 {
    mapping(bytes32 => Escrow) public escrows;
    mapping(address => uint256) public escrowedBalances;
    
    address public disputeResolver;
    
    function escrowTransfer(
        address payee,
        uint256 amount,
        uint256 duration
    ) external returns (bytes32 escrowId) {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        escrowId = keccak256(abi.encodePacked(
            msg.sender, payee, amount, block.timestamp
        ));
        
        escrows[escrowId] = Escrow({
            payer: msg.sender,
            payee: payee,
            amount: amount,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration,
            status: EscrowStatus.Pending
        });
        
        // Transfer to escrow (internal accounting)
        _transfer(msg.sender, address(this), amount);
        escrowedBalances[msg.sender] += amount;
        
        emit EscrowCreated(escrowId, msg.sender, payee, amount, block.timestamp + duration);
    }
    
    function completeEscrow(bytes32 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Pending, "Invalid status");
        require(
            msg.sender == escrow.payer || block.timestamp > escrow.expiresAt,
            "Not authorized"
        );
        
        escrow.status = EscrowStatus.Completed;
        escrowedBalances[escrow.payer] -= escrow.amount;
        
        // Transfer to payee
        _transfer(address(this), escrow.payee, escrow.amount);
        
        emit EscrowCompleted(escrowId);
    }
    
    function refundEscrow(bytes32 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Pending, "Invalid status");
        require(
            msg.sender == escrow.payee || 
            (msg.sender == disputeResolver && escrow.status == EscrowStatus.Disputed),
            "Not authorized"
        );
        
        escrow.status = EscrowStatus.Refunded;
        escrowedBalances[escrow.payer] -= escrow.amount;
        
        // Return to payer
        _transfer(address(this), escrow.payer, escrow.amount);
        
        emit EscrowRefunded(escrowId, escrow.amount);
    }
    
    function disputeEscrow(bytes32 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Pending, "Invalid status");
        require(
            msg.sender == escrow.payer || msg.sender == escrow.payee,
            "Not party to escrow"
        );
        require(block.timestamp < escrow.expiresAt, "Escrow expired");
        
        escrow.status = EscrowStatus.Disputed;
        
        emit EscrowDisputed(escrowId);
    }
}
```

### Dispute Resolution

```solidity
interface IDisputeResolver {
    function resolveDispute(
        bytes32 escrowId,
        uint256 payerAmount,
        uint256 payeeAmount
    ) external;
}

contract ArbitrationResolver is IDisputeResolver {
    address public arbitrator;
    
    function resolveDispute(
        bytes32 escrowId,
        uint256 payerAmount,
        uint256 payeeAmount
    ) external {
        require(msg.sender == arbitrator, "Not arbitrator");
        
        ILRC5528 token = ILRC5528(msg.sender);
        ILRC5528.Escrow memory escrow = token.getEscrow(escrowId);
        
        require(
            payerAmount + payeeAmount == escrow.amount,
            "Amounts must equal escrow"
        );
        
        // Execute split resolution
        if (payerAmount > 0) {
            token.partialRefund(escrowId, payerAmount);
        }
        if (payeeAmount > 0) {
            // Remaining goes to payee via complete
        }
    }
}
```

## Use Cases

### E-commerce Payments
```solidity
// Buyer pays with 7-day refund window
escrowId = token.escrowTransfer(merchant, price, 7 days);

// If satisfied, merchant can claim after expiry
// If issues, buyer can dispute for refund
```

### Freelance Payments
```solidity
// Client escrows payment
escrowId = token.escrowTransfer(freelancer, payment, 30 days);

// On work completion, client releases
token.completeEscrow(escrowId);
```

### Subscription Trials
```solidity
// Trial payment escrowed
escrowId = token.escrowTransfer(service, monthlyFee, 14 days);

// If user cancels in trial, gets refund
// Otherwise auto-completes
```

## Rationale

- Escrow pattern proven in traditional commerce
- Expiry provides payment finality
- Dispute mechanism for edge cases
- Partial refunds for split resolutions

## Backwards Compatibility

This standard is fully backwards compatible with existing contracts and infrastructure. The standard is additive and does not modify existing functionality.

## Security Considerations

- Escrow funds locked in contract
- Dispute resolver trust assumptions
- Expiry timestamp manipulation
- Reentrancy on complete/refund

## References

- [ERC-5528: Refundable Fungible Token](https://eips.ethereum.org/EIPS/eip-5528)
- [LP-3020: LRC-20](./lp-3020-lrc-20-fungible-token-standard.md)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
