---
lp: 8
title: Plugin Architecture
tags: [vm, core, dev-tools]
description: Plugin architecture for Lux nodes via LPM (Lux Plugin Manager) and VM plugins
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: Core
created: 2025-01-23
order: 8
---

## Abstract

This LP describes the Plugin Architecture for Lux nodes, centered around the **Lux Plugin Manager (LPM)** for managing Virtual Machine (VM) plugins. The architecture enables extending Lux node functionality via custom VMs without forking or altering core code.

## Motivation

Lux Network supports multiple purpose-built blockchains, each running a specialized Virtual Machine (VM). The plugin architecture enables:

1. **Custom VMs**: Deploy application-specific VMs (DEX, privacy, AI, etc.)
2. **Independent Development**: VMs can be developed, tested, and deployed independently
3. **Ecosystem Growth**: Third-party developers can contribute VMs to the ecosystem
4. **Version Management**: Clean separation between node versions and VM versions

## Specification

### Plugin Directory Structure

```
~/.lux/
├── plugins/
│   └── current/                    # Active VM plugins (symlinked)
│       ├── srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy  # EVM Plugin (VMID)
│       └── <other-vm-id>           # Other VM plugins
├── staking/
│   └── signer.key
└── configs/
    └── chains/
        └── C/
            └── config.json
```

**Default Plugin Path**: `~/.lux/plugins/current/`

The `--plugin-dir` flag can override this location:
```bash
luxd --plugin-dir=/custom/path/to/plugins
```

### Lux Plugin Manager (LPM)

