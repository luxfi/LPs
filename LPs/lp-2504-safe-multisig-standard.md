---
lp: 2504
title: Safe Multisig Standard
tags: [wallet, multisig, security, custody]
description: Safe (formerly Gnosis Safe) multisig wallet integration for institutional-grade custody on Lux Network.
author: Lux Network Team (@luxfi)
status: Draft
type: Standards Track
category: LRC
created: 2025-12-14
discussions-to: https://github.com/luxfi/lps/discussions
requires: 40, 42
---

## Abstract

This LP documents the integration of Safe (formerly Gnosis Safe) smart contract wallet protocol into the Lux Standard Library. Safe is the most battle-tested and widely-deployed multisig infrastructure in the EVM ecosystem, securing over $100 billion in digital assets. This specification covers the core Safe contracts, module system, guard contracts, signature schemes, and Lux-specific adaptations including FROST threshold signatures and cross-chain Safe via Warp messaging.

## Motivation

Multi-signature wallets are essential infrastructure for secure asset management, particularly for:

1. **Institutional Custody**: Enterprises, DAOs, and protocols require robust multisig for treasury management
2. **Battle-Tested Security**: Safe has undergone multiple audits and secures significant TVL across chains
3. **Modular Architecture**: Extensible via modules and guards without modifying core contracts
4. **Standards Compliance**: Full support for EIP-712 typed data signing and EIP-1271 contract signatures
5. **Cross-Chain Requirements**: Lux's multi-chain architecture demands Safe compatibility across C-Chain, subnets, and via Warp messaging

### Why Safe over Custom Solutions

| Criteria | Safe | Custom Implementation |
|----------|------|----------------------|
| Audits | 6+ comprehensive audits | New code = new risks |
| TVL Secured | $100B+ | Unproven |
| Ecosystem Tools | Safe{Wallet}, SDK, Transaction Service | Build from scratch |
| Community | Large developer community | Internal only |
| Module System | Battle-tested extensibility | Design required |

## Specification

### Core Contracts

The Safe protocol implementation is located at `/Users/z/work/lux/standard/src/safe/`.

#### Safe.sol (Main Contract)

The core multisig wallet contract supporting:

- **Threshold Signatures**: Configurable M-of-N owner scheme
- **EIP-712 Typed Data**: Structured transaction hashing for secure signing
- **Nonce Management**: Replay protection via sequential nonces
- **Gas Refunds**: Optional transaction fee refunds to relayers
- **Delegate Calls**: Execute arbitrary logic via delegatecall operations

```solidity
contract Safe is
    Singleton,
    NativeCurrencyPaymentFallback,
    ModuleManager,
    GuardManager,
    OwnerManager,
    SignatureDecoder,
    SecuredTokenTransfer,
    ISignatureValidatorConstants,
    FallbackManager,
    StorageAccessible,
    ISafe
{
    string public constant VERSION = "1.4.1";

    function execTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory signatures
    ) external payable returns (bool success);
}
```solidity

#### SafeL2.sol

Layer 2 optimized variant that emits events for all operations, enabling indexing without archive nodes:

- Additional events for transaction execution
- Optimized for rollup and L2 deployments
- Compatible with standard Safe SDK tooling

#### SafeProxy.sol

Minimal proxy contract (EIP-1167 pattern) for gas-efficient Safe deployments:

```solidity
contract SafeProxy {
    address internal singleton;

    constructor(address _singleton) {
        singleton = _singleton;
    }

    fallback() external payable {
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), sload(0), 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}
```solidity

#### SafeProxyFactory.sol

Factory contract for deterministic Safe deployments:

- CREATE2 for predictable addresses
- Callback support for post-deployment initialization
- Batch deployment capabilities

### Base Contracts

#### OwnerManager.sol

Manages the set of Safe owners:

- Add/remove owners with threshold adjustment
- Swap owners atomically
- Linked list storage pattern for gas efficiency

#### ModuleManager.sol

Module system for extending Safe functionality:

- Enable/disable modules via Safe transaction
- Module guard for transaction validation
- Paginated module enumeration

#### GuardManager.sol

Transaction guard system:

- Pre-transaction validation hooks
- Post-execution verification
- Interface: `ITransactionGuard`

#### FallbackManager.sol

Fallback handler for extended functionality:

