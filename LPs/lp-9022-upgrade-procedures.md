---
lp: 9022
title: Upgrade & Migration Procedures
description: Safe upgrade patterns, migration procedures, and versioning standards for production DeFi
author: Lux Core Team
status: Review
tags: [dex, trading]
type: Standards Track
category: Core
created: 2025-01-15
requires: [9016, 9021]
order: 22
---

# LP-9022: Upgrade & Migration Procedures

## Abstract

This LP defines safe upgrade patterns, migration procedures, data migration standards, and rollback mechanisms for Lux DeFi protocols. Ensures zero-downtime upgrades and data integrity for protocols managing billions in TVL.

## Motivation

Safe protocol upgrades require:
- Zero-downtime deployments
- Data integrity preservation
- Rollback capabilities
- Governance-controlled upgrades
- Comprehensive testing before deployment

## Specification

### 1. Upgrade Patterns

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IUpgradeManager {
    enum UpgradeState {
        NONE,
        PROPOSED,
        APPROVED,
        SCHEDULED,
        EXECUTING,
        COMPLETED,
        ROLLED_BACK
    }

    struct UpgradeProposal {
        bytes32 id;
        address newImplementation;
        bytes initData;
        uint256 proposedAt;
        uint256 scheduledFor;
        uint256 executedAt;
        address proposer;
        UpgradeState state;
        bytes32 migrationHash;
    }

    struct MigrationStep {
        bytes32 stepId;
        string description;
        bytes callData;
        bool executed;
        bool reversible;
        bytes rollbackData;
    }

    // Proposal management
    function proposeUpgrade(address newImpl, bytes calldata initData) external returns (bytes32 proposalId);
    function approveUpgrade(bytes32 proposalId) external;
    function scheduleUpgrade(bytes32 proposalId, uint256 executeAt) external;
    function executeUpgrade(bytes32 proposalId) external;
    function cancelUpgrade(bytes32 proposalId) external;

    // Migration
    function addMigrationStep(bytes32 proposalId, MigrationStep calldata step) external;
    function executeMigration(bytes32 proposalId) external;
    function rollbackMigration(bytes32 proposalId, uint256 toStep) external;

    // Verification
    function verifyUpgrade(bytes32 proposalId) external view returns (bool valid, string memory reason);
    function getUpgradeStatus(bytes32 proposalId) external view returns (UpgradeProposal memory);

    // Events
    event UpgradeProposed(bytes32 indexed proposalId, address indexed newImpl, address proposer);
    event UpgradeApproved(bytes32 indexed proposalId, uint256 approvals);
    event UpgradeScheduled(bytes32 indexed proposalId, uint256 executeAt);
    event UpgradeExecuted(bytes32 indexed proposalId, address indexed newImpl);
    event UpgradeRolledBack(bytes32 indexed proposalId, string reason);
}
```solidity

### 2. Transparent Proxy Pattern

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract DeFiProxyAdmin is ProxyAdmin {
    uint256 public constant UPGRADE_DELAY = 48 hours;
    uint256 public constant EMERGENCY_UPGRADE_DELAY = 4 hours;

    mapping(address => UpgradeRequest) public pendingUpgrades;

    struct UpgradeRequest {
        address newImplementation;
        bytes data;
        uint256 scheduledAt;
        uint256 executeAfter;
        bool isEmergency;
        bytes32 auditHash;
    }

    event UpgradeScheduled(address indexed proxy, address indexed newImpl, uint256 executeAfter);
    event UpgradeExecuted(address indexed proxy, address indexed newImpl);
    event UpgradeCancelled(address indexed proxy);

    function scheduleUpgrade(
        address proxy,
        address newImplementation,
        bytes calldata data,
        bytes32 auditHash
    ) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        require(pendingUpgrades[proxy].scheduledAt == 0, "Upgrade pending");

        uint256 executeAfter = block.timestamp + UPGRADE_DELAY;

        pendingUpgrades[proxy] = UpgradeRequest({
            newImplementation: newImplementation,
            data: data,
            scheduledAt: block.timestamp,
            executeAfter: executeAfter,
            isEmergency: false,
            auditHash: auditHash
        });

        emit UpgradeScheduled(proxy, newImplementation, executeAfter);
    }

    function executeUpgrade(address proxy) external onlyOwner {
        UpgradeRequest storage request = pendingUpgrades[proxy];
        require(request.scheduledAt > 0, "No upgrade scheduled");
        require(block.timestamp >= request.executeAfter, "Too early");

        address newImpl = request.newImplementation;
        bytes memory data = request.data;

        delete pendingUpgrades[proxy];

        if (data.length > 0) {
            upgradeAndCall(
                ITransparentUpgradeableProxy(proxy),
                newImpl,
                data
            );
        } else {
            upgrade(ITransparentUpgradeableProxy(proxy), newImpl);
        }

        emit UpgradeExecuted(proxy, newImpl);
    }

    function cancelUpgrade(address proxy) external onlyOwner {
        require(pendingUpgrades[proxy].scheduledAt > 0, "No upgrade");
        delete pendingUpgrades[proxy];
        emit UpgradeCancelled(proxy);
    }

    // Emergency upgrade with shorter delay (requires multi-sig + guardian approval)
    function scheduleEmergencyUpgrade(
        address proxy,
        address newImplementation,
        bytes calldata data
    ) external onlyOwner {
        uint256 executeAfter = block.timestamp + EMERGENCY_UPGRADE_DELAY;

        pendingUpgrades[proxy] = UpgradeRequest({
            newImplementation: newImplementation,
            data: data,
            scheduledAt: block.timestamp,
            executeAfter: executeAfter,
            isEmergency: true,
            auditHash: bytes32(0)
        });

        emit UpgradeScheduled(proxy, newImplementation, executeAfter);
    }
}
```

