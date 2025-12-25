---
lp: 2804
title: DAO Account Abstraction
description: Account abstraction contracts for gasless DAO interactions and smart account integration
author: Lux Industries Inc.
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-12-17
requires: 2802
tags: [dao, governance, smart-account, erc-4337]
order: 2804
---

## Abstract

This LP specifies account abstraction contracts for Lux DAOs, enabling gasless governance participation, smart account integration, and sponsored transactions. The implementation follows ERC-4337 standards and integrates with existing DAO infrastructure.

## Motivation

Account abstraction enables:

1. **Gasless Voting**: DAOs can sponsor member voting transactions
2. **Smart Accounts**: Support for ERC-4337 smart contract wallets
3. **Batch Operations**: Multiple governance actions in single transaction
4. **Social Recovery**: Account recovery mechanisms for DAO members
5. **Onboarding**: Lower barriers for new DAO participants

## Specification

### Architecture

```solidity
┌─────────────────────────────────────────────────────────────────┐
│                        User Operation                            │
│                    (vote, propose, delegate)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Bundler                                  │
│                    (submits UserOps)                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EntryPoint                                 │
│                    (ERC-4337 core)                               │
└──────────┬────────────────────────────────────┬─────────────────┘
           │                                    │
           ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│    LightAccount     │              │    PaymasterV1      │
│   (smart wallet)    │              │  (gas sponsorship)  │
└─────────────────────┘              └─────────────────────┘
```

### Paymaster Contract

```solidity
// Location: contracts/contracts/account-abstraction/PaymasterV1.sol

interface IPaymasterV1 {
    // ERC-4337 Paymaster interface
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData);

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external;

    // DAO-specific
    function setDaoWhitelist(address _dao, bool _whitelisted) external;
    function isDaoWhitelisted(address _dao) external view returns (bool);
    function sponsorLimit(address _dao) external view returns (uint256);
    function setSponsorLimit(address _dao, uint256 _limit) external;

    // Funding
    function deposit() external payable;
    function withdrawTo(address payable _to, uint256 _amount) external;
    function getDeposit() external view returns (uint256);
}
```solidity

### Base Paymaster

```solidity
// Location: contracts/contracts/account-abstraction/BasePaymaster.sol

abstract contract BasePaymaster is IPaymaster {
    IEntryPoint public immutable entryPoint;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external override returns (bytes memory context, uint256 validationData) {
        _requireFromEntryPoint();
        return _validatePaymasterUserOp(userOp, userOpHash, maxCost);
    }

    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal virtual returns (bytes memory context, uint256 validationData);
}
```

### Light Account Validator

```solidity
// Location: contracts/contracts/account-abstraction/LightAccountValidator.sol

interface ILightAccountValidator {
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);

    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view returns (bytes4);

    // Account management
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
}
```solidity

### File Structure

```
contracts/contracts/account-abstraction/
├── PaymasterV1.sol           # DAO gas sponsorship paymaster
├── BasePaymaster.sol         # Abstract paymaster base
└── LightAccountValidator.sol # ERC-4337 account validation
```solidity

### Sponsored Operations

The paymaster sponsors specific DAO operations:

| Operation | Sponsored | Condition |
|-----------|-----------|-----------|
| `vote()` | Yes | User is DAO member |
| `delegate()` | Yes | User is token holder |
| `submitProposal()` | Configurable | Meets proposer threshold |
| `executeProposal()` | Yes | Proposal passed |
| `castFreezeVote()` | Yes | Emergency voting |

### Configuration

```solidity
struct PaymasterConfig {
    address dao;              // DAO address
    uint256 sponsorLimit;     // Max sponsored gas per user
    uint256 dailyLimit;       // Daily sponsorship cap
    bool votingOnly;          // Only sponsor voting operations
    address[] allowedTargets; // Whitelisted contract targets
}
```

### Events

```solidity
event UserOperationSponsored(
    address indexed user,
    address indexed dao,
    bytes32 indexed userOpHash,
    uint256 actualGasCost
);

event DaoWhitelisted(address indexed dao, bool whitelisted);
event SponsorLimitUpdated(address indexed dao, uint256 newLimit);
event Deposited(address indexed depositor, uint256 amount);
event Withdrawn(address indexed to, uint256 amount);
```solidity

## Usage Example

```typescript
import { PaymasterV1__factory } from '@luxdao/sdk'
import { Client } from 'userop'

// Deploy paymaster
const paymaster = await PaymasterV1__factory.deploy(
  entryPoint.address,
  owner.address
)

// Fund paymaster
await paymaster.deposit({ value: ethers.utils.parseEther('10') })

// Whitelist DAO
await paymaster.setDaoWhitelist(dao.address, true)
await paymaster.setSponsorLimit(dao.address, ethers.utils.parseEther('1'))

// Use with userop.js client
const client = await Client.init(rpcUrl)
const builder = new UserOperationBuilder()
  .setPaymasterAndData(paymaster.address)
  .setCallData(
    azorius.interface.encodeFunctionData('vote', [proposalId, 1])
  )

// User votes without paying gas
const result = await client.sendUserOperation(builder)
```