- Token callback handling (ERC-721, ERC-1155, ERC-777)
- Custom view function support
- Handler delegation pattern

### Signature Schemes

Safe supports multiple signature types via the `v` parameter encoding:

| v Value | Signature Type | Description |
|---------|---------------|-------------|
| 0 | Contract Signature | EIP-1271 `isValidSignature` check |
| 1 | Approved Hash | Pre-approved via `approveHash()` |
| 27, 28 | ECDSA | Standard Ethereum signatures |
| 31, 32 | eth_sign | Legacy `\x19Ethereum Signed Message` prefix |

#### EIP-712 Domain Separator

```solidity
bytes32 private constant DOMAIN_SEPARATOR_TYPEHASH =
    keccak256("EIP712Domain(uint256 chainId,address verifyingContract)");

bytes32 private constant SAFE_TX_TYPEHASH = keccak256(
    "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
);
```solidity

#### EIP-1271 Contract Signatures

Enables smart contract wallets as Safe owners:

```solidity
interface ISignatureValidator {
    function isValidSignature(bytes32 _hash, bytes memory _signature)
        external view returns (bytes4 magicValue);
}

// Magic value: 0x1626ba7e
bytes4 constant EIP1271_MAGIC_VALUE = 0x1626ba7e;
```

### Guard Contracts

Example guards included in the implementation:

#### BaseGuard.sol

Abstract base for custom guards:

```solidity
abstract contract BaseTransactionGuard is ITransactionGuard {
    function supportsInterface(bytes4 interfaceId) external view virtual returns (bool) {
        return interfaceId == type(ITransactionGuard).interfaceId ||
               interfaceId == type(IERC165).interfaceId;
    }
}
```

#### DelegateCallTransactionGuard.sol

Prevents delegate calls to unauthorized targets:

- Whitelist of allowed delegate call destinations
- Blocks potential proxy upgrade attacks

#### OnlyOwnersGuard.sol

Restricts module transactions to owner-only:

- Prevents external module abuse
- Additional security layer for sensitive operations

#### ReentrancyTransactionGuard.sol

Reentrancy protection for Safe transactions:

- Mutex pattern for transaction execution
- Guards against callback-based attacks

#### DebugTransactionGuard.sol

Development and debugging guard:

- Emits detailed transaction events
- Gas usage tracking
- For testing environments only

### Library Contracts

#### MultiSend.sol

Batch transaction execution:

```solidity
function multiSend(bytes memory transactions) public payable {
    assembly {
        let length := mload(transactions)
        let i := 0x20
        for {} lt(i, length) {} {
            let operation := shr(0xf8, mload(add(transactions, i)))
            let to := shr(0x60, mload(add(transactions, add(i, 0x01))))
            let value := mload(add(transactions, add(i, 0x15)))
            let dataLength := mload(add(transactions, add(i, 0x35)))
            let data := add(transactions, add(i, 0x55))
            // Execute transaction...
        }
    }
}
```

#### MultiSendCallOnly.sol

Restricted variant allowing only CALL operations (no DELEGATECALL).

#### SignMessageLib.sol

EIP-191 message signing support for the Safe:

```solidity
function signMessage(bytes calldata _data) external authorized {
    bytes32 msgHash = getMessageHash(_data);
    signedMessages[msgHash] = 1;
    emit SignMsg(msgHash);
}
```

#### CreateCall.sol

Contract deployment from Safe:

- CREATE and CREATE2 support
- Deterministic deployment addresses

### Interface Contracts

| Interface | Purpose |
|-----------|---------|
| `ISafe.sol` | Main Safe interface |
| `IModuleManager.sol` | Module management |
| `IOwnerManager.sol` | Owner management |
| `IGuardManager.sol` | Guard management |
| `IFallbackManager.sol` | Fallback handler |
| `ISignatureValidator.sol` | EIP-1271 validation |

### Handler Contracts

#### CompatibilityFallbackHandler.sol

Combined fallback handler supporting:

- ERC-721 token receiving (`onERC721Received`)
- ERC-1155 token receiving (`onERC1155Received`, `onERC1155BatchReceived`)
- ERC-777 token receiving (`tokensReceived`)
- EIP-1271 signature validation
- View function delegation

#### TokenCallbackHandler.sol

Minimal token callback support.

## Dependencies

### NPM Package

