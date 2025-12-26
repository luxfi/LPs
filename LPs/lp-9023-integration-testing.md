---
lp: 9023
title: Integration Testing Requirements
description: Comprehensive integration testing standards and CI/CD pipelines for production DeFi
author: Lux Core Team
status: Superseded
tags: [dex, trading]
type: Standards Track
category: Core
created: 2025-01-15
requires: [9016, 9020, 9022]
order: 23
---

# LP-9023: Integration Testing Requirements

## Abstract

This LP defines integration testing standards, test suite requirements, and CI/CD pipeline configurations for Lux DeFi protocols. Ensures comprehensive testing before any production deployment.

## Motivation

Robust testing is critical for:
- Preventing production bugs
- Ensuring protocol security
- Maintaining code quality
- Enabling confident deployments
- Regulatory compliance

## Specification

### 1. Test Coverage Requirements

| Test Type | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| Unit Tests | 90% | 95% |
| Integration Tests | 80% | 90% |
| E2E Tests | 70% | 85% |
| Fuzz Tests | 100% public functions | 100% |
| Invariant Tests | All critical invariants | 100% |

### 2. Test Categories

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

abstract contract DeFiTestBase is Test {
    // Test categories
    modifier unitTest() {
        vm.label(address(this), "UNIT_TEST");
        _;
    }

    modifier integrationTest() {
        vm.label(address(this), "INTEGRATION_TEST");
        _;
    }

    modifier e2eTest() {
        vm.label(address(this), "E2E_TEST");
        _;
    }

    modifier fuzzTest() {
        vm.label(address(this), "FUZZ_TEST");
        _;
    }

    modifier invariantTest() {
        vm.label(address(this), "INVARIANT_TEST");
        _;
    }

    // Common setup
    function setUp() public virtual {
        // Deploy core contracts
        // Setup test accounts
        // Fund accounts
    }
}
```solidity

### 3. Unit Test Requirements

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./DeFiTestBase.sol";

contract SwapUnitTests is DeFiTestBase {
    IDEX dex;
    IERC20 tokenA;
    IERC20 tokenB;

    function setUp() public override {
        super.setUp();
        // Deploy contracts
    }

    // Test naming: test_<function>_<scenario>_<expected>
    function test_swap_exactInput_success() public unitTest {
        uint256 amountIn = 1000e18;
        uint256 minAmountOut = 900e18;

        uint256 balanceBefore = tokenB.balanceOf(address(this));

        dex.swap(address(tokenA), address(tokenB), amountIn, minAmountOut);

        uint256 balanceAfter = tokenB.balanceOf(address(this));
        assertGt(balanceAfter - balanceBefore, minAmountOut);
    }

    function test_swap_insufficientBalance_reverts() public unitTest {
        uint256 amountIn = 1e30; // More than balance

        vm.expectRevert("Insufficient balance");
        dex.swap(address(tokenA), address(tokenB), amountIn, 0);
    }

    function test_swap_slippageExceeded_reverts() public unitTest {
        uint256 amountIn = 1000e18;
        uint256 unrealisticMinOut = 2000e18; // More than possible

        vm.expectRevert("Slippage exceeded");
        dex.swap(address(tokenA), address(tokenB), amountIn, unrealisticMinOut);
    }

    function test_swap_zeroAmount_reverts() public unitTest {
        vm.expectRevert("Zero amount");
        dex.swap(address(tokenA), address(tokenB), 0, 0);
    }

    function test_swap_sameToken_reverts() public unitTest {
        vm.expectRevert("Same token");
        dex.swap(address(tokenA), address(tokenA), 1000e18, 0);
    }
}
```