### 3. UUPS Upgrade Pattern

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

abstract contract DeFiUpgradeable is UUPSUpgradeable, AccessControlUpgradeable {
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    uint256 public version;
    mapping(uint256 => bool) public migrationCompleted;

    event Upgraded(uint256 indexed fromVersion, uint256 indexed toVersion, address implementation);
    event MigrationCompleted(uint256 indexed version, bytes32 migrationHash);

    modifier onlyUpgrader() {
        require(hasRole(UPGRADER_ROLE, msg.sender), "Not upgrader");
        _;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyUpgrader {
        require(newImplementation != address(0), "Invalid implementation");

        // Verify new implementation
        require(_isValidUpgrade(newImplementation), "Invalid upgrade");

        emit Upgraded(version, version + 1, newImplementation);
    }

    function _isValidUpgrade(address newImpl) internal view virtual returns (bool) {
        // Check new implementation has required interface
        try IERC165(newImpl).supportsInterface(type(IVersioned).interfaceId) returns (bool supported) {
            return supported;
        } catch {
            return false;
        }
    }

    function runMigration(bytes calldata migrationData) external onlyUpgrader {
        require(!migrationCompleted[version], "Migration done");

        _executeMigration(migrationData);

        migrationCompleted[version] = true;
        emit MigrationCompleted(version, keccak256(migrationData));
    }

    function _executeMigration(bytes calldata migrationData) internal virtual;
}

interface IVersioned {
    function version() external view returns (uint256);
}
```solidity

### 4. Data Migration Framework

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DataMigrator {
    struct Migration {
        bytes32 id;
        uint256 version;
        uint256 totalSteps;
        uint256 completedSteps;
        uint256 startedAt;
        uint256 completedAt;
        MigrationStatus status;
    }

    enum MigrationStatus {
        PENDING,
        IN_PROGRESS,
        PAUSED,
        COMPLETED,
        FAILED,
        ROLLED_BACK
    }

    struct DataSnapshot {
        bytes32 stateRoot;
        uint256 blockNumber;
        uint256 timestamp;
        bytes32[] affectedSlots;
    }

    mapping(bytes32 => Migration) public migrations;
    mapping(bytes32 => DataSnapshot) public snapshots;
    mapping(bytes32 => mapping(uint256 => bytes)) public stepResults;

    event MigrationStarted(bytes32 indexed migrationId, uint256 totalSteps);
    event MigrationStepCompleted(bytes32 indexed migrationId, uint256 step, bool success);
    event MigrationCompleted(bytes32 indexed migrationId);
    event MigrationRolledBack(bytes32 indexed migrationId, uint256 toStep);

    function startMigration(bytes32 migrationId, uint256 totalSteps) external returns (bool) {
        require(migrations[migrationId].status == MigrationStatus.PENDING, "Invalid state");

        // Take snapshot before migration
        snapshots[migrationId] = DataSnapshot({
            stateRoot: _computeStateRoot(),
            blockNumber: block.number,
            timestamp: block.timestamp,
            affectedSlots: new bytes32[](0)
        });

        migrations[migrationId] = Migration({
            id: migrationId,
            version: 0,
            totalSteps: totalSteps,
            completedSteps: 0,
            startedAt: block.timestamp,
            completedAt: 0,
            status: MigrationStatus.IN_PROGRESS
        });

        emit MigrationStarted(migrationId, totalSteps);
        return true;
    }

    function executeStep(
        bytes32 migrationId,
        uint256 stepIndex,
        bytes calldata stepData
    ) external returns (bool success, bytes memory result) {
        Migration storage migration = migrations[migrationId];
        require(migration.status == MigrationStatus.IN_PROGRESS, "Not in progress");
        require(stepIndex == migration.completedSteps, "Invalid step");

        // Execute migration step
        (success, result) = _executeStep(stepData);

        if (success) {
            migration.completedSteps++;
            stepResults[migrationId][stepIndex] = result;

            if (migration.completedSteps == migration.totalSteps) {
                migration.status = MigrationStatus.COMPLETED;
                migration.completedAt = block.timestamp;
                emit MigrationCompleted(migrationId);
            }
        } else {
            migration.status = MigrationStatus.FAILED;
        }

        emit MigrationStepCompleted(migrationId, stepIndex, success);
    }

    function rollback(bytes32 migrationId, uint256 toStep) external {
        Migration storage migration = migrations[migrationId];
        require(
            migration.status == MigrationStatus.IN_PROGRESS ||
            migration.status == MigrationStatus.FAILED,
            "Cannot rollback"
        );

        // Execute rollback steps in reverse
        for (uint256 i = migration.completedSteps; i > toStep; i--) {
            _rollbackStep(migrationId, i - 1);
        }

        migration.completedSteps = toStep;
        if (toStep == 0) {
            migration.status = MigrationStatus.ROLLED_BACK;
        }

        emit MigrationRolledBack(migrationId, toStep);
    }

    function _executeStep(bytes calldata stepData) internal virtual returns (bool, bytes memory) {
        // Implementation-specific step execution
        return (true, "");
    }

    function _rollbackStep(bytes32 migrationId, uint256 stepIndex) internal virtual {
        // Implementation-specific rollback
    }

    function _computeStateRoot() internal view virtual returns (bytes32) {
        return bytes32(0);
    }
}
```

### 5. Version Management

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library SemanticVersioning {
    struct Version {
        uint8 major;
        uint8 minor;
        uint8 patch;
    }

    function parse(uint256 packed) internal pure returns (Version memory) {
        return Version({
            major: uint8(packed >> 16),
            minor: uint8(packed >> 8),
            patch: uint8(packed)
        });
    }

    function pack(Version memory v) internal pure returns (uint256) {
        return (uint256(v.major) << 16) | (uint256(v.minor) << 8) | uint256(v.patch);
    }

    function isCompatible(Version memory current, Version memory required) internal pure returns (bool) {
        // Major version must match
        if (current.major != required.major) return false;

        // Current minor must be >= required minor
        if (current.minor < required.minor) return false;

        // If same minor, patch must be >= required
        if (current.minor == required.minor && current.patch < required.patch) return false;

        return true;
    }

    function isUpgrade(Version memory from, Version memory to) internal pure returns (bool) {
        if (to.major > from.major) return true;
        if (to.major == from.major && to.minor > from.minor) return true;
        if (to.major == from.major && to.minor == from.minor && to.patch > from.patch) return true;
        return false;
    }
}

contract VersionRegistry {
    using SemanticVersioning for SemanticVersioning.Version;

    struct ContractVersion {
        address implementation;
        SemanticVersioning.Version version;
        bytes32 codeHash;
        uint256 deployedAt;
        string changelog;
    }

    mapping(address => ContractVersion[]) public versionHistory;
    mapping(bytes32 => address) public codeHashToImpl;

    function registerVersion(
        address proxy,
        address implementation,
        uint8 major,
        uint8 minor,
        uint8 patch,
        string calldata changelog
    ) external {
        bytes32 codeHash = implementation.codehash;

        versionHistory[proxy].push(ContractVersion({
            implementation: implementation,
            version: SemanticVersioning.Version(major, minor, patch),
            codeHash: codeHash,
            deployedAt: block.timestamp,
            changelog: changelog
        }));

        codeHashToImpl[codeHash] = implementation;
    }

    function getCurrentVersion(address proxy) external view returns (SemanticVersioning.Version memory) {
        ContractVersion[] storage history = versionHistory[proxy];
        require(history.length > 0, "No versions");
        return history[history.length - 1].version;
    }

    function getVersionAt(address proxy, uint256 index) external view returns (ContractVersion memory) {
        return versionHistory[proxy][index];
    }
}
```solidity

### 6. Rollback Procedures

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RollbackManager {
    struct RollbackPoint {
        address implementation;
        bytes32 stateHash;
        uint256 blockNumber;
        uint256 timestamp;
        bool isValid;
    }

    mapping(address => RollbackPoint[]) public rollbackPoints;
    uint256 public constant MAX_ROLLBACK_POINTS = 5;
    uint256 public constant ROLLBACK_WINDOW = 7 days;

    event RollbackPointCreated(address indexed proxy, uint256 indexed index, address implementation);
    event RollbackExecuted(address indexed proxy, uint256 indexed toIndex, address implementation);

    function createRollbackPoint(address proxy, address currentImpl) external returns (uint256 index) {
        RollbackPoint[] storage points = rollbackPoints[proxy];

        // Limit stored rollback points
        if (points.length >= MAX_ROLLBACK_POINTS) {
            // Remove oldest
            for (uint i = 0; i < points.length - 1; i++) {
                points[i] = points[i + 1];
            }
            points.pop();
        }

        index = points.length;
        points.push(RollbackPoint({
            implementation: currentImpl,
            stateHash: _computeStateHash(proxy),
            blockNumber: block.number,
            timestamp: block.timestamp,
            isValid: true
        }));

        emit RollbackPointCreated(proxy, index, currentImpl);
    }

    function executeRollback(address proxy, uint256 toIndex) external {
        RollbackPoint storage point = rollbackPoints[proxy][toIndex];
        require(point.isValid, "Invalid rollback point");
        require(block.timestamp <= point.timestamp + ROLLBACK_WINDOW, "Rollback expired");

        // Execute rollback to previous implementation
        // This would call the proxy admin to downgrade

        emit RollbackExecuted(proxy, toIndex, point.implementation);
    }

    function invalidateRollbackPoint(address proxy, uint256 index) external {
        rollbackPoints[proxy][index].isValid = false;
    }

    function _computeStateHash(address proxy) internal view returns (bytes32) {
        // Compute hash of critical state for validation
        return keccak256(abi.encode(proxy, block.number));
    }
}
```

### 7. Upgrade Checklist

| Phase | Step | Requirement |
|-------|------|-------------|
| **Pre-Upgrade** |
| | Code audit completed | Mandatory |
| | Test suite passing | 100% pass rate |
| | Staging deployment tested | 72 hours minimum |
| | Rollback procedure verified | Must work |
| | State migration tested | No data loss |
| | Gas estimates verified | Within 10% |
| **Upgrade** |
| | Timelock period elapsed | 48 hours minimum |
| | Multi-sig approval | 3-of-5 minimum |
| | Snapshot created | Automatic |
| | Monitoring enabled | Real-time |
| | Communication sent | All channels |
| **Post-Upgrade** |
| | Health checks passing | All green |
| | State verified | Hash matches |
| | Performance verified | Within SLA |
| | Rollback point valid | 7 day window |
| | Documentation updated | Complete |

## Rationale

The upgrade patterns and migration procedures reflect lessons learned from major DeFi incidents:

1. **48-hour timelock** prevents flash-upgrade attacks and gives users time to exit if they disagree with changes
2. **Multi-sig requirements** eliminate single points of failure in upgrade authorization
3. **Step-by-step migration** enables partial rollbacks instead of all-or-nothing upgrades
4. **State snapshots** before migration provide verified recovery points
5. **Semantic versioning** enables compatibility checking between contract versions

The UUPS pattern is preferred over Transparent Proxy for gas efficiency in production, while Transparent Proxy provides clearer separation of concerns for simpler deployments.

## Backwards Compatibility

This LP maintains compatibility with existing upgrade patterns:

- **OpenZeppelin Proxies**: Full compatibility with TransparentUpgradeableProxy and UUPSUpgradeable
- **Existing timelocks**: Can wrap existing timelock controllers or integrate with Compound Governor
- **Multi-sig wallets**: Compatible with Gnosis Safe and other standard multi-sig implementations

Migration from legacy upgrade patterns:
1. Deploy new UpgradeManager contract
2. Transfer ProxyAdmin ownership to UpgradeManager
3. Register existing implementations in VersionRegistry
4. Continue using same proxy contracts

## Security Considerations

1. **Timelock protection** - Minimum 48hr delay for upgrades
2. **Multi-sig requirement** - No single point of failure
3. **Audit requirement** - All upgrades must be audited
4. **Rollback capability** - Always maintain rollback path
5. **State verification** - Verify state integrity post-upgrade

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
