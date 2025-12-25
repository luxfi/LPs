---
lp: 9101
title: DeFi Protocol Integration Standard
description: Standard DeFi protocol integrations for the Lux Standard Library with MIT/GPL licensing
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
tags: [c-chain, evm]
type: Standards Track
category: LRC
created: 2025-12-14
requires: 3020, 7321, 7322
order: 9101
---

# LP-9101: DeFi Protocol Integration Standard

| Field | Value |
|-------|-------|
| LP | 2501 |
| Title | DeFi Protocol Integration Standard |
| Author | Lux Network Team |
| Status | Draft |
| Created | 2025-12-14 |
| Category | LRC (Smart Contracts) |
| Requires | LP-2000, LP-7321, LP-7322 |

## Abstract

This LP documents the canonical DeFi protocol integrations included in the Lux Standard Library (`/Users/z/work/lux/standard/src/`). The library provides MIT/GPL-licensed alternatives to BUSL-encumbered protocols, enabling developers to build DeFi applications on Lux Network without license restrictions.

**Protocol Families Included**:
- **GMX v1** (MIT): Perpetuals, leveraged trading, GLP liquidity
- **Alchemix v2** (GPL-3.0): Self-repaying loans, synthetic debt tokens
- **Compound-style patterns** (MIT): Lending/borrowing primitives

**Explicitly Excluded**:
- AAVE v2/v3 (BUSL-1.1)
- GMX Synthetics/v2 (BUSL-1.1)
- Uniswap v4 (BUSL-1.1)

## Motivation

### Problem Statement

The DeFi ecosystem has increasingly adopted Business Source License (BUSL-1.1) for flagship protocols. While BUSL provides time-delayed open source conversion, it creates immediate barriers:

1. **License Incompatibility**: BUSL cannot be combined with GPL or used in MIT-licensed projects
2. **Fork Restrictions**: Cannot deploy modified versions on competing chains without permission
3. **Ecosystem Fragmentation**: Each L1/L2 must negotiate separate licenses or wait 2-4 years

### Solution

The Lux Standard Library curates MIT/GPL-licensed DeFi primitives that provide equivalent functionality:

| Use Case | BUSL Protocol | Lux Standard Alternative | License |
|----------|---------------|--------------------------|---------|
| Perpetuals | GMX Synthetics | GMX v1 (`src/gmx2/`) | MIT |
| Lending | AAVE v3 | Compound patterns + Alchemix | MIT/GPL |
| Self-Repaying Loans | - | Alchemix v2 (`src/alcx2/`) | GPL-3.0 |
| AMM | Uniswap v4 | Uniswap v2/v3 compatible | GPL-2.0 |

### Benefits

1. **Legal Clarity**: All integrations are MIT or GPL-licensed
2. **Immediate Deployment**: No waiting for BUSL conversion
3. **Full Customization**: Fork and modify without restrictions
4. **Lux-Native Features**: Integration with threshold signatures, post-quantum crypto

## Specification

### Protocol Family: GMX v1 (Perpetuals)

**Location**: `/Users/z/work/lux/standard/src/gmx2/`

**License**: MIT

**Core Contracts**:

| Contract | Path | Purpose |
|----------|------|---------|
| `Vault.sol` | `contracts/core/Vault.sol` | Central liquidity vault (53KB) |
| `Router.sol` | `contracts/core/Router.sol` | Trade routing |
| `PositionRouter.sol` | `contracts/core/PositionRouter.sol` | Position management |
| `OrderBook.sol` | `contracts/core/OrderBook.sol` | Limit order book |
| `GlpManager.sol` | `contracts/core/GlpManager.sol` | GLP liquidity token management |
| `VaultPriceFeed.sol` | `contracts/core/VaultPriceFeed.sol` | Oracle price feeds |

**Directory Structure**:
```solidity
src/gmx2/
├── contracts/
│   ├── core/           # Vault, Router, Position management
│   ├── access/         # Access control (Governable, TokenManager)
│   ├── amm/            # AMM components
│   ├── gambit-token/   # GMX token contracts
│   ├── gmx/            # GMX-specific contracts
│   ├── libraries/      # Math, pricing utilities
│   ├── oracle/         # Price feed integrations
│   ├── peripherals/    # TimeDistributor, Vester
│   ├── referrals/      # Referral system
│   ├── staking/        # GMX/GLP staking
│   └── tokens/         # Token implementations
├── scripts/            # Deployment and utility scripts
├── test/               # Test suite
└── hardhat.config.js   # Build configuration
```

**Capabilities**:
- Perpetual futures with up to 50x leverage
- GLP (GMX Liquidity Provider) token system
- Multi-asset collateral (ETH, BTC, stablecoins)
- Position routing with keeper execution
- Referral fee distribution

