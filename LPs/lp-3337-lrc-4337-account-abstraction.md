---
lp: 3337
title: LRC-4337 Account Abstraction
description: ERC-4337 Account Abstraction implementation enabling smart contract wallets with sponsored transactions
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-14
requires: 7321, 7322
activation:
  flag: lp2503-account-abstraction
  hfName: "Quantum"
  activationHeight: "0"
tags: [erc-4337, account-abstraction, smart-wallet, paymaster]
order: 500
---

## Abstract

This LP specifies the Account Abstraction implementation for Lux Network based on ERC-4337. The standard enables smart contract wallets that support gasless transactions via paymasters, social recovery, session keys, and modular validation logic. The implementation at `standard/src/eoa/` provides v0.6-compatible smart accounts with a migration path to v0.7 PackedUserOperation format. Integration with Lux post-quantum precompiles enables quantum-resistant wallet validation via FROST/CGGMP21 threshold signatures and ML-DSA post-quantum signatures.

## Activation

| Parameter          | Value                           |
|--------------------|---------------------------------|
| Flag string        | `lp2503-account-abstraction`    |
| EntryPoint v0.7    | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` |
| Default in code    | **true** (genesis)              |
| Deployment branch  | `v1.22.0-lp2503`                |
| Roll-out criteria  | C-Chain mainnet activation      |
| Back-off plan      | Disable via chain config        |

## Motivation

### Limitations of Externally Owned Accounts (EOAs)

Traditional EOAs require:
1. **Private key custody**: Single point of failure
2. **ETH/LUX for gas**: Users must hold native tokens
3. **No programmable validation**: Fixed secp256k1 signature scheme
4. **No batching**: Each operation requires separate transaction

### Benefits of Account Abstraction

ERC-4337 enables:

1. **Smart Contract Wallets**: Programmable validation logic
2. **Gasless Transactions**: Paymasters sponsor gas fees
3. **Social Recovery**: Multi-sig or guardian-based recovery
4. **Session Keys**: Time-limited keys for specific operations
5. **Batch Operations**: Multiple calls in single UserOperation
6. **Signature Agility**: Support multiple signature schemes including post-quantum

### Lux-Specific Advantages

Integration with Lux precompiles enables:
- **FROST threshold signatures** (LP-7321): t-of-n Schnorr validation
- **CGGMP21 threshold ECDSA** (LP-7322): Multi-party custody
- **ML-DSA post-quantum** (LP-2311): Quantum-resistant validation
- **Passkey authentication**: secp256r1 (P-256) via LP-2204

## Specification

### Core Components

#### 1. EntryPoint Contract

The singleton EntryPoint processes UserOperations and manages deposits:

```
Address: 0x0000000071727De22E5E9d8BAf0edAc6f37da032 (v0.7)
```

**Key Functions:**

```solidity
interface IEntryPoint {
    // Execute UserOperations
    function handleOps(
        PackedUserOperation[] calldata ops,
        address payable beneficiary
    ) external;

    // Execute with signature aggregation
    function handleAggregatedOps(
        UserOpsPerAggregator[] calldata opsPerAggregator,
        address payable beneficiary
    ) external;

    // Get UserOperation hash for signing
    function getUserOpHash(
        PackedUserOperation calldata userOp
    ) external view returns (bytes32);

