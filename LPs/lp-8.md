---
lp: 8
title: Plugin Architecture
description: Describes a Plugin Architecture for Lux nodes.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-01-23
---

## Abstract

This LP describes a Plugin Architecture for Lux nodes (for the lpm repo, possibly Lux Plugin Manager). This LP sets the standard for extending Lux node functionality via plugins or modules, without needing to fork or alter core code.

## Specification

*(This LP will specify how plugins are structured, how they are installed/loaded by a node, and what APIs they can access.)*

## Rationale

This standard encourages a rich ecosystem of node add-ons (think monitoring dashboards, alternative mempool analyzers, etc.) that can be developed independently.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
## Backwards Compatibility

This LP is additive; existing behavior remains unchanged. Migration can be performed progressively.

## Security Considerations

Implement input checks, authentication as needed, and standard defenses against replay/DoS.

## Implementation

### Plugin Architecture

**Location**: `~/work/lux/node/`
**GitHub**: [`github.com/luxfi/node/tree/main`](https://github.com/luxfi/node/tree/main)

**Core Plugin Components**:
- [`config/`](https://github.com/luxfi/node/tree/main/config) - Plugin configuration and loading (3 files)
  - Plugin discovery and activation flags
  - Configuration merging and override support
- [`node/`](https://github.com/luxfi/node/tree/main/node) - Node initialization and lifecycle
  - Plugin registration hooks
  - Plugin API exposure

**Plugin System Features**:
- **Hot Loading**: Plugins discovered at node startup from configured directories
- **Capability Model**: Plugins declare required permissions and capabilities
- **API Access**: Exposed RPC endpoints for plugin functionality
- **Configuration**: TOML/JSON-based plugin configuration with validation
- **Isolation**: Each plugin runs in isolated scope with restricted API surface

**Standard Plugin Interfaces**:
```go
type Plugin interface {
    Initialize(config PluginConfig) error
    GetRPCEndpoints() map[string]interface{}
    Shutdown(ctx context.Context) error
    OnBlockAccepted(blockID ids.ID) error
    OnConsensusStateUpdate() error
}
```

**Plugin Capabilities**:
- Block observation hooks
- Custom RPC endpoint registration
- State query access
- Event subscriptions
- Metrics collection and reporting

### Example Plugins

**Location**: `~/work/lux/node/plugins/examples/`

**Built-in Plugins**:
1. **Metrics Exporter**: Prometheus metrics aggregation
2. **Event Logger**: Structured logging of chain events
3. **Health Monitor**: Node and consensus health tracking
4. **RPC Extended**: Additional JSON-RPC endpoints

### Plugin Configuration

**Configuration File**: `~/.luxd/plugins.toml`

```toml
[[plugins]]
name = "prometheus-exporter"
enabled = true
path = "/path/to/plugin.so"

[plugins.config]
listen_addr = "0.0.0.0:8888"
scrape_interval = "15s"
```

### Plugin Discovery

**Plugin Registry**: Automatic discovery from:
- `~/.luxd/plugins/` - User plugins
- `/etc/luxd/plugins/` - System plugins
- Plugin load path specified in config

**Plugin Validation**:
- Version compatibility check
- Signature verification (optional)
- Capability permission validation
- Dependency resolution

## Motivation

Standardizing this area improves developer experience and interoperability across wallets, tooling, and chains within Lux.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