**Lux Adaptations**:
- Integration with Lux native oracle (LP-9005)
- Threshold signature support for keeper operations
- C-Chain gas optimization

### Protocol Family: Alchemix v2 (Self-Repaying Loans)

**Location**: `/Users/z/work/lux/standard/src/alcx2/`

**License**: GPL-3.0

**Core Contracts**:

| Contract | Path | Purpose |
|----------|------|---------|
| `AlchemistV2.sol` | `contracts/AlchemistV2.sol` | Main lending engine |
| `AlchemicTokenV2.sol` | `contracts/AlchemicTokenV2.sol` | Synthetic debt token (alUSD, alETH) |
| `TransmuterV2.sol` | `contracts/TransmuterV2.sol` | Token transmutation |
| `TransmuterBuffer.sol` | `contracts/TransmuterBuffer.sol` | Transmuter liquidity buffer |
| `WETHGateway.sol` | `contracts/WETHGateway.sol` | ETH wrapping gateway |
| `gALCX.sol` | `contracts/gALCX.sol` | Governance token |
| `CrossChainCanonicalAlchemicTokenV2.sol` | `contracts/CrossChainCanonicalAlchemicTokenV2.sol` | Cross-chain token support |

**Directory Structure**:
```solidity
src/alcx2/
├── contracts/
│   ├── adapters/       # Yield source adapters (Yearn, etc.)
│   ├── base/           # Base contracts (Errors, Multicall, Mutex)
│   ├── interfaces/     # Interface definitions
│   └── libraries/      # SafeCast, Sets, TokenUtils, Limiters
├── deployments/        # Deployment artifacts
├── test/               # Test suite
└── hardhat.config.ts   # Build configuration
```

**Capabilities**:
- Self-repaying loans via yield farming
- Synthetic debt tokens (alUSD, alETH)
- Multiple yield strategies per vault
- Cross-chain token canonicalization
- Debt ceiling and rate limiting

**Key Interfaces**:
```solidity
interface IAlchemistV2 {
    function deposit(address yieldToken, uint256 amount, address recipient) external returns (uint256);
    function withdraw(address yieldToken, uint256 shares, address recipient) external returns (uint256);
    function mint(uint256 amount, address recipient) external;
    function burn(uint256 amount, address recipient) external;
    function liquidate(address owner, uint256 shares, uint256 minimumAmountOut) external returns (uint256);
}
```solidity

**Lux Adaptations**:
- Integration with Lux yield sources
- Cross-chain via Warp messaging (LP-2313)
- Support for Lux native tokens (LUXD, LETH)

### OZ 5.x Compatibility Layer

OpenZeppelin 5.x removed several legacy utilities. The standard library provides shims for backward compatibility:

**SafeMath Shim**:
```
Location: /Users/z/work/lux/standard/src/safe/contracts/external/SafeMath.sol
License: LGPL-3.0
```solidity

**Usage**: Required for contracts targeting Solidity <0.8.0 or requiring explicit overflow checks.

```solidity
// SafeMath operations
library SafeMath {
    function mul(uint256 a, uint256 b) internal pure returns (uint256);
    function sub(uint256 a, uint256 b) internal pure returns (uint256);
    function add(uint256 a, uint256 b) internal pure returns (uint256);
    function div(uint256 a, uint256 b) internal pure returns (uint256);
}
```

**SafeCast Utility**:
```markdown
Location: /Users/z/work/lux/standard/src/alcx2/contracts/libraries/SafeCast.sol
License: GPL-2.0-or-later
solidity
library SafeCast {
    function toInt256(uint256 y) internal pure returns (int256 z);
    function toUint256(int256 y) internal pure returns (uint256 z);
}
```solidity

**Additional Utilities**:
- `EnumerableSet.sol` - Set data structures (`src/gmx2/contracts/libraries/utils/`)
- `EnumerableMap.sol` - Map data structures
- `ReentrancyGuard.sol` - Reentrancy protection
- `Address.sol` - Address utilities

### Integration with Threshold Signature Precompiles

DeFi protocols integrate with Lux threshold signature precompiles for enhanced security:

**FROST Threshold Signatures (LP-7321)**:
```
Precompile: 0x020000000000000000000000000000000000000C
Use Case: Multi-party custody, DAO treasury
solidity
import {FROSTLib} from "precompiles/frost/IFROST.sol";

contract ThresholdTreasury {
    using FROSTLib for *;

    bytes32 public treasuryKey;
    uint32 public threshold;
    uint32 public totalSigners;

    function executeTransfer(
        address to,
        uint256 amount,
        bytes calldata signature
    ) external {
        bytes32 msgHash = keccak256(abi.encode(to, amount, nonce++));
        FROSTLib.verifyOrRevert(threshold, totalSigners, treasuryKey, msgHash, signature);
        // Execute transfer
    }
}
```