    // Stake management
    function depositTo(address account) external payable;
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;
}
```

#### 2. UserOperation Struct

**v0.7 PackedUserOperation** (current):

```solidity
struct PackedUserOperation {
    address sender;           // Smart account address
    uint256 nonce;            // 2D nonce: uint192(key) || uint64(sequence)
    bytes initCode;           // Factory address + init calldata
    bytes callData;           // Method call to execute
    bytes32 accountGasLimits; // Packed: verificationGasLimit || callGasLimit
    uint256 preVerificationGas;
    bytes32 gasFees;          // Packed: maxPriorityFeePerGas || maxFeePerGas
    bytes paymasterAndData;   // Paymaster + gas limits + paymaster data
    bytes signature;          // Account signature
}
```

**v0.6 UserOperation** (legacy compatibility):

```solidity
struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;           // Unpacked
    uint256 verificationGasLimit;   // Unpacked
    uint256 preVerificationGas;
    uint256 maxFeePerGas;           // Unpacked
    uint256 maxPriorityFeePerGas;   // Unpacked
    bytes paymasterAndData;
    bytes signature;
}
```

#### 3. Account Interface

Smart accounts must implement:

```solidity
interface IAccount {
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}
```

**validationData encoding:**
- Bits 0-159: `aggregator` address (0 = valid, 1 = signature failed)
- Bits 160-207: `validUntil` timestamp (0 = indefinite)
- Bits 208-255: `validAfter` timestamp (0 = immediate)

#### 4. Paymaster Interface

Paymasters sponsor gas fees:

```solidity
interface IPaymaster {
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData);

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external;
}
```

### Lux Smart Account Implementation

Location: `standard/src/eoa/contracts/smart-account/`

#### SmartAccount.sol

The modular smart account implementation:

```solidity
contract SmartAccount is BaseSmartAccount, ModuleManager, FallbackManager {
    string public constant VERSION = "2.0.0";
    IEntryPoint private immutable ENTRY_POINT;

    // Validate UserOp via authorization modules
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external virtual override returns (uint256 validationData) {
        require(msg.sender == address(entryPoint()), "!entrypoint");

        // Decode module from signature
        (, address validationModule) = abi.decode(userOp.signature, (bytes, address));

        // Delegate validation to module
        validationData = IAuthorizationModule(validationModule)
            .validateUserOp(userOp, userOpHash);

        _payPrefund(missingAccountFunds);
    }

    // Execute single call
    function execute(address dest, uint256 value, bytes calldata func) external {
        _requireFromEntryPoint();
        _call(dest, value, func);
    }

    // Execute batch
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external {
        _requireFromEntryPoint();
        for (uint256 i; i < dest.length; ++i) {
            _call(dest[i], value[i], func[i]);
        }
    }
}
```

#### SmartAccountFactory.sol

CREATE2 deterministic deployment:

```solidity
contract SmartAccountFactory {
    address public immutable basicImplementation;

    // Predict address before deployment
    function getAddressForCounterFactualAccount(
        address moduleSetupContract,
        bytes calldata moduleSetupData,
        uint256 index
    ) external view returns (address _account);

    // Deploy with CREATE2
    function deployCounterFactualAccount(
        address moduleSetupContract,
        bytes calldata moduleSetupData,
        uint256 index
    ) public returns (address proxy);
}
```

#### Authorization Modules

**EcdsaOwnershipRegistryModule**: Standard ECDSA validation

```solidity
contract EcdsaOwnershipRegistryModule is BaseAuthorizationModule {
    mapping(address => address) public smartAccountOwners;

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) external view returns (uint256) {
        address owner = smartAccountOwners[userOp.sender];
        bytes32 hash = userOpHash.toEthSignedMessageHash();

        if (owner != ECDSA.recover(hash, signature)) {
            return SIG_VALIDATION_FAILED;
        }
        return 0;
    }
}
```

**PasskeyRegistryModule**: WebAuthn/Passkey (secp256r1)

```solidity
contract PasskeyRegistryModule is BaseAuthorizationModule {
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) external view returns (uint256) {
        // Verify P-256 signature via precompile (LP-2204)
        // Uses 0x0000000000000000000000000000000000000100
    }
}
```

**SessionKeyManagerModule**: Time-limited session keys

```solidity
contract SessionKeyManagerModule is BaseAuthorizationModule {
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) external view returns (uint256) {
        // Validate session key permissions
        // Check expiration and allowed targets
    }
}
```

### Paymaster Implementation

#### VerifyingSingletonPaymaster

Off-chain signed sponsorship:

```solidity
contract VerifyingSingletonPaymaster is BasePaymaster {
    address public verifyingSigner;
    mapping(address => uint256) public paymasterIdBalances;

    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 requiredPreFund
    ) internal view override returns (bytes memory context, uint256 validationData) {
        PaymasterData memory data = userOp.decodePaymasterData();

        // Verify signer approved this UserOp
        bytes32 hash = getHash(userOp, data.paymasterId, data.validUntil, data.validAfter);
        require(verifyingSigner == hash.toEthSignedMessageHash().recover(data.signature));

        // Check balance
        require(requiredPreFund <= paymasterIdBalances[data.paymasterId]);

        return (context, _packValidationData(false, data.validUntil, data.validAfter));
    }

    function _postOp(PostOpMode, bytes calldata context, uint256 actualGasCost) internal override {
        // Deduct gas from paymasterId balance
        address paymasterId = abi.decode(context, (address));
        paymasterIdBalances[paymasterId] -= actualGasCost;
    }
}
```

### Version Compatibility

#### v0.6 Compatibility Shim

Location: `lib/account-abstraction/contracts/interfaces/UserOperation.sol`

```solidity
// SPDX-License-Identifier: GPL-3.0
// Compatibility shim for ERC-4337 v0.6 UserOperation
pragma solidity ^0.8.12;

struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

library UserOperationLib {
    function getSender(UserOperation calldata userOp) internal pure returns (address);
    function pack(UserOperation calldata userOp) internal pure returns (bytes memory);
    function hash(UserOperation calldata userOp) internal pure returns (bytes32);
}
```

#### Migration: v0.6 to v0.7

**Packing differences:**

| v0.6 Field | v0.7 Field |
|------------|------------|
| `callGasLimit` | `accountGasLimits` (high 128 bits) |
| `verificationGasLimit` | `accountGasLimits` (low 128 bits) |
| `maxFeePerGas` | `gasFees` (low 128 bits) |
| `maxPriorityFeePerGas` | `gasFees` (high 128 bits) |

**Conversion helper:**

```solidity
library UserOpMigration {
    function toPackedUserOp(UserOperation calldata v6)
        internal pure returns (PackedUserOperation memory v7)
    {
        v7.sender = v6.sender;
        v7.nonce = v6.nonce;
        v7.initCode = v6.initCode;
        v7.callData = v6.callData;
        v7.accountGasLimits = bytes32(
            uint256(v6.verificationGasLimit) << 128 | v6.callGasLimit
        );
        v7.preVerificationGas = v6.preVerificationGas;
        v7.gasFees = bytes32(
            uint256(v6.maxPriorityFeePerGas) << 128 | v6.maxFeePerGas
        );
        v7.paymasterAndData = v6.paymasterAndData;
        v7.signature = v6.signature;
    }
}
```

### Solidity Version Requirements

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| SmartAccount | 0.8.17 | ^0.8.28 | Requires upgrade for v0.7 |
| EntryPoint v0.7 | ^0.8.28 | ^0.8.28 | Already compatible |
| Legacy v0.6 shim | ^0.8.12 | ^0.8.12 | Maintained for compatibility |

**Upgrade path:**

1. Deploy v0.7 EntryPoint alongside existing v0.6
2. Update SmartAccount to support both EntryPoints
3. Migrate users to v0.7 format
4. Deprecate v0.6 after transition period

### EIP-7702 Support

EntryPoint v0.9 adds EIP-7702 support for temporary code delegation:

```solidity
// EIP-7702 initCode magic prefix
bytes2 constant EIP7702_MAGIC = 0x7702;