```json
{
  "name": "@safe-global/safe-smart-account",
  "version": "1.4.1-build.0",
  "license": "LGPL-3.0",
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "@openzeppelin/contracts": "^3.4.0",
    "@safe-global/mock-contract": "^4.1.0",
    "@safe-global/safe-singleton-factory": "^1.0.24",
    "hardhat": "^2.22.6",
    "solc": "0.7.6"
  }
}
```markdown

### Solidity Version

Safe contracts target Solidity `>=0.7.0 <0.9.0` for broad compatibility.

### Mock Contracts for Testing

Located in `/contracts/test/`:

- `ERC20Token.sol` - Test ERC-20 token
- `ERC1155Token.sol` - Test ERC-1155 token
- `Token.sol` - Legacy token interface
- `DelegateCaller.sol` - Delegate call testing
- `TestHandler.sol` - Fallback handler testing
- `Test4337ModuleAndHandler.sol` - ERC-4337 compatibility testing

## Lux-Specific Adaptations

### Integration with FROST Threshold Signatures

Safe can be extended to support FROST threshold signatures via a custom module:

```solidity
interface IFROSTModule {
    function verifyFROSTSignature(
        bytes32 messageHash,
        bytes calldata signature,
        uint8 threshold,
        uint8 totalParties
    ) external view returns (bool);

    function executeFROSTTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        bytes calldata frostSignature
    ) external returns (bool);
}
```

**Benefits**:
- Single 64-byte signature regardless of threshold
- Off-chain signature aggregation
- Compatible with LP-321 FROST precompile

**Reference**: See LP-321 (FROST Threshold Signature Precompile) and LP-104 (FROST Threshold Signatures).

### Cross-Chain Safe via Warp Messaging

Enable Safe governance across Lux chains:

```solidity
interface ICrossChainSafeModule {
    function sendCrossChainTransaction(
        bytes32 destinationChainId,
        address destinationSafe,
        bytes calldata encodedTransaction
    ) external;

    function executeCrossChainTransaction(
        uint32 warpIndex,
        bytes calldata encodedTransaction
    ) external returns (bool);
}
```

**Use Cases**:
- Unified treasury management across subnets
- Cross-chain governance execution
- Multi-chain protocol administration

**Reference**: See LP-603 (Warp Messaging Protocol).

### Post-Quantum Signature Module (Future)

Reserved module interface for post-quantum signature integration:

```solidity
interface IPostQuantumModule {
    enum PQAlgorithm { ML_DSA_65, SLH_DSA_128S, RINGTAIL }

    function registerPQKey(
        address owner,
        bytes calldata pqPublicKey,
        PQAlgorithm algorithm
    ) external;

    function verifyPQSignature(
        bytes32 messageHash,
        bytes calldata pqSignature,
        address owner
    ) external view returns (bool);
}
```

**Reference**: See LP-311 (ML-DSA), LP-312 (SLH-DSA), LP-320 (Ringtail Threshold).

## Formal Verification

### Certora Verification

The implementation includes Certora formal verification:

**Location**: `/Users/z/work/lux/standard/src/safe/certora/`

**Specifications** (`specs/`):
- Ownership invariants
- Module security properties
- Guard correctness
- Signature validation

**Harnesses** (`harnesses/`):
- `SafeHarness.sol` - Test harness for Safe contract

**Configuration** (`conf/`):
- Certora verification configurations

### Audit History

Safe v1.4.0/1.4.1 audits:
- **Ackee Blockchain** (v1.4.0/1.4.1)
- **G0 Group** (v1.3.0, v1.2.0, v1.1.1)
- **Runtime Verification** (v1.0.0)
- **Alexey Akhunov** (v0.0.1)

## OpenZeppelin 5.x Migration

### Required Updates

Safe currently uses `@openzeppelin/contracts@^3.4.0`. Migration to OZ 5.x requires:

1. **SafeMath Removal**: Native Solidity 0.8.x overflow checks
2. **Access Control Updates**: New `Ownable` and `AccessControl` patterns
3. **ERC Token Updates**: Updated token interfaces and implementations
4. **ReentrancyGuard**: Updated modifier patterns

### Migration Path

```solidity
// Before (OZ 3.x / Safe current)
import {SafeMath} from "./external/SafeMath.sol";
using SafeMath for uint256;
uint256 result = a.add(b);

// After (OZ 5.x / Solidity 0.8+)
// Native overflow checking
uint256 result = a + b;
```markdown