**CGGMP21 Threshold ECDSA (LP-7322)**:
```markdown
Precompile: 0x020000000000000000000000000000000000000D
Use Case: Institutional custody, cross-chain bridges
solidity
import {CGGMP21Lib} from "precompiles/cggmp21/ICGGMP21.sol";

contract InstitutionalVault {
    using CGGMP21Lib for *;

    bytes public custodyKey;
    uint32 public threshold;
    uint32 public totalSigners;

    function authorizedWithdraw(
        address token,
        uint256 amount,
        bytes calldata signature
    ) external {
        bytes32 msgHash = keccak256(abi.encode(token, amount, block.number));
        CGGMP21Lib.verifyOrRevert(threshold, totalSigners, custodyKey, msgHash, signature);
        IERC20(token).transfer(msg.sender, amount);
    }
}
```solidity

**Gas Costs**:

| Precompile | Base Gas | Per-Signer | 2-of-3 | 5-of-7 |
|------------|----------|------------|--------|--------|
| FROST | 50,000 | 5,000 | 65,000 | 85,000 |
| CGGMP21 | 75,000 | 10,000 | 105,000 | 145,000 |

### Lending/Borrowing Primitives

While Compound protocol is not directly included, the standard library provides equivalent patterns:

**Flash Loan Interface** (ERC-3156):
```
Location: /Users/z/work/lux/standard/src/alcx2/contracts/interfaces/IERC3156FlashLender.sol
solidity
interface IERC3156FlashLender {
    function maxFlashLoan(address token) external view returns (uint256);
    function flashFee(address token, uint256 amount) external view returns (uint256);
    function flashLoan(
        IERC3156FlashBorrower receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) external returns (bool);
}
```

**Yield Adapter Pattern**:
```solidity
Location: /Users/z/work/lux/standard/src/alcx2/contracts/interfaces/ITokenAdapter.sol
solidity
interface ITokenAdapter {
    function token() external view returns (address);
    function underlyingToken() external view returns (address);
    function price() external view returns (uint256);
    function wrap(uint256 amount, address recipient) external returns (uint256);
    function unwrap(uint256 amount, address recipient) external returns (uint256);
}
```bash

## Rationale

### Why GMX v1 Over GMX Synthetics

GMX v1 remains MIT-licensed while GMX Synthetics (v2) adopted BUSL-1.1. The v1 architecture provides:

1. **Proven Security**: Years of mainnet operation with billions in TVL
2. **Simpler Model**: Single vault architecture vs. complex synthetic markets
3. **License Freedom**: Full fork and modification rights

Trade-offs accepted:
- No synthetic assets (use Alchemix instead)
- Lower capital efficiency (mitigated by GLP)

### Why Alchemix Over AAVE

AAVE v2/v3 use BUSL-1.1. Alchemix provides unique self-repaying loan functionality:

1. **No Liquidation Risk**: Yield repays debt automatically
2. **GPL-3.0 License**: Full open source compatibility
3. **Novel Primitive**: Self-repaying loans not available elsewhere

Trade-offs accepted:
- Lower borrow capacity vs. traditional lending
- Yield dependency for repayment

### Licensing Strategy

| License | Protocols | Compatibility |
|---------|-----------|---------------|
| MIT | GMX v1, Safe, utilities | Maximum permissiveness |
| GPL-3.0 | Alchemix | Copyleft, source disclosure required |
| LGPL-3.0 | SafeMath shim | Library linking permitted |
| BUSL | EXCLUDED | Not permitted |

**License Selection Criteria**:
1. Must allow commercial use without fees
2. Must allow modification and redistribution
3. Must not require permission from original authors
4. Must be compatible with MIT or GPL ecosystem

## Backwards Compatibility

### Migration from Ethereum Mainnet Forks

Projects migrating from Ethereum can use the standard library with minimal changes:

**GMX v1**: Direct compatibility with mainnet deployment
**Alchemix v2**: Requires adapter updates for Lux yield sources

### Solidity Version Compatibility

| Component | Solidity Version | Notes |
|-----------|------------------|-------|
| GMX v1 | ^0.6.12 - ^0.8.0 | Legacy version support |
| Alchemix v2 | ^0.8.11 | Modern Solidity |
| Precompiles | ^0.8.24 | Latest features |
| SafeMath shim | >=0.7.0 <0.9.0 | Broad compatibility |

## Test Cases

### GMX v1 Integration Test

```bash
cd /Users/z/work/lux/standard/src/gmx2
npm install
npx hardhat test
```