// Check if initCode is EIP-7702 format
function _isEip7702InitCode(bytes calldata initCode) internal pure returns (bool) {
    return initCode.length >= 2 && bytes2(initCode[:2]) == EIP7702_MAGIC;
}
```

This enables EOAs to temporarily act as smart accounts without permanent deployment.

## Post-Quantum Integration

### FROST Threshold Wallet (LP-7321)

Multi-party validation using Schnorr threshold signatures:

```solidity
contract FROSTValidationModule is BaseAuthorizationModule {
    address constant FROST_PRECOMPILE = 0x020000000000000000000000000000000000000C;

    struct FROSTConfig {
        uint8 threshold;
        uint8 totalSigners;
        bytes32 aggregatedPubKey;
    }

    mapping(address => FROSTConfig) public walletConfigs;

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) external view returns (uint256) {
        FROSTConfig memory config = walletConfigs[userOp.sender];

        // Call FROST precompile for verification
        (bool success,) = FROST_PRECOMPILE.staticcall(abi.encodePacked(
            config.threshold,
            config.totalSigners,
            config.aggregatedPubKey,
            userOpHash,
            userOp.signature
        ));

        return success ? 0 : SIG_VALIDATION_FAILED;
    }
}
```

**Gas cost**: 50,000 base + 5,000 per signer

### CGGMP21 Threshold ECDSA (LP-7322)

Institutional custody with ECDSA threshold:

```solidity
contract CGGMP21ValidationModule is BaseAuthorizationModule {
    address constant CGGMP21_PRECOMPILE = 0x020000000000000000000000000000000000000D;

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) external view returns (uint256) {
        // Call CGGMP21 precompile
        // Gas: 75,000 base + 10,000 per signer
    }
}
```

### ML-DSA Post-Quantum (LP-2311)

Quantum-resistant validation:

```solidity
contract MLDSAValidationModule is BaseAuthorizationModule {
    address constant MLDSA_PRECOMPILE = 0x0200000000000000000000000000000000000006;

    mapping(address => bytes) public walletPublicKeys; // 1952 bytes

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) external view returns (uint256) {
        bytes memory publicKey = walletPublicKeys[userOp.sender];
        bytes memory signature = userOp.signature; // 3309 bytes

        // Call ML-DSA precompile
        (bool success,) = MLDSA_PRECOMPILE.staticcall(abi.encodePacked(
            publicKey,          // 1952 bytes
            uint256(32),        // message length
            signature,          // 3309 bytes
            userOpHash          // 32 bytes message
        ));

        return success ? 0 : SIG_VALIDATION_FAILED;
    }
}
```

**Gas cost**: 100,000 base + 10 per message byte

### Hybrid Validation

Defense-in-depth with multiple signature schemes:

```solidity
contract HybridValidationModule is BaseAuthorizationModule {
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) external view returns (uint256) {
        // Decode both signatures
        (bytes memory ecdsaSig, bytes memory mldsaSig) = abi.decode(
            userOp.signature, (bytes, bytes)
        );

        // Require both ECDSA and ML-DSA valid
        require(verifyECDSA(userOpHash, ecdsaSig), "ECDSA failed");
        require(verifyMLDSA(userOpHash, mldsaSig), "ML-DSA failed");

        return 0;
    }
}
```

## Rationale

### Why ERC-4337 Over Native AA?

1. **No protocol changes**: Works with existing EVM
2. **Compatibility**: Interoperable with Ethereum ecosystem
3. **Flexibility**: Modular validation and execution
4. **Established**: Battle-tested on Ethereum mainnet

### Why v0.6 Compatibility?

The `src/eoa/` implementation targets v0.6 for:
1. **Existing deployments**: Many wallets use v0.6
2. **Tooling support**: Bundlers and SDKs support v0.6
3. **Gradual migration**: Smooth transition to v0.7

### Why Modular Architecture?

The SmartAccount uses modules for validation because:
1. **Flexibility**: Swap signature schemes without redeployment
2. **Upgradeability**: Add new features via modules
3. **Specialization**: Different modules for different use cases
4. **Security isolation**: Module bugs don't compromise core wallet

### Gas Cost Considerations

| Operation | Gas Cost |
|-----------|----------|
| ECDSA validation | ~3,000 |
| Passkey (P-256) | ~3,450 |
| FROST 2-of-3 | ~65,000 |
| CGGMP21 2-of-3 | ~105,000 |
| ML-DSA | ~100,000 |
| EntryPoint overhead | ~21,000 |

Paymasters can subsidize higher gas costs for quantum-resistant validation.

## Backwards Compatibility

### Existing EOAs

EOAs continue to work unchanged. Users can optionally:
1. Deploy a smart account
2. Use EIP-7702 for temporary smart account features

### Existing Contracts

Contracts calling `msg.sender` receive the smart account address, not the user's EOA. Contracts should:
- Accept calls from smart accounts
- Not rely on `tx.origin` checks

### Bundler Compatibility

Bundlers must support:
- v0.6 UserOperation format (current)
- v0.7 PackedUserOperation format (future)

## Test Cases

### Test 1: Basic UserOperation Execution

```solidity
function testBasicExecution() {
    // Deploy smart account
    address account = factory.deployCounterFactualAccount(
        ecdsaModule, moduleSetupData, 0
    );

    // Create UserOperation
    UserOperation memory op = UserOperation({
        sender: account,
        nonce: 0,
        initCode: "",
        callData: abi.encodeCall(SmartAccount.execute, (target, 0, data)),
        callGasLimit: 100000,
        verificationGasLimit: 100000,
        preVerificationGas: 21000,
        maxFeePerGas: 1 gwei,
        maxPriorityFeePerGas: 1 gwei,
        paymasterAndData: "",
        signature: signUserOp(op, ownerKey)
    });

    // Execute
    entryPoint.handleOps(toPackedArray(op), beneficiary);

    // Verify execution
    assertTrue(target.called);
}
```

### Test 2: Paymaster Sponsored Transaction

```solidity
function testPaymasterSponsorship() {
    // Deposit to paymaster
    paymaster.depositFor{value: 1 ether}(paymasterId);

    // Create UserOp with paymaster
    UserOperation memory op = createUserOp(account);
    op.paymasterAndData = abi.encodePacked(
        address(paymaster),
        paymasterId,
        validUntil,
        validAfter,
        paymasterSignature
    );

    // Execute (no gas from user)
    uint256 userBalanceBefore = account.balance;
    entryPoint.handleOps(toPackedArray(op), beneficiary);
    uint256 userBalanceAfter = account.balance;

    // User balance unchanged
    assertEq(userBalanceBefore, userBalanceAfter);
}
```

### Test 3: FROST Threshold Validation

```solidity
function testFROSTValidation() {
    // Setup 2-of-3 FROST wallet
    frostModule.setupWallet(account, 2, 3, aggregatedPubKey);

    // Create threshold signature
    bytes memory thresholdSig = createFROSTSignature(
        userOpHash, signer1, signer2
    );

    UserOperation memory op = createUserOp(account);
    op.signature = abi.encode(thresholdSig, address(frostModule));

    // Execute
    entryPoint.handleOps(toPackedArray(op), beneficiary);
}
```

### Test 4: Social Recovery

```solidity
function testSocialRecovery() {
    // Setup recovery module with 3 guardians
    recoveryModule.setupRecovery(account, guardians, 2);

    // Guardian 1 initiates recovery
    recoveryModule.initiateRecovery(account, newOwner, guardian1Sig);

    // Guardian 2 approves
    recoveryModule.approveRecovery(account, newOwner, guardian2Sig);

    // Execute recovery
    recoveryModule.executeRecovery(account);

    // Verify new owner
    assertEq(ecdsaModule.smartAccountOwners(account), newOwner);
}
```

## Reference Implementation

### Core Contracts

| File | Location | Description |
|------|----------|-------------|
| `SmartAccount.sol` | `src/eoa/contracts/smart-account/` | Main smart account |
| `BaseSmartAccount.sol` | `src/eoa/contracts/smart-account/` | Base implementation |
| `SmartAccountFactory.sol` | `src/eoa/contracts/smart-account/factory/` | CREATE2 factory |
| `Proxy.sol` | `src/eoa/contracts/smart-account/` | EIP-1967 proxy |

### Modules

| File | Location | Description |
|------|----------|-------------|
| `EcdsaOwnershipRegistryModule.sol` | `src/eoa/.../modules/` | ECDSA validation |
| `PasskeyRegistryModule.sol` | `src/eoa/.../modules/` | WebAuthn/Passkey |
| `SessionKeyManagerModule.sol` | `src/eoa/.../modules/` | Session keys |
| `MultichainECDSAValidator.sol` | `src/eoa/.../modules/` | Cross-chain ECDSA |

### Paymasters

| File | Location | Description |
|------|----------|-------------|
| `BasePaymaster.sol` | `src/eoa/.../paymasters/` | Paymaster base |
| `VerifyingSingletonPaymaster.sol` | `src/eoa/.../paymasters/verifying/` | Verified sponsor |

### Account Abstraction Library

| File | Location | Description |
|------|----------|-------------|
| `EntryPoint.sol` | `lib/account-abstraction/contracts/core/` | v0.7/0.9 EntryPoint |
| `PackedUserOperation.sol` | `lib/account-abstraction/contracts/interfaces/` | v0.7 struct |
| `UserOperation.sol` | `lib/account-abstraction/contracts/interfaces/` | v0.6 shim |
| `UserOperation06.sol` | `lib/account-abstraction/contracts/legacy/v06/` | v0.6 legacy |

## Security Considerations

### EntryPoint Security

The EntryPoint is a singleton with significant trust:
- **Immutable**: Cannot be upgraded
- **Audited**: Multiple security audits
- **Non-custodial**: Never holds user funds long-term

### Signature Replay Protection

UserOperations are protected against replay via:
1. **Chain ID**: Included in userOpHash
2. **EntryPoint address**: Included in userOpHash
3. **2D Nonce**: Sequential per key, no gaps allowed

### Paymaster Risks

Paymasters can:
- **DoS**: Approve then fail validation (mitigated by staking)
- **Front-run**: See pending UserOps (use encrypted mempools)
- **Censor**: Refuse to sponsor (use multiple paymasters)

### Module Security

Authorization modules have full validation control:
- **Audit all modules**: Before enabling
- **Limit permissions**: Use session keys for limited access
- **Multi-sig for changes**: Require multiple approvals

### Post-Quantum Considerations

ML-DSA signatures are ~3KB, affecting:
- **Calldata costs**: Higher L2 costs
- **Block size**: Fewer PQ UserOps per block
- **Verification time**: ~108us vs ~50us for ECDSA

Mitigation: Hybrid signatures (ECDSA + ML-DSA) provide security with lower average cost.

### Storage Collision

Proxy pattern risks:
- **Verified implementation**: Factory only deploys audited code
- **No delegatecall to untrusted**: Modules execute in own context
- **Upgrade guards**: Owner-only implementation updates

## Economic Impact

### Gas Costs

| Operation | v0.6 Gas | v0.7 Gas | Savings |
|-----------|----------|----------|---------|
| Simple transfer | ~85,000 | ~78,000 | 8% |
| ERC-20 transfer | ~95,000 | ~87,000 | 8% |
| Batch (3 calls) | ~150,000 | ~135,000 | 10% |

### Bundler Economics

Bundlers profit from:
- Gas price arbitrage (maxPriorityFee)
- Bundle inclusion fees
- MEV extraction (if enabled)

### Paymaster Business Models

1. **Subscription**: Monthly fee for gas coverage
2. **Per-transaction**: Fee per sponsored tx
3. **Token payment**: Accept ERC-20 for gas
4. **Cross-subsidy**: Free for some, paid for others

## Open Questions

1. **Native AA?** Should Lux implement native account abstraction (like zkSync)?
2. **Default EntryPoint?** Should new chains deploy with EntryPoint at genesis?
3. **PQ migration timeline?** When to require quantum-resistant validation?
4. **Bundler decentralization?** How to prevent bundler centralization?

## References

- **ERC-4337**: https://eips.ethereum.org/EIPS/eip-4337
- **EIP-7702**: https://eips.ethereum.org/EIPS/eip-7702
- **eth-infinitism**: https://github.com/eth-infinitism/account-abstraction
- **LP-2311**: ML-DSA Signature Verification Precompile
- **LP-7321**: FROST Threshold Signature Precompile
- **LP-7322**: CGGMP21 Threshold ECDSA Precompile
- **LP-2204**: secp256r1 Curve Integration
- **Implementation**: `standard/src/eoa/`

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