**Repository**: [`github.com/luxfi/lpm`](https://github.com/luxfi/lpm)

LPM is the command-line tool for managing VM plugins:

```bash
# Install LPM
curl -sSfL https://raw.githubusercontent.com/luxfi/lpm/master/scripts/install.sh | sh -s

# Add the core plugin repository
lpm add-repository --alias luxfi/core --url https://github.com/luxfi/plugins-core.git --branch master

# Install a VM plugin
lpm install-vm --vm evm

# Join a subnet (installs required VMs)
lpm join-subnet --subnet mysubnet

# List available VMs
lpm list-repositories

# Update plugin definitions
lpm update

# Upgrade installed plugins
lpm upgrade
```

### VM Plugin Definition

VMs are defined in YAML format in plugin repositories:

```yaml
# vm.yaml
id: "srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy"
alias: "evm"
homepage: "https://github.com/luxfi/evm"
description: "Lux EVM - Ethereum Virtual Machine implementation"
maintainers:
  - "Lux Core Team"
installScript: "scripts/build.sh"
binaryPath: "build/evm"
url: "https://github.com/luxfi/evm/releases/download/v0.14.0/evm-linux-amd64"
sha256: "abc123..."
```

### Standard EVM Plugin

**Repository**: [`github.com/luxfi/evm`](https://github.com/luxfi/evm)

The EVM plugin is the reference implementation for Lux VM plugins:

```
~/work/lux/evm/
├── plugin/
│   ├── evm/           # Core EVM implementation
│   │   ├── vm.go      # VM interface implementation
│   │   ├── block.go   # Block handling
│   │   ├── config.go  # VM configuration
│   │   └── factory.go # VM factory
│   ├── runner/        # Plugin runner
│   └── main.go        # Plugin entry point
├── precompile/        # Stateful precompiles
│   ├── contracts/     # Built-in precompile contracts
│   ├── modules/       # Precompile module system
│   └── registry/      # Precompile registry
├── core/              # Ethereum core (forked from go-ethereum)
├── params/            # Chain parameters
└── warp/              # Warp messaging support
```

**VM ID**: `srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy`

### VM Interface

All VM plugins must implement the ChainVM interface:

```go
// ChainVM defines the interface for a blockchain virtual machine
type ChainVM interface {
    // Initialize is called when the VM is created
    Initialize(
        ctx context.Context,
        chainCtx *snow.Context,
        db database.Database,
        genesisBytes []byte,
        upgradeBytes []byte,
        configBytes []byte,
        toEngine chan<- common.Message,
        fxs []*common.Fx,
        appSender common.AppSender,
    ) error

    // Shutdown is called when the VM is being stopped
    Shutdown(context.Context) error

    // CreateBlock attempts to create a new block
    BuildBlock(context.Context) (snowman.Block, error)

    // ParseBlock parses a block from bytes
    ParseBlock(context.Context, []byte) (snowman.Block, error)

    // GetBlock returns the block with the given ID
    GetBlock(context.Context, ids.ID) (snowman.Block, error)

    // SetPreference sets the preferred block
    SetPreference(context.Context, ids.ID) error

    // LastAccepted returns the ID of the last accepted block
    LastAccepted(context.Context) (ids.ID, error)
}
```

### Plugin Loading

The node discovers and loads plugins at startup:

1. **Discovery**: Scan `~/.lux/plugins/current/` for VM binaries
2. **Identification**: Parse VM ID from filename (base58 encoded)
3. **Validation**: Verify binary is executable and compatible
4. **Registration**: Register VM factory with the VM manager
5. **Initialization**: Initialize VM when chain is created

```go
// From github.com/luxfi/node/vms/registry/vm_getter.go
type VMGetterConfig struct {
    FileReader      filesystem.Reader
    Manager         vms.Manager
    PluginDirectory string  // ~/.lux/plugins/current/
    CPUTracker      resource.ProcessTracker
    RuntimeTracker  runtime.Tracker
}
```

### Plugin Repository System

**Core Repository**: [`github.com/luxfi/plugins-core`](https://github.com/luxfi/plugins-core)

Repository structure:
```
plugins-core/
├── vms/
│   ├── evm/
│   │   └── vm.yaml
│   ├── timestampvm/
│   │   └── vm.yaml
│   └── ...
├── subnets/
│   ├── c-chain/
│   │   └── subnet.yaml
│   └── ...
└── README.md
```

### Subnet Definition

Subnets define which VMs are required:

```yaml
# subnet.yaml
id: "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed"
alias: "c-chain"
homepage: "https://lux.network"
description: "C-Chain - EVM compatible chain"
maintainers:
  - "Lux Core Team"
vms:
  - evm
```

## Test Cases

### Unit Tests

1. **Plugin Discovery**
   - Verify plugins discovered from correct directory
   - Test handling of invalid/corrupt binaries
   - Validate VM ID parsing from filenames

2. **LPM Commands**
   - Test `install-vm` correctly downloads and places binaries
   - Test `add-repository` correctly tracks remote repos
   - Test `upgrade` correctly updates installed plugins

3. **VM Loading**
   - Verify VM initialization with valid config
   - Test error handling for missing dependencies
   - Validate version compatibility checks

### Integration Tests

1. **End-to-End Plugin Installation**
   - Install VM via LPM
   - Start node with new VM
   - Verify chain creation succeeds

2. **Custom VM Development**
   - Build custom VM from template
   - Install via local repository
   - Deploy and test on local network

## Backwards Compatibility

This LP is additive; existing behavior remains unchanged. The default EVM plugin ships with the node binary for C-Chain compatibility.

## Security Considerations

1. **Binary Verification**: SHA256 checksums verify plugin integrity
2. **Signature Verification**: Optional GPG signing for plugin binaries
3. **Sandboxing**: Plugins run in separate processes via gRPC
4. **Resource Limits**: CPU and memory tracking per plugin
5. **Permission Model**: Plugins can only access declared capabilities

## References

- [LPM Repository](https://github.com/luxfi/lpm) - Plugin manager tool
- [EVM Plugin](https://github.com/luxfi/evm) - Reference EVM implementation
- [Node Repository](https://github.com/luxfi/node) - Core node with plugin loader
- [Plugins Core](https://github.com/luxfi/plugins-core) - Community plugin definitions