**Note**: Safe's use of `SafeMath` is for compatibility with Solidity `>=0.7.0`. Migration to Solidity 0.8+ removes this dependency.

## Rationale

### Design Decisions

1. **Proxy Pattern**: Minimal proxy reduces deployment costs (~60,000 gas vs ~2,000,000)
2. **Linked List Storage**: Gas-efficient owner/module iteration
3. **Modular Architecture**: Extend without modifying audited core
4. **Guard System**: Pre/post transaction hooks without core changes
5. **EIP-712 Signing**: Human-readable transaction signing in wallets

### Security Model

- **Threshold Enforcement**: Cannot bypass M-of-N requirement
- **Nonce Sequencing**: Prevents replay and front-running
- **Module Isolation**: Modules cannot modify owner/threshold
- **Guard Composition**: Stack multiple guards for defense in depth

## Backwards Compatibility

### Gnosis Safe Compatibility

Full compatibility with existing Safe ecosystem:
- Safe{Wallet} UI
- Safe Transaction Service
- Safe SDK (ethers-lib, web3-lib, core-sdk)
- Safe Apps

### LP-42 Alignment

Complements LP-42 (Multi-Signature Wallet Standard):
- Safe implements `ILuxMultiSig` interface patterns
- Extended with Safe-specific module/guard system
- Additional signature schemes beyond basic threshold

## Test Cases

### Unit Tests

Located at `/Users/z/work/lux/standard/src/safe/test/`:

```bash
cd /Users/z/work/lux/standard/src/safe
npm run build
npm run test
```

### Test Coverage

| Component | Coverage |
|-----------|----------|
| Safe.sol | 95%+ |
| ModuleManager | 95%+ |
| GuardManager | 95%+ |
| OwnerManager | 95%+ |
| Proxy | 100% |

### Example Test

```typescript
describe("Safe", () => {
  it("should execute transaction with threshold signatures", async () => {
    const safe = await deploySafe([owner1, owner2, owner3], 2);

    const tx = buildSafeTransaction({
      to: recipient.address,
      value: parseEther("1"),
      nonce: await safe.nonce()
    });

    const sig1 = await signTypedData(owner1, safe.address, tx);
    const sig2 = await signTypedData(owner2, safe.address, tx);

    await safe.execTransaction(
      tx.to, tx.value, tx.data, tx.operation,
      tx.safeTxGas, tx.baseGas, tx.gasPrice,
      tx.gasToken, tx.refundReceiver,
      buildSignatureBytes([sig1, sig2])
    );

    expect(await provider.getBalance(recipient.address)).to.equal(parseEther("1"));
  });
});
```

## Reference Implementation

### Source Code

