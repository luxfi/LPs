---
lp: 9
title: CLI Tool Specification
description: Defines the official Command-Line Interface (CLI) tools for Lux.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Interface
created: 2025-01-23
---

## Abstract

This LP defines the official Command-Line Interface (CLI) tools for Lux (for the cli repo). This LP enumerates the standard commands, options, and JSON outputs for the lux-cli (and related tools), ensuring a uniform experience for users and scripts.

## Specification

*(This LP will include sections for each major command group: managing keys and wallets, issuing transactions on various chains, node administration, network deployment (interfacing with LP-6’s testnet framework), etc.)*

## Rationale

By standardizing the CLI, all users from developers to validators have a clear reference on interacting with Lux, and it aids in writing documentation and tutorials consistent with the tool’s behavior.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
## Backwards Compatibility

Additive proposal; does not break existing modules. Adoption can be phased in.

## Security Considerations

Follow recommended validation and cryptographic practices; consider rate‑limiting and replay protections where relevant.

## Motivation

A unified approach here reduces fragmentation and improves developer ergonomics and compatibility across Lux networks and tools.