**Key Test Cases**:
1. Vault deposit/withdrawal
2. Position open/close
3. Liquidation mechanics
4. GLP minting/burning
5. Fee distribution

### Alchemix v2 Integration Test

```bash
cd /Users/z/work/lux/standard/src/alcx2
yarn install
yarn test
```solidity

**Key Test Cases**:
1. Deposit collateral
2. Mint synthetic tokens
3. Yield accrual
4. Debt repayment
5. Liquidation

### Threshold Signature Integration

```solidity
// Test FROST integration with GMX vault
function testFROSTVaultWithdrawal() public {
    bytes memory sig = generateFROSTSignature(2, 3, vaultKey, withdrawHash);
    vault.authorizedWithdraw(token, amount, sig);
    assertEq(IERC20(token).balanceOf(recipient), amount);
}
```

## Reference Implementation

### Directory Summary

```solidity
/Users/z/work/lux/standard/src/
├── gmx2/                    # GMX v1 perpetuals (MIT)
│   ├── contracts/core/      # Vault, Router, OrderBook
│   ├── contracts/staking/   # GMX/GLP staking
│   └── contracts/tokens/    # Token implementations
├── alcx2/                   # Alchemix v2 (GPL-3.0)
│   ├── contracts/           # AlchemistV2, TransmuterV2
│   └── contracts/adapters/  # Yield adapters
├── safe/contracts/external/ # SafeMath shim (LGPL-3.0)
├── precompiles/
│   ├── frost/               # FROST threshold (LP-7321)
│   └── cggmp21/             # CGGMP21 threshold (LP-7322)
└── interfaces/              # Common interfaces
```

### Build Commands

```bash
# GMX v1
cd /Users/z/work/lux/standard/src/gmx2
npm install
npx hardhat compile

# Alchemix v2
cd /Users/z/work/lux/standard/src/alcx2
yarn install
yarn compile

# Full standard library
cd /Users/z/work/lux/standard
forge build
```solidity

## Security Considerations

### Audit Status

| Protocol | Auditor | Report |
|----------|---------|--------|
| GMX v1 | ABDK | [Report](https://github.com/gmx-io/gmx-contracts/tree/master/audits) |
| Alchemix v2 | Runtime Verification | [Report]() |

### Risk Factors

**GMX v1**:
- Oracle manipulation risk (mitigated by multi-source feeds)
- Liquidation cascade risk (insurance fund)
- Smart contract risk (extensively audited)

**Alchemix v2**:
- Yield source risk (strategy audits)
- Synthetic peg risk (transmuter mechanism)
- Rate limiting (debt ceiling controls)

### Threshold Signature Security

For DeFi protocols using threshold signatures:
- Minimum threshold: 2-of-3 for small values, 5-of-7 for large
- Key refresh: Rotate every 30 days
- Secure enclave: Store key shares in TEE when available

## Economic Impact

### Gas Costs

| Operation | GMX v1 | Alchemix v2 |
|-----------|--------|-------------|
| Open Position | ~300K gas | N/A |
| Close Position | ~200K gas | N/A |
| Deposit | ~150K gas | ~200K gas |
| Mint Synthetic | N/A | ~250K gas |
| Liquidation | ~400K gas | ~350K gas |

### Fee Structures

**GMX v1**:
- Trading fee: 0.1% (open + close)
- Borrow fee: Variable based on utilization
- Swap fee: 0.2-0.5%

**Alchemix v2**:
- Protocol fee: 10% of yield
- No trading fees
- No liquidation penalty

## Open Questions

1. **Compound v3 Integration**: Should Compound v3 (MIT-licensed) be added when production-ready?
2. **Cross-Chain Alchemix**: How should alUSD/alETH bridge to Lux chains?
3. **GMX v1 Upgrades**: Path for receiving upstream security patches?

## Related LPs

- **LP-2000**: C-Chain EVM Specification
- **LP-7321**: FROST Threshold Signature Precompile
- **LP-7322**: CGGMP21 Threshold ECDSA Precompile
- **LP-9040**: Perpetuals & Derivatives Protocol (LP-9000 series)
- **LP-2313**: Warp Messaging Precompile

## References

1. [GMX v1 Documentation](https://gmxio.gitbook.io/gmx/)
2. [Alchemix v2 Documentation](https://alchemix-finance.gitbook.io/v2/)
3. [OpenZeppelin 5.x Migration](https://docs.openzeppelin.com/contracts/5.x/upgradeable)
4. [BUSL-1.1 License](https://mariadb.com/bsl11/)
5. [FROST IETF Draft](https://datatracker.ietf.org/doc/draft-irtf-cfrg-frost/)
6. [CGGMP21 Paper](https://eprint.iacr.org/2021/060)

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-14 | Initial specification |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
```