### 4. Integration Test Requirements

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DeFiIntegrationTests is DeFiTestBase {
    // Full protocol deployment
    IDEX dex;
    IOracle oracle;
    IBridge bridge;
    ILiquidityMining mining;

    function setUp() public override {
        super.setUp();

        // Deploy full protocol stack
        dex = deployDEX();
        oracle = deployOracle();
        bridge = deployBridge();
        mining = deployMining();

        // Setup integrations
        dex.setOracle(address(oracle));
        mining.addPool(address(dex.getPool(tokenA, tokenB)));
    }

    function test_swapWithOracleValidation() public integrationTest {
        // Get oracle price
        uint256 oraclePrice = oracle.getPrice(address(tokenA), address(tokenB));

        // Execute swap
        uint256 amountIn = 1000e18;
        uint256 amountOut = dex.swap(address(tokenA), address(tokenB), amountIn, 0);

        // Verify execution price is within tolerance of oracle
        uint256 executionPrice = (amountOut * 1e18) / amountIn;
        uint256 deviation = _calculateDeviation(executionPrice, oraclePrice);

        assertLt(deviation, 100); // < 1% deviation
    }

    function test_crossChainSwapFlow() public integrationTest {
        // 1. Initiate bridge transfer
        bytes32 messageId = bridge.sendMessage(
            DEST_CHAIN_ID,
            abi.encode(address(tokenA), 1000e18)
        );

        // 2. Simulate message receipt
        vm.chainId(DEST_CHAIN_ID);
        bridge.receiveMessage(messageId, SRC_CHAIN_ID, abi.encode(address(tokenA), 1000e18));

        // 3. Verify balance on destination
        assertEq(tokenA.balanceOf(address(this)), 1000e18);
    }

    function test_liquidityMiningRewards() public integrationTest {
        // 1. Add liquidity
        uint256 lpTokens = dex.addLiquidity(address(tokenA), address(tokenB), 1000e18, 1000e18);

        // 2. Stake LP tokens
        mining.stake(address(dex.getPool(tokenA, tokenB)), lpTokens);

        // 3. Fast forward time
        vm.warp(block.timestamp + 7 days);

        // 4. Claim rewards
        uint256 rewards = mining.claimRewards(address(dex.getPool(tokenA, tokenB)));

        assertGt(rewards, 0);
    }

    function test_emergencyPauseFlow() public integrationTest {
        // 1. Trigger emergency
        guardian.escalate(EmergencyLevel.CRITICAL, "Test emergency");

        // 2. Verify all contracts paused
        assertTrue(dex.paused());
        assertTrue(bridge.paused());
        assertTrue(mining.paused());

        // 3. Verify only withdrawals work
        vm.expectRevert("Paused");
        dex.swap(address(tokenA), address(tokenB), 1000e18, 0);

        // Withdrawals should still work
        dex.removeLiquidity(address(tokenA), address(tokenB), 100e18);
    }

    function _calculateDeviation(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a > b) {
            return ((a - b) * 10000) / b;
        }
        return ((b - a) * 10000) / a;
    }
}
```solidity

### 5. Fuzz Testing

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DeFiFuzzTests is DeFiTestBase {
    function testFuzz_swap_anyAmount(uint256 amountIn) public fuzzTest {
        // Bound input to reasonable range
        amountIn = bound(amountIn, 1, tokenA.balanceOf(address(this)));

        uint256 balanceBefore = tokenB.balanceOf(address(this));

        try dex.swap(address(tokenA), address(tokenB), amountIn, 0) returns (uint256 amountOut) {
            // Verify output is positive
            assertGt(amountOut, 0);

            // Verify conservation of value (within slippage)
            uint256 balanceAfter = tokenB.balanceOf(address(this));
            assertEq(balanceAfter - balanceBefore, amountOut);
        } catch {
            // Reverts are acceptable for edge cases
        }
    }

    function testFuzz_addLiquidity_proportional(
        uint256 amount0,
        uint256 amount1
    ) public fuzzTest {
        amount0 = bound(amount0, 1e18, 1e24);
        amount1 = bound(amount1, 1e18, 1e24);

        // Mint tokens
        deal(address(tokenA), address(this), amount0);
        deal(address(tokenB), address(this), amount1);

        // Add liquidity
        uint256 lpTokens = dex.addLiquidity(
            address(tokenA),
            address(tokenB),
            amount0,
            amount1
        );

        // Verify LP tokens received
        assertGt(lpTokens, 0);

        // Verify pool reserves updated
        (uint256 reserve0, uint256 reserve1) = dex.getReserves(address(tokenA), address(tokenB));
        assertGe(reserve0, amount0);
        assertGe(reserve1, amount1);
    }

    function testFuzz_priceOracle_staleness(uint256 timeDelta) public fuzzTest {
        timeDelta = bound(timeDelta, 0, 1 days);

        // Update oracle
        oracle.updatePrice(address(tokenA), 1000e8);

        // Fast forward
        vm.warp(block.timestamp + timeDelta);

        // Check staleness
        if (timeDelta > oracle.MAX_STALENESS()) {
            vm.expectRevert("Stale price");
            oracle.getPrice(address(tokenA));
        } else {
            uint256 price = oracle.getPrice(address(tokenA));
            assertEq(price, 1000e8);
        }
    }
}
```

