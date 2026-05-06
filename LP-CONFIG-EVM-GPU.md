---
lp: CONFIG-EVM-GPU
title: Configuring the EVM Engine and GPU Acceleration
author: Lux Core Team <dev@lux.network>
status: Active
type: Informational
category: User Guide
created: 2026-04-28
updated: 2026-04-28
references:
  - LP-009 (GPU-Native EVM)
  - LP-014 (Multi-EVM)
  - LP-137 (GPU-Native Crypto Stack)
---

# Configuring the EVM Engine and GPU Acceleration

This is a user-facing guide. It documents the actual flags exposed by `luxd`
(the node binary in `~/work/lux/node`) and the `lux` CLI (in
`~/work/lux/cli`). For internal architecture see LP-137.

## TL;DR

| What | How |
|---|---|
| Pick the C-Chain EVM engine on a chain you deploy | `lux evm deploy --backend=<gevm\|cevm\|revm\|auto>` |
| Force a GPU backend at the node level | `luxd --gpu-backend=<auto\|metal\|cuda\|cpu>` |
| Disable GPU completely | `luxd --gpu-enabled=false` |
| Inspect what is currently active | `lux gpu status [--json]` |

Defaults are sensible. If you set nothing, the node enables GPU acceleration
and auto-detects: Metal on macOS, CUDA on Linux, CPU elsewhere.

## Configuration Surface

There are two independent dials:

1. **EVM engine** — which EVM implementation runs on a chain you deploy
   through the CLI. This is a build-time selection that produces the chain's
   VM plugin binary.
2. **GPU backend** — runtime acceleration for cryptographic primitives
   (NTT for Pulsar consensus, FHE for ThresholdVM, lattice ops). This is
   a node-level setting consumed by every chain on that node.

Both dials are orthogonal. You can run a `gevm` chain with GPU enabled; you
can run a `cevm` chain with GPU disabled.

## Dial 1: EVM Engine (CLI build-time)

The CLI's `lux evm deploy` command selects which EVM implementation gets
linked into the chain's plugin.

### Flags

```text
lux evm deploy --backend=<value> [--gpu]
```

| Flag | Values | Default | Effect |
|---|---|---|---|
| `--backend` | `gevm`, `cevm`, `revm`, `auto` | `gevm` | Picks EVM implementation |
| `--gpu` | bool | `false` | Adds `gpu` build tag for the plugin build |

Source: `~/work/lux/cli/cmd/evm.go`.

### Backend semantics

| Backend | Implementation | Build tag | Notes |
|---|---|---|---|
| `gevm` | Go geth/coreth (sequential) | none | Production default. Always available. |
| `cevm` | C++ evmone, native GPU support | `cevm` | Metal/CUDA/WGSL kernels per LP-009 |
| `revm` | Rust reth/revm | `revm` | Sequential, fast on amd64 |
| `auto` | All linked, runtime selection | `revm,cevm` | Largest binary; choose at runtime |

The `--gpu` flag is independent of `--backend`. It adds the `gpu` build tag,
which links GPU-accelerated paths into whichever backend you chose.

### VM type taxonomy

The CLI's internal `VMType` (in `~/work/lux/cli/pkg/models/vm.go`) maps to
backends as follows:

| VMType | String | Backend | GPU-capable |
|---|---|---|---|
| `EVM` | `EVM` | gevm | no |
| `EVMGPU` | `EVM-GPU`, `evmgpu`, `gpu` | gevm + Block-STM + GPU | yes |
| `CEVM` | `CEVM`, `cevm`, `cpp` | cevm | yes |
| `REVM` | `REVM`, `revm`, `rust` | revm | no |

`IsGPUCapable()` returns true only for `EVMGPU` and `CEVM`.

## Dial 2: GPU Backend (node runtime)

The node binary `luxd` exposes four flags that configure GPU acceleration
globally for the node. These apply uniformly across consensus, FHE, and any
GPU-capable VM running on the node.

### Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--gpu-enabled` | bool | `true` | Master switch. `false` forces CPU fallback. |
| `--gpu-backend` | string | `auto` | One of `auto`, `metal`, `cuda`, `cpu` |
| `--gpu-device` | int | `0` | Device index for multi-GPU systems |
| `--gpu-log-level` | string | `warn` | One of `debug`, `info`, `warn`, `error` |

Source: `~/work/lux/node/config/flags.go`, validated by
`~/work/lux/node/config/gpu.go`.

### `auto` resolution

When `--gpu-backend=auto` (default), the resolver picks per platform:

| `runtime.GOOS` | Resolved backend |
|---|---|
| `darwin` | `metal` |
| `linux` | `cuda` |
| anything else | `cpu` |

If `--gpu-enabled=false`, the resolver returns `cpu` regardless.

### Validation

The node rejects invalid combinations at startup:

| Combination | Result |
|---|---|
| `--gpu-backend=metal` on Linux | error: "metal backend is only supported on macOS" |
| `--gpu-backend=cuda` on macOS | error: "cuda backend is not supported on macOS" |
| `--gpu-device < 0` | error: "GPU device index must be non-negative" |
| invalid backend or log level | error with allowed values |

### CGO requirement

GPU backends (Metal, CUDA) are only effective when the binary was built with
`CGO_ENABLED=1`. A CGO-disabled build silently falls back to CPU, even if
you pass `--gpu-backend=metal`. Verify with:

```bash
lux gpu status
```

The output line `CGO Enabled: true` confirms GPU paths are linked.

## Resolution Precedence

Both `luxd` and `lux` use Viper-style config resolution. Precedence, highest
first:

1. CLI flag (`--gpu-backend=metal`)
2. Environment variable (`LUXD_GPU_BACKEND=metal`)
3. Config file value (when `--config-file` or `--config-content` is set)
4. Compiled-in default (`auto`, `true`, `0`, `warn`)

### Environment variable naming

The node's env prefix is `LUXD_`. Dashes become underscores and the name is
upper-cased.

| Flag | Environment variable |
|---|---|
| `--gpu-enabled` | `LUXD_GPU_ENABLED` |
| `--gpu-backend` | `LUXD_GPU_BACKEND` |
| `--gpu-device` | `LUXD_GPU_DEVICE` |
| `--gpu-log-level` | `LUXD_GPU_LOG_LEVEL` |

Source: `~/work/lux/node/config/viper.go` (`EnvPrefix = "luxd"`).

## Per-Platform Default

| Platform | `--gpu-enabled` | `--gpu-backend` resolves to | Effective with CGO |
|---|---|---|---|
| darwin/arm64 (Apple Silicon) | true | `metal` | yes |
| darwin/amd64 | true | `metal` | partial (Metal available; M-series recommended) |
| linux/amd64 + NVIDIA | true | `cuda` | yes (requires CUDA toolkit) |
| linux/amd64 (no GPU) | true | `cuda` | falls back to CPU at runtime |
| linux/arm64 | true | `cuda` | falls back to CPU at runtime |
| windows, freebsd, etc. | true | `cpu` | n/a |

## Compatibility Matrix: Engine x GPU Backend

| EVM backend | metal | cuda | cpu | wgsl |
|---|---|---|---|---|
| `gevm` | n/a (Go-only paths) | n/a | always | n/a |
| `cevm` | yes | yes | yes | yes (per LP-009) |
| `revm` | n/a | n/a | always | n/a |
| `auto` | yes via cevm | yes via cevm | yes | yes via cevm |

`gevm` and `revm` are CPU-only EVMs. They run on a node with GPU enabled,
but their hot paths do not call GPU kernels. Consensus and FHE elsewhere on
the node still benefit from GPU.

## Compatibility Matrix: Crypto Primitive x GPU Backend

Per LP-137 the node ships first-party CPU canonical and Metal/CUDA/WGSL
kernels for every primitive. Availability per node build:

| Primitive | CPU | Metal | CUDA | WGSL |
|---|---|---|---|---|
| BLS12-381 (consensus) | yes | yes | yes | yes |
| Pulsar NTT (consensus) | yes | yes | yes | yes |
| ML-DSA-65 (consensus) | yes | yes | yes | yes |
| FHE (ThresholdVM) | yes | yes | yes | yes |
| KZG (data availability) | yes | yes | yes | yes |
| Pedersen | yes | yes | yes | yes |