**Location**: `/Users/z/work/lux/standard/src/safe/`
**Upstream**: [github.com/safe-global/safe-smart-account](https://github.com/safe-global/safe-smart-account)
**Version**: 1.4.1-build.0

### Contract Directory Structure

```
src/safe/
├── contracts/
│   ├── Safe.sol                          # Core multisig contract
│   ├── SafeL2.sol                        # L2-optimized variant
│   ├── accessors/
│   │   └── SimulateTxAccessor.sol        # Transaction simulation
│   ├── base/
│   │   ├── Executor.sol                  # Transaction execution
│   │   ├── FallbackManager.sol           # Fallback handler management
│   │   ├── GuardManager.sol              # Guard management
│   │   ├── ModuleManager.sol             # Module management
│   │   └── OwnerManager.sol              # Owner management
│   ├── common/
│   │   ├── NativeCurrencyPaymentFallback.sol
│   │   ├── SecuredTokenTransfer.sol
│   │   ├── SelfAuthorized.sol
│   │   ├── SignatureDecoder.sol
│   │   ├── Singleton.sol
│   │   └── StorageAccessible.sol
│   ├── examples/guards/
│   │   ├── BaseGuard.sol
│   │   ├── DebugTransactionGuard.sol
│   │   ├── DelegateCallTransactionGuard.sol
│   │   ├── OnlyOwnersGuard.sol
│   │   └── ReentrancyTransactionGuard.sol
│   ├── external/
│   │   └── SafeMath.sol                  # Math library (pre-0.8)
│   ├── handler/
│   │   ├── CompatibilityFallbackHandler.sol
│   │   ├── HandlerContext.sol
│   │   └── TokenCallbackHandler.sol
│   ├── interfaces/
│   │   ├── ISafe.sol
│   │   ├── IModuleManager.sol
│   │   ├── IOwnerManager.sol
│   │   ├── IGuardManager.sol
│   │   ├── IFallbackManager.sol
│   │   ├── ISignatureValidator.sol
│   │   └── [token interfaces]
│   ├── libraries/
│   │   ├── CreateCall.sol
│   │   ├── Enum.sol
│   │   ├── ErrorMessage.sol
│   │   ├── MultiSend.sol
│   │   ├── MultiSendCallOnly.sol
│   │   ├── SafeMigration.sol
│   │   ├── SafeStorage.sol
│   │   ├── SafeToL2Migration.sol
│   │   ├── SafeToL2Setup.sol
│   │   └── SignMessageLib.sol
│   ├── proxies/
│   │   ├── IProxyCreationCallback.sol
│   │   ├── SafeProxy.sol
│   │   └── SafeProxyFactory.sol
│   └── test/                             # Test contracts
├── certora/                              # Formal verification
│   ├── conf/
│   ├── harnesses/
│   └── specs/
├── test/                                 # Test suite
├── docs/                                 # Documentation
└── README.md
```

### Gas Costs

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| Safe deployment (proxy) | ~60,000 | Via factory |
| Safe deployment (full) | ~2,000,000 | Direct deployment |
| Execute transaction (2-of-3) | ~100,000 | Base + signatures |
| Add owner | ~50,000 | Storage update |
| Enable module | ~50,000 | Storage update |
| Set guard | ~25,000 | Storage update |
| MultiSend (5 txs) | ~200,000 | Batch execution |

## Security Considerations

### Signature Security

- **Replay Protection**: Nonces prevent transaction replay
- **Chain ID Binding**: EIP-712 domain includes chain ID
- **Signature Ordering**: Signatures must be sorted by owner address
- **Contract Signatures**: EIP-1271 validation for smart contract owners

### Module Security

- **Module Risk**: Modules have unlimited access; only add trusted, audited modules
- **Module Guard**: Additional validation layer for module transactions
- **Disable Mechanism**: Owners can disable compromised modules

### Guard Security

- **Guard Bypass**: Cannot bypass guard checks without removing guard
- **Guard Composition**: Multiple guards can be stacked via delegation
- **Gas Considerations**: Guards consume gas; malicious guards could cause DoS

### Upgrade Considerations

- **Singleton Upgrade**: Change `singleton` storage slot to upgrade
- **Migration Libraries**: `SafeMigration.sol` for controlled upgrades
- **State Preservation**: Proxy pattern preserves all Safe state

## License

LGPL-3.0-only

The LGPL-3.0 license permits:
- Linking Safe contracts with proprietary code
- Modifications must remain open source
- Derivative works of Safe contracts must use LGPL-3.0

## References

### Standards

- [EIP-712: Typed structured data hashing and signing](https://eips.ethereum.org/EIPS/eip-712)
- [EIP-1271: Standard Signature Validation Method for Contracts](https://eips.ethereum.org/EIPS/eip-1271)
- [EIP-1167: Minimal Proxy Contract](https://eips.ethereum.org/EIPS/eip-1167)
- [EIP-4337: Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)

### Related LPs

- [LP-40: Wallet Standards](./lp-0040-wallet-standards.md)
- [LP-42: Multi-Signature Wallet Standard](./lp-0042-multi-signature-wallet-standard.md)
- [LP-104: FROST Threshold Signatures](./lp-104.md)
- [LP-311: ML-DSA Digital Signatures](./lp-311.md)
- [LP-320: Ringtail Threshold Signatures](./lp-320.md)
- [LP-321: FROST Threshold Signature Precompile](./lp-321.md)
- [LP-603: Warp Messaging Protocol](./lp-603.md)

### External Resources

- [Safe Documentation](https://docs.safe.global)
- [Safe Smart Account Repository](https://github.com/safe-global/safe-smart-account)
- [Safe Deployments](https://github.com/safe-global/safe-deployments)
- [Safe SDK](https://github.com/safe-global/safe-core-sdk)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