### 6. Invariant Testing

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DeFiInvariantTests is DeFiTestBase {
    function setUp() public override {
        super.setUp();

        // Target contracts for invariant testing
        targetContract(address(dex));
        targetContract(address(pool));
    }

    // Invariant: K should never decrease (except fees)
    function invariant_constantProductMaintained() public invariantTest {
        (uint256 reserve0, uint256 reserve1) = pool.getReserves();
        uint256 currentK = reserve0 * reserve1;

        assertGe(currentK, initialK, "K decreased unexpectedly");
    }

    // Invariant: Total supply of LP tokens equals sum of all balances
    function invariant_lpTokenSupplyConsistent() public invariantTest {
        uint256 totalSupply = pool.totalSupply();
        uint256 sumBalances = 0;

        for (uint i = 0; i < actors.length; i++) {
            sumBalances += pool.balanceOf(actors[i]);
        }

        assertEq(totalSupply, sumBalances, "LP supply mismatch");
    }

    // Invariant: Protocol should never be insolvent
    function invariant_protocolSolvent() public invariantTest {
        uint256 totalDeposits = vault.totalAssets();
        uint256 actualBalance = token.balanceOf(address(vault));

        assertGe(actualBalance, totalDeposits, "Protocol insolvent");
    }

    // Invariant: User can always withdraw their funds
    function invariant_fundsWithdrawable() public invariantTest {
        for (uint i = 0; i < actors.length; i++) {
            uint256 userShares = vault.balanceOf(actors[i]);
            if (userShares > 0) {
                uint256 withdrawable = vault.maxWithdraw(actors[i]);
                assertGt(withdrawable, 0, "Cannot withdraw");
            }
        }
    }

    // Invariant: Prices should be within oracle bounds
    function invariant_pricesWithinBounds() public invariantTest {
        uint256 spotPrice = dex.getSpotPrice(address(tokenA), address(tokenB));
        uint256 oraclePrice = oracle.getPrice(address(tokenA));

        uint256 deviation = _calculateDeviation(spotPrice, oraclePrice);
        assertLt(deviation, 1000, "Price deviation > 10%");
    }
}
```solidity

### 7. E2E Test Scenarios

```typescript
// e2e/swap.test.ts
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('E2E: DEX Swap Flow', () => {
  let user: SignerWithAddress;
  let dex: DEX;
  let tokenA: ERC20;
  let tokenB: ERC20;

  before(async () => {
    // Deploy fresh environment
    [user] = await ethers.getSigners();
    ({ dex, tokenA, tokenB } = await deployFullProtocol());

    // Fund user
    await tokenA.mint(user.address, ethers.parseEther('10000'));
  });

  it('should complete full swap lifecycle', async () => {
    const amountIn = ethers.parseEther('100');

    // 1. Approve
    await tokenA.connect(user).approve(dex.address, amountIn);

    // 2. Get quote
    const quote = await dex.getQuote(tokenA.address, tokenB.address, amountIn);
    expect(quote).to.be.gt(0);

    // 3. Execute swap
    const tx = await dex.connect(user).swap(
      tokenA.address,
      tokenB.address,
      amountIn,
      quote.mul(99).div(100) // 1% slippage
    );

    // 4. Verify receipt
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);

    // 5. Verify balances
    const balanceB = await tokenB.balanceOf(user.address);
    expect(balanceB).to.be.gte(quote.mul(99).div(100));

    // 6. Verify events
    const swapEvent = receipt.events?.find(e => e.event === 'Swap');
    expect(swapEvent).to.exist;
    expect(swapEvent?.args?.user).to.equal(user.address);
  });

  it('should handle multi-hop swap', async () => {
    // tokenA -> tokenB -> tokenC
    const path = [tokenA.address, tokenB.address, tokenC.address];
    const amountIn = ethers.parseEther('100');

    const quote = await dex.getMultiHopQuote(path, amountIn);
    await tokenA.connect(user).approve(dex.address, amountIn);

    const tx = await dex.connect(user).swapMultiHop(
      path,
      amountIn,
      quote.mul(98).div(100)
    );

    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
  });

  it('should respect gas limits', async () => {
    const amountIn = ethers.parseEther('100');
    await tokenA.connect(user).approve(dex.address, amountIn);

    const tx = await dex.connect(user).swap(
      tokenA.address,
      tokenB.address,
      amountIn,
      0
    );

    const receipt = await tx.wait();
    expect(receipt.gasUsed).to.be.lt(200000); // Max 200k gas
  });
});
```

### 8. CI/CD Pipeline

```yaml
# .github/workflows/defi-tests.yml
name: DeFi Protocol Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: foundry-rs/foundry-toolchain@v1

      - name: Run unit tests
        run: forge test --match-contract ".*UnitTests" -vvv

      - name: Check coverage
        run: |
          forge coverage --report lcov
          lcov --summary lcov.info | grep -E "lines\.*: [0-9]+" | awk '{print $2}' | cut -d'%' -f1 | xargs -I {} test {} -ge 90

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: foundry-rs/foundry-toolchain@v1

      - name: Run integration tests
        run: forge test --match-contract ".*IntegrationTests" -vvv --fork-url ${{ secrets.RPC_URL }}

  fuzz-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: foundry-rs/foundry-toolchain@v1

      - name: Run fuzz tests
        run: forge test --match-contract ".*FuzzTests" -vvv --fuzz-runs 10000

  invariant-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: foundry-rs/foundry-toolchain@v1

      - name: Run invariant tests
        run: forge test --match-contract ".*InvariantTests" -vvv --invariant-runs 256 --invariant-depth 100

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [integration-tests, fuzz-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Start local node
        run: npx hardhat node &

      - name: Run E2E tests
        run: npx hardhat test test/e2e/*.ts --network localhost

  security-scan:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4

      - name: Run Slither
        uses: crytic/slither-action@v0.3.0
        with:
          fail-on: high

      - name: Run Mythril
        run: |
          pip install mythril
          myth analyze contracts/*.sol --solc-json mythril.config.json
```solidity

## Test Data Requirements

| Scenario | Required Data |
|----------|--------------|
| Swap Tests | Token pairs, liquidity pools |
| Bridge Tests | Multi-chain setup, validators |
| Oracle Tests | Price feeds, historical data |
| Stress Tests | Load generation, metrics |

## Rationale

The testing standards reflect best practices from mature DeFi protocols and traditional software engineering:

1. **90% minimum coverage** ensures critical paths are tested while acknowledging that 100% coverage has diminishing returns
2. **Foundry-based testing** provides fast execution and native Solidity testing, reducing context switching
3. **Fuzz testing** catches edge cases that manual test writing would miss
4. **Invariant testing** validates mathematical properties that must always hold
5. **Multi-stage CI pipeline** enables fast feedback loops while ensuring comprehensive validation

The coverage requirements were calibrated based on analysis of vulnerabilities in production DeFi protocols—most exploits occur in under-tested code paths.

## Backwards Compatibility

This LP is compatible with existing testing frameworks:

- **Foundry**: Native support, recommended for new projects
- **Hardhat**: Full compatibility via hardhat-foundry plugin
- **Truffle**: Supported through test migration utilities
- **Brownie**: Python tests can coexist with Solidity tests

Existing test suites can be incrementally migrated:
1. Add Foundry configuration alongside existing framework
2. Gradually port tests starting with unit tests
3. Keep framework-specific tests for integration scenarios
4. Unify CI pipeline to run all test types

## Security Considerations

1. **Test isolation** - Each test runs in clean state
2. **Deterministic tests** - No flaky tests allowed
3. **Security test coverage** - All OWASP categories
4. **Mainnet fork testing** - Real data validation

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
```