### Integration with Lux DAO Frontend

```typescript
// In app/src/hooks/useGaslessVote.ts
import { useSmartAccount } from '@luxdao/sdk'

export function useGaslessVote(daoAddress: string) {
  const { account, paymaster } = useSmartAccount()

  const vote = async (proposalId: number, support: VoteType) => {
    const userOp = await account.buildUserOp({
      target: daoAddress,
      data: azorius.interface.encodeFunctionData('vote', [proposalId, support]),
      paymaster: paymaster.address
    })

    return account.sendUserOp(userOp)
  }

  return { vote }
}
```solidity

## Rationale

### ERC-4337 Standard

Building on ERC-4337 provides:

1. **Ecosystem Compatibility**: Works with existing bundlers and infrastructure
2. **Future-Proof**: Aligned with Ethereum's account abstraction roadmap
3. **Standardization**: Familiar interface for developers

### DAO-Specific Paymaster

A dedicated DAO paymaster enables:

1. **Governance Sponsorship**: DAOs can fund member participation
2. **Targeted Subsidies**: Only sponsor governance-related transactions
3. **Budget Control**: Per-DAO and per-user spending limits

### Light Account Integration

Using Light Accounts (vs full Safe) for users provides:

1. **Gas Efficiency**: Simpler account = lower deployment and operation costs
2. **UX**: Users don't need to manage a full Safe for voting
3. **Recovery**: Social recovery built into account standard

## Backwards Compatibility

### ERC-4337 Compatibility

Fully compatible with ERC-4337 standard:

- Implements `IPaymaster` interface
- Works with standard EntryPoint contract
- Compatible with any ERC-4337 bundler

### LP-2520 DAO Platform Integration

Integrates seamlessly with existing DAO infrastructure:

- Sponsors calls to Azorius governance module
- Works with existing voting strategies
- No changes required to core DAO contracts

### Wallet Compatibility

Users can participate using:

- Any ERC-4337 compatible smart account
- Traditional EOA wallets (without gas sponsorship)
- Light Accounts deployed by the SDK

## Test Cases

### Paymaster Tests

```solidity
function test_SponsorVoteTransaction() public {
    UserOperation memory userOp = buildUserOp(
        lightAccount,
        azorius,
        abi.encodeCall(IAzorius.vote, (proposalId, 1))
    );

    (bytes memory context, uint256 validationData) = paymaster.validatePaymasterUserOp(
        userOp,
        userOpHash,
        maxCost
    );

    assertEq(validationData, 0); // Valid
}

function test_RejectNonWhitelistedDao() public {
    paymaster.setDaoWhitelist(dao, false);

    UserOperation memory userOp = buildUserOp(lightAccount, dao, callData);

    vm.expectRevert("DAO not whitelisted");
    paymaster.validatePaymasterUserOp(userOp, userOpHash, maxCost);
}

function test_EnforceSponsorLimit() public {
    paymaster.setSponsorLimit(dao, 0.1 ether);

    UserOperation memory userOp = buildExpensiveUserOp();

    vm.expectRevert("Exceeds sponsor limit");
    paymaster.validatePaymasterUserOp(userOp, userOpHash, 0.2 ether);
}
```

### Account Tests

```solidity
function test_ValidateUserOpSignature() public {
    UserOperation memory userOp = buildSignedUserOp(ownerKey);

    uint256 validationData = lightAccount.validateUserOp(userOp, userOpHash, 0);

    assertEq(validationData, 0); // Valid signature
}

function test_RejectInvalidSignature() public {
    UserOperation memory userOp = buildSignedUserOp(wrongKey);

    uint256 validationData = lightAccount.validateUserOp(userOp, userOpHash, 0);

    assertEq(validationData, 1); // Invalid
}
```solidity

## Security Considerations

1. **Paymaster Funding**: Monitor paymaster balance to prevent DoS
2. **Rate Limiting**: Implement per-user and per-DAO limits
3. **Signature Validation**: Validate all UserOp signatures
4. **Target Whitelist**: Only sponsor calls to known DAO contracts
5. **Replay Protection**: Use nonces and chain ID in signatures

## Related LPs

- **LP-2520**: Lux DAO Platform
- **LP-2801**: Azorius Governance Module
- **ERC-4337**: Account Abstraction Standard

## References

1. ERC-4337: https://eips.ethereum.org/EIPS/eip-4337
2. Alchemy Light Account: https://docs.alchemy.com/docs/light-account

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
```