WGSL is selected only when the binary was built against a WebGPU runtime;
this is currently a build-time choice, not a runtime flag.

## Examples

### macOS dev box, default everything

```bash
luxd
```

Resolves to `gpu-enabled=true`, `gpu-backend=metal`. Confirms with:

```bash
lux gpu status
# GPU Status:
#   Available:    Yes
#   Backend:      Metal
```

### Linux validator, force CPU (e.g. headless server, no NVIDIA driver)

```bash
luxd --gpu-enabled=false
# or
LUXD_GPU_ENABLED=false luxd
```

### Multi-GPU box, pick device 1

```bash
luxd --gpu-backend=cuda --gpu-device=1
```

### Deploy a C++ EVM L2 with GPU

```bash
lux evm deploy --backend=cevm --gpu --network-id=2
```

This runs the build with `-tags cevm,gpu` and copies the resulting plugin
into `~/.lux/evm/plugins/`.

### Inspect current node configuration

```bash
lux gpu status --json
```

Returns:

```json
{
  "available": true,
  "backend": "Metal",
  "platform": "darwin",
  "architecture": "arm64",
  "cgo_enabled": true,
  "features": {
    "ntt_acceleration": true,
    "fhe_acceleration": true
  },
  "default_config": {
    "enabled": true,
    "backend": "auto",
    "device_index": 0,
    "log_level": "warn"
  }
}
```

## Troubleshooting

### `lux gpu status` says `CGO Enabled: false`

The binary was built without CGO. GPU flags are accepted but inert. Rebuild:

```bash
cd ~/work/lux/node && CGO_ENABLED=1 go build -o /tmp/luxd ./main
```

### Startup error: "metal backend is only supported on macOS"

You set `LUXD_GPU_BACKEND=metal` in the environment and the node is running
on Linux. Unset it or set `--gpu-backend=auto`.

### Startup error: "invalid GPU configuration"

The validator rejected your settings. Check the rejection reason in stderr;
see the validation table above. Backend values must be exactly `auto`,
`metal`, `cuda`, or `cpu`.

### CUDA backend silently falls back to CPU on Linux

The node was built with `CGO_ENABLED=1` but the host has no CUDA toolkit
(`libcudart.so` missing) or no NVIDIA driver. Install the CUDA runtime, or
explicitly set `--gpu-backend=cpu` so logs reflect intent.

### Plugin built with `--backend=cevm` fails to load

The plugin binary requires CGO and the C++ evmone shared library. Build
host and run host must match. Cross-architecture deploys must build per
target architecture.

### Environment variable from another tool clashes

Some unrelated tools also use `LUX_*`. The node only consults `LUXD_*`. If
in doubt, prefer explicit CLI flags.

## Source Files Audited

- `~/work/lux/node/config/flags.go` — flag registration
- `~/work/lux/node/config/keys.go` — flag key constants
- `~/work/lux/node/config/gpu.go` — config struct, validation, auto-resolve
- `~/work/lux/node/config/config.go` — wire-up into node config
- `~/work/lux/node/config/viper.go` — env prefix, precedence
- `~/work/lux/node/main/main.go` — entry point, flag parsing
- `~/work/lux/cli/cmd/evm.go` — `lux evm deploy` flags
- `~/work/lux/cli/cmd/gpucmd/gpu.go` — `lux gpu` command
- `~/work/lux/cli/cmd/gpucmd/status.go` — `lux gpu status`
- `~/work/lux/cli/cmd/gpucmd/cgo_enabled.go` — CGO build tag detection
- `~/work/lux/cli/cmd/gpucmd/cgo_disabled.go` — CGO-off fallback
- `~/work/lux/cli/pkg/models/vm.go` — VM type and EVMBackend taxonomy

## See Also

- LP-009 — GPU-Native EVM (architecture and kernel design)
- LP-014 — Multi-EVM (gevm, cevm, revm coexistence)
- LP-137 — GPU-Native Crypto Stack (primitive coverage and kernel matrix)
