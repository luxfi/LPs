---
lp: 3671
title: Execution Layer Requests (EIP-7685)
description: General purpose mechanism for EL to CL communication
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-01-23
tags: [core, evm, consensus]
order: 1005
---

# LP-3671: Execution Layer Requests

## Abstract

This LP specifies a general-purpose framework for the Execution Layer (EL) to make requests to the Consensus Layer (CL), enabling features like validator deposits, withdrawals, and consolidations.

## Motivation

Currently, EL→CL communication is ad-hoc:
- Deposits via deposit contract
- Withdrawals via system contract
- Each feature requires custom integration

A unified request framework enables:
- Consistent handling of all request types
- Easy addition of new request types
- Standardized validation and processing

## Specification

### Request Types

```go
const (
    DepositRequestType       = 0x00
    WithdrawalRequestType    = 0x01
    ConsolidationRequestType = 0x02
)

type Request struct {
    Type byte
    Data []byte
}
```

### Block Format

```go
type Block struct {
    Header       *Header
    Transactions []*Transaction
    Uncles       []*Header
    Withdrawals  []*Withdrawal
    
    // NEW: Execution layer requests
    Requests     []*Request
}
```

### Request Processing

```go
func ProcessRequests(state StateDB, block *Block) ([]*Request, error) {
    requests := make([]*Request, 0)
    
    // Collect deposit requests
    deposits := collectDepositRequests(state)
    for _, d := range deposits {
        requests = append(requests, &Request{
            Type: DepositRequestType,
            Data: encodeDeposit(d),
        })
    }
    
    // Collect withdrawal requests
    withdrawals := collectWithdrawalRequests(state)
    for _, w := range withdrawals {
        requests = append(requests, &Request{
            Type: WithdrawalRequestType,
            Data: encodeWithdrawal(w),
        })
    }
    
    // Collect consolidation requests
    consolidations := collectConsolidationRequests(state)
    for _, c := range consolidations {
        requests = append(requests, &Request{
            Type: ConsolidationRequestType,
            Data: encodeConsolidation(c),
        })
    }
    
    return requests, nil
}
```

### Request Contracts

#### Deposit Contract (existing)
```solidity
// 0x00000000219ab540356cBB839Cbe05303d7705Fa
contract DepositContract {
    function deposit(
        bytes calldata pubkey,
        bytes calldata withdrawal_credentials,
        bytes calldata signature,
        bytes32 deposit_data_root
    ) external payable;
}
```

#### Withdrawal Request Contract
```solidity
// 0x00A3ca265EBcb825B45F985A16CEFB49958cE017
contract WithdrawalRequestContract {
    function requestWithdrawal(
        bytes calldata validatorPubkey,
        uint64 amount
    ) external;
}
```

#### Consolidation Request Contract
```solidity
// 0x01aBBE0DC321ee2457e63A2EBf2A6f3Db7b2e6d4
contract ConsolidationRequestContract {
    function requestConsolidation(
        bytes calldata sourcePubkey,
        bytes calldata targetPubkey
    ) external;
}
```

### Consensus Layer Processing

```python
def process_execution_payload(state, payload):
    # Existing processing...
    
    # Process requests
    for request in payload.requests:
        if request.type == DEPOSIT_REQUEST_TYPE:
            process_deposit_request(state, request.data)
        elif request.type == WITHDRAWAL_REQUEST_TYPE:
            process_withdrawal_request(state, request.data)
        elif request.type == CONSOLIDATION_REQUEST_TYPE:
            process_consolidation_request(state, request.data)
```

## Rationale

Unified framework chosen for:
- Extensibility (new request types trivial to add)
- Consistency (one code path for all requests)
- Auditability (all requests in block body)

## Backwards Compatibility

- New block field ignored by old clients
- Existing deposit contract unchanged
- Gradual migration of existing mechanisms

## Security Considerations

- Request validation at both EL and CL
- Rate limiting via gas costs
- Signature verification for sensitive requests

## References

- [EIP-7685: General Purpose Execution Layer Requests](https://eips.ethereum.org/EIPS/eip-7685)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
```
