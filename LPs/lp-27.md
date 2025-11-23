---
lp: 27
title: 'LRC Token Standards Adoption'
description: Adopts and rebrands key Ethereum Request for Comment (ERC) token standards as Lux Request for Comment (LRC) standards for the Lux ecosystem.
author: Gemini (@gemini)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-07-22
requires: 26
---

## Abstract

To ensure seamless compatibility, developer familiarity, and a unified brand identity, this LP formalizes the adoption of essential Ethereum token standards as Lux Request for Comment (LRC) standards. This proposal specifies the direct mapping of the most widely-used ERCs to their LRC counterparts (e.g., ERC-20 becomes LRC-20). It defines the canonical interfaces for these standards and designates the contracts within the `/standard` repository as the official reference implementation for the Lux ecosystem.

## Motivation

A standardized token interface is the bedrock of a composable DeFi and NFT ecosystem. Smart contracts must be able to interact with any token in a predictable way. By adopting the battle-tested ERC standards, we:

*   **Lower the Barrier to Entry:** Developers familiar with Ethereum can build on Lux with zero learning curve for token interactions.
*   **Enable Instant Composability:** All wallets, dApps, and protocols on Lux can support any LRC token from day one.
*   **Establish a Unified Brand:** Using the "LRC" prefix clearly identifies tokens that adhere to the official Lux Network standard, enhancing trust and clarity.
*   **Avoid Reinventing the Wheel:** We leverage years of community vetting and security audits that have gone into the core Ethereum standards.

## Specification


This LP formally adopts and rebrands the core Ethereum token standards as Lux Request for Comment (LRC) interfaces. For full specifications, see the respective LPs:

| LRC Standard | Maps To  | LP Reference    |
|-------------:|:--------:|:-----------------|
| LRC-20           | ERC-20      | [LP-20](./lp-20.md)    |
| LRC-20Burnable   | IERC20Burnable   | [LP-28](./lp-28.md)    |
| LRC-20Mintable   | IERC20Mintable   | [LP-29](./lp-29.md)    |
| LRC-20Bridgable  | IERC20Bridgable  | [LP-30](./lp-30.md)    |
| LRC-721          | ERC-721     | [LP-721](./lp-721.md)  |
| LRC-721Burnable  | IERC721Burnable  | [LP-31](./lp-31.md)    |
| LRC-1155         | ERC-1155    | [LP-1155](./lp-1155.md)|

## Rationale

By adopting the battle-tested ERC token interfaces, Lux ensures maximum developer familiarity, composability, and interoperability. The LRC prefix both clarifies official Lux approvals and maintains a consistent brand identity.

## Backwards Compatibility

This proposal is fully backwards compatible. It formalizes and rebrands existing de-facto standards. Contracts compliant with the original ERC interfaces remain compliant with their corresponding LRC standards.

## Security Considerations

The security considerations for LRC-20, LRC-721, and LRC-1155 are inherited from their ERC counterparts. Implementers must ensure correct adherence to the interface and avoid introducing vulnerabilities in custom logic.

## Reference Implementation

The canonical reference implementations for LRC standards are maintained in the `/standard` repository. Implementations must be renamed and structured to use the LRC prefix (for example, `ERC721.sol` → `LRC721.sol`).

## Implementation

### Standard Library Location
**Repository**: `/Users/z/work/lux/standard/`

### LRC-20 Implementation
- **Location**: `/Users/z/work/lux/standard/src/`
  - `ERC20.sol` - Base fungible token implementation
  - Test cases in `/Users/z/work/lux/standard/test/`

- **Interface**:
  ```solidity
  interface ILRC20 {
      function totalSupply() external view returns (uint256);
      function balanceOf(address) external view returns (uint256);
      function transfer(address, uint256) external returns (bool);
      function approve(address, uint256) external returns (bool);
      function transferFrom(address, address, uint256) external returns (bool);
      // ... standard ERC20 events
  }
  ```

### LRC-721 Implementation
- **Location**: `/Users/z/work/lux/standard/src/ERC721.sol`
  - NFT standard with metadata
  - Enumeration extension support
  - Test suite for compliance

### LRC-1155 Implementation
- **Location**: `/Users/z/work/lux/standard/src/ERC1155.sol`
  - Multi-token standard
  - Batch operations
  - URI handling for metadata

### Extension Standards
- **LRC-20Burnable** (LP-28): `/Users/z/work/lux/standard/src/ERC20Burnable.sol`
  - Mint/burn operations
- **LRC-20Mintable** (LP-29): `/Users/z/work/lux/standard/src/ERC20Mintable.sol`
  - Controlled minting with access control
- **LRC-20Bridgable** (LP-30): Bridge integration for cross-chain transfers
- **LRC-721Burnable** (LP-31): NFT burning support

### Testing Framework
```bash
cd /Users/z/work/lux/standard
# Run all LRC token tests
forge test

# Run specific token tests
forge test --match "LRC20"
forge test --match "LRC721"
forge test --match "LRC1155"

# Check coverage
forge coverage
```

### Deployment Examples
```bash
# Deploy LRC-20 token
forge create src/ERC20.sol:ERC20 \
  --constructor-args "MyToken" "MTK" "1000000000000000000000000" \
  --rpc-url http://localhost:9650/ext/bc/C

# Verify contract
forge verify-contract <address> src/ERC20.sol:ERC20 \
  --rpc-url http://localhost:9650/ext/bc/C
```

### GitHub References
- **Standard Library**: https://github.com/luxfi/standard
- **Token Implementations**: https://github.com/luxfi/standard/tree/main/src
- **Test Suite**: https://github.com/luxfi/standard/tree/main/test

### Integration with Other Standards
- **LP-20**: LRC-20 fungible token base
- **LP-721**: LRC-721 NFT base
- **LP-1155**: LRC-1155 multi-token base
- **LP-26**: C-Chain EVM equivalence enables deployment

### Tooling Support
| Tool | LRC Support | Status |
|------|------------|--------|
| Foundry | Native via forge | ✅ Full support |
| Hardhat | Via ethers.js | ✅ Full support |
| MetaMask | Via ABI | ✅ Full support |
| ethers.js | Native | ✅ Full support |
| Web3.js | Native | ✅ Full support |
| OpenZeppelin | Compatible | ✅ Drop-in replacement |

### Version Compatibility
- **Solidity**: 0.8.0+
- **OpenZeppelin Contracts**: v4.0+
- **C-Chain RPC**: Latest (via LP-26)

### Migration Path from ERC Standards
Since LRCs are direct adoptions of ERCs:
1. Contracts written for ERC tokens work unchanged
2. Tooling has full compatibility
3. No breaking changes from Ethereum standard
4. Brand identity ("LRC" prefix) maintained in Lux ecosystem
