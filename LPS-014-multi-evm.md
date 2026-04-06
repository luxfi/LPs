---
lps: 014
title: Multi-EVM Pluggable Architecture
tags: [evm, cevm, evmgpu, revm, plugin, zap]
description: Interchangeable EVM implementations as Lux subnet VM plugins
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Architecture
created: 2025-12-01
updated: 2026-04-06
requires:
  - lps-009 (GPU-Native EVM)
  - lps-010 (Block-STM)
---

# LPS-014: Multi-EVM Pluggable Architecture

## Abstract

Lux Network supports 4 interchangeable EVM implementations, all producing identical state roots for identical inputs. Validators can hot-swap the C-Chain EVM via `switch-evm.sh`.

## Implementations

| Name | Language | Throughput (EVM) | GPU | Plugin |
|------|----------|-----------------|-----|--------|
| evm | Go (geth) | 4.2 Ggas/s | No | ✅ |
| evmgpu | Go (Block-STM) | 4.2 Ggas/s + GPU | Yes | ✅ |
| revm | Rust (reth) | TBD | No | Via ZAP |
| cevm | C++ (evmone) | 19.8 Ggas/s + GPU | Yes | Via ZAP |

## ZAP VM Protocol

All implementations communicate with luxd via the ZAP binary wire protocol:
- TCP with 4-byte length-prefix framing
- 17 message types (Initialize, BuildBlock, ParseBlock, BlockVerify, etc.)
- Protocol version 42
