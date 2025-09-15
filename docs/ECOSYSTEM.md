# Lux Ecosystem Index

This index summarizes local Lux repositories, grouped by domain. Set LUX_BASE to change the scan path (default: ~/work/lux).

Tip: Keep each repo README current with purpose, quickstart, and links to API/ADR/docs.

## Core Protocol

| Repo | Title | Language | Summary |
|:-----|:------|:---------|:--------|
| `consensus` | Lux Consensus | Go | [![CI Status](https://github.com/luxfi/consensus/actions/workflows/ci.yml/badge.svg)](https://github.com/luxfi/consensus/actions) [![Coverage](https://img.shields.io/badge/coverage-96%25-brightgreen)](https://github.c... |
| `coreth` | coreth | Go | Golang execution layer implementation of the Ethereum protocol. |
| `crypto` | Lux Crypto Package | Go | [![Go Reference](https://pkg.go.dev/badge/github.com/luxfi/crypto.svg)](https://pkg.go.dev/github.com/luxfi/crypto) [![Go Report Card](https://goreportcard.com/badge/github.com/luxfi/crypto)](https://goreportcard.com/... |
| `database` | database | Go |  |
| `evm` | Subnet EVM | Go | [![Releases](https://img.shields.io/github/v/tag/luxfi/evm.svg?sort=semver)](https://github.com/luxfi/evm/releases) [![CI](https://github.com/luxfi/evm/actions/workflows/ci.yml/badge.svg)](https://github.com/luxfi/evm... |
| `standard` | Lux Standard | TypeScript/JS | The official standard smart contracts library for the Lux Network ecosystem. |
| `state` | Lux State Database Documentation | Go | This directory contains blockchain state data for various networks. The primary database is SubnetEVM format stored in PebbleDB, which can be migrated to Coreth format for use with the Lux node. |
| `threshold` | Threshold Signatures - Universal Multi-Chain Implementation | Go | [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) [![Go Version](https://img.shields.io/badge/Go-1.24.5-blue.svg)](https://go.dev) [![Status](https://... |

## Interoperability

| Repo | Title | Language | Summary |
|:-----|:------|:---------|:--------|
| `bridge` | Lux Bridge | TypeScript/JS | Bridge monorepo for Lux Network - a decentralized cross-chain bridge using Multi-Party Computation (MPC) for secure asset transfers. |
| `bridge-new` | bridge | TypeScript/JS | Bridge monorepo for Lux Network. |
| `warp` | Lux Warp V2 Message Format | Go | An enhanced cross-chain messaging (XCM) format with post-quantum safety and private messaging capabilities. |

## VM & Plugins

| Repo | Title | Language | Summary |
|:-----|:------|:---------|:--------|
| `plugins-core` | plugins-core | Mixed | `plugins-core` is plugin repository that ships with the [Lux Plugin Manager](https://github.com/luxfi/lpm). A plugin repository consists of a set of virtual machine and subnet definitions that the `LPM` consumes to al... |
| `vmsdk` | vmsdk | Go | <h1>vmsdk</h1> <p align="center"> Framework for Building Hyper-Scalable Blockchains on Lux </p> <p align="center"> <a href="https://goreportcard.com/report/github.com/luxfi/vmsdk"><img src="https://goreportcard.com/ba... |

## Dev Tools & Infra

| Repo | Title | Language | Summary |
|:-----|:------|:---------|:--------|
| `explore` | explore | TypeScript/JS | <h1 align="center">Lux Explore frontend</h1> |
| `explorer` | explorer | TypeScript/JS | <h1 align="center">Blockscout</h1> <p align="center">Blockchain Explorer for inspecting and analyzing EVM Chains.</p> <div align="center"> |
| `faucet` | LUX Subnet Faucet | TypeScript/JS | Right now there are thousands of networks and chains in the blockchain space, each with its capabilities and use-cases. And each network requires native coins to do any transaction on them, which can have a monetary v... |
| `genesis` | LUX Genesis | Go | Migration and validation tools for LUX mainnet. |
| `genesis-new` | Genesis - Lux Blockchain Configuration Tool | Go | [![CI](https://github.com/luxfi/genesis/actions/workflows/ci.yml/badge.svg)](https://github.com/luxfi/genesis/actions/workflows/ci.yml) [![Go Report Card](https://goreportcard.com/badge/github.com/luxfi/genesis)](http... |
| `sdk` | Lux SDK | Go | The official Go SDK for building and managing Lux-compatible networks and blockchains. This SDK provides a unified interface integrating the full Lux ecosystem - netrunner for network orchestration, the CLI for user-f... |

## Wallets

| Repo | Title | Language | Summary |
|:-----|:------|:---------|:--------|
| `safe` | safe | TypeScript/JS | Contracts and Web3 interface. |
| `safe-ios` | safe-multisig-ios | Mixed | Safe Multisig iOS app. |
| `wallet` | wallet | TypeScript/JS | Lux Wallet - Open Source Crypto Wallet |
| `wwallet` | Lux Wallet | TypeScript/JS | This is the web based Lux Wallet for [Lux Network](https://lux.network). |
| `xwallet` | xwallet | TypeScript/JS | Lux Wallet is an open-source browser extension for the defi ecosystem, providing users with a better-to-use and more secure multi-chain experience. |

## Ecosystem Apps

| Repo | Title | Language | Summary |
|:-----|:------|:---------|:--------|
| `dex` | LX DEX | Go | [![CI](https://github.com/luxfi/dex/actions/workflows/ci.yml/badge.svg)](https://github.com/luxfi/dex/actions/workflows/ci.yml) [![Release](https://img.shields.io/github/v/release/luxfi/dex)](https://github.com/luxfi/... |
| `exchange` | Lux Exchange (LX) - HyperLiquid Feature Parity Implementation | TypeScript/JS | ``` lux/ ├── contracts/ # Smart contracts │ └── exchange/ │ ├── OrderBook.sol │ ├── PerpetualMarket.sol │ ├── CrossMargin.sol │ └── ... ├── services/ # Backend services │ ├── matching/ # Order matching engine │ ├── ri... |
| `exchange-sdk` | Hanzo Exchange SDK | TypeScript/JS | This is the Hanzo Exchange SDK, which enables anyone to integrate advanced trading functionality into an application. Includes a spec-compliant order matching engine and WS server for building exchange applications. |
| `tokens` | tokens | Python | This repo contains the bridge, exchange and wallet network and token logos for use by the [Lux Bridge](https://bridge.lux.network), [Lux Exchange](https://lux.exchange) and [Lux Wallet](https://wallet.lux.network). |

## Other

| Repo | Title | Language | Summary |
|:-----|:------|:---------|:--------|
| `ETHDILITHIUM` | ETHDILITHIUM | Python | ETHDILITHIUM gathers experiments around DILITHIUM adaptations for the ETHEREUM ecosystem. DILITHIUM signature scheme is a post-quantum digital signature algorithm. |
| `ETHFALCON` | ETHFALCON | Go | ETHFALCON gather experimentations around FALCON adaptations for the ETHEREUM ecosystem. [Falcon signature scheme](https://falcon-sign.info/) is a post-quantum digital signature algorithm. This repo provides: |
| `NTT` | NTT-EIP as a building block for FALCON, DILITHIUM and Stark verifiers | Python | This repository contains the EIP for NTT transform, along with a python reference code, and a solidity implementation. |
| `adx` | ADX - High-Performance CTV Ad Exchange | Go | [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Go Version](https://img.shields.io/badge/go-1.24.5-blue.svg)](go.mod) |
| `assets` | assets | Go | ![Check](https://github.com/trustwallet/assets/workflows/Check/badge.svg) |
| `ava` | Avalanche Ops | Go | A **single command to launch Avalanche nodes from scratch that joins any network of choice (e.g., test, fuji, main) or create a custom Avalanche network**. Provisions all resources required to run a node or network wi... |
| `bank` | bank | TypeScript/JS | The Lux BaaS Platform is the first full-stack, open-source Banking as a Service (BaaS) platform, designed to revolutionize the financial services industry. Our platform enables seamless integrations and interoperabili... |
| `bft` | BFT consensus for Avalanche | Go | The scientific literature is full of different consensus protocols, and each has its own strengths and weaknesses. |
| `chat` | Lux | TypeScript/JS | An AI-powered search engine with a generative UI. |
| `cli` | Lux CLI | Go | Lux CLI is a command line tool that gives developers access to everything Lux. This release specializes in helping developers develop and test subnets. |
| `community` | Lux Network Community | Mixed | Welcome to the Lux Network Community! This is the central hub for all community-driven initiatives, Special Interest Groups (SIGs), Working Groups (WGs), and governance activities within the Lux ecosystem. |
| `czmq` | czmq - LuxFi Fork [![Go Reference](https://pkg.go.dev/badge/github.com/luxfi/czmq/v4.svg)](https://pkg.go.dev/github.com/luxfi/czmq/v4) | Go | This is the LuxFi fork of the original [zeromq/czmq](https://github.com/zeromq/goczmq) Go bindings, maintained for use in the Lux Network ecosystem. |
| `dilithium-c-temp` | Dilithium | Mixed | [![Build Status](https://travis-ci.org/pq-crystals/dilithium.svg?branch=master)](https://travis-ci.org/pq-crystals/dilithium) [![Coverage Status](https://coveralls.io/repos/github/pq-crystals/dilithium/badge.svg?branc... |
| `docs` | docs | TypeScript/JS | Docs for Lux Network. |
| `dwallet` | before build, we ensure the commit is correct | TypeScript/JS | git fetch --all --prune; git reset --hard origin/feat/for_desktop; |
| `erc20-go` | erc20-go | Go | Golang interacts with erc20 |
| `geth` | geth | Go | Golang execution layer implementation of the Ethereum protocol. |
| `go-bip32` | GO-BIP32 | Go | This repository contains a local copy of the original ``github.com/tyler-smith/go-bip32`` library. |
| `go-bip39` | GO-BIP39 | Go | This repository contains a local copy of the original ``github.com/tyler-smith/go-bip39`` library. |
| `iam` | iam | Go | <h1 align="center" style="border-bottom: none;">📦⚡️ Casdoor</h1> <h3 align="center">An open-source UI-first Identity and Access Management (IAM) / Single-Sign-On (SSO) platform with web UI supporting OAuth 2.0, OIDC, ... |
| `ico` | ico | TypeScript/JS | The Web Interface is being updated... |
| `id` | Lux ID | Go | Lux ID is a modern Identity and Access Management (IAM) system based on Casdoor, customized for the Lux Network ecosystem. It provides comprehensive authentication and authorization services with support for OAuth 2.0... |
| `ids` | Lux IDs Package | Go | [![Go Reference](https://pkg.go.dev/badge/github.com/luxfi/ids.svg)](https://pkg.go.dev/github.com/luxfi/ids) [![Go Report Card](https://goreportcard.com/badge/github.com/luxfi/ids)](https://goreportcard.com/report/gi... |
| `js` | js | TypeScript/JS | <br/> |
| `js-sdk` | Hanzo AI JavaScript SDK | TypeScript/JS | High-performance AI tools for TypeScript including embedding services and LLM inference with support for multiple providers. |
| `kit` | LuxKit | TypeScript/JS | LuxKit offers a true web3 solution to help connect your Dapp with wallets, effectively addressing the issue of conflicting multiple wallet extensions. It supports the most popular connectors and chains out of the box ... |
| `kms` | kms | Go | <h1 align="center"> <img width="300" src="/img/logoname-white.svg#gh-dark-mode-only" alt="kms"> </h1> <p align="center"> <p align="center"><b>The open-source secret management platform</b>: Sync secrets/configs across... |
| `kms-go` | kms-go | Go | <h1 align="center"> <img width="300" src="./resources/logo.svg#gh-dark-mode-only" alt="kms"> </h1> <p align="center"> <p align="center"><b>KMS Go SDK </b> </p> <h4 align="center"> <a href="https://lux.network/slack">S... |
| `lattice` | Lattice: lattice-based multiparty homomorphic encryption library in Go | Go | <p align="center"> <img src="logo.png" /> </p> |
| `lattigo` | lattice | Go | ![Go tests](https://github.com/luxfi/lattice/actions/workflows/ci.yml/badge.svg) |
| `lattigo-ringtail` | Lattigo: lattice-based multiparty homomorphic encryption library in Go | Go | <p align="center"> <img src="logo.png" /> </p> |
| `ledger` | Ledger Lux | Go | [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) [![GithubActions](https://github.com/luxfi/ledger/actions/workflows/main.yml/badge.svg)](https://git... |
| `ledger-lux-go` | ledger-lux-go | Go | [![Test](https://github.com/luxfi/ledger-lux/actions/workflows/test.yml/badge.svg)](https://github.com/luxfi/ledger-lux/actions/workflows/test.yml) |
| `log` | Lux Log Package | Go | A unified logging package for the Lux ecosystem that provides a consistent logging interface across all projects while abstracting away the underlying implementation details. |
| `lpm` | Lux Plugin Manager (LPM) | Go | **Note: This code is currently in Alpha. Proceed at your own risk.** |
| `lps` | Lux Proposals (LPs) | Python | Lux Proposals (LPs) are the primary mechanism for proposing new features, gathering community input, and documenting design decisions for the [Lux Network](https://lux.network). This process ensures that changes to th... |
| `marketplace` | marketplace | TypeScript/JS | <h3 align="center">Lux Market</h3> <p align="center"> |
| `math` | Lux Math Library | Go | A comprehensive mathematical utilities library for the Lux ecosystem. |
| `metric` | Lux Metrics Library | Go | A comprehensive metrics library for the Lux ecosystem with built-in context propagation support for Prometheus metrics collection. |
| `metrics` | Lux Metrics Library | Go | A comprehensive metrics library for the Lux ecosystem with built-in context propagation support for Prometheus metrics collection. |
| `mlx` | MLX | Go | [**Quickstart**](#quickstart) \| [**Installation**](#installation) \| [**Documentation**](https://ml-explore.github.io/mlx/build/html/index.html) \| [**Examples**](#examples) |
| `mock` | Lux Mock Library | Go | Centralized mock utilities and helpers for the Lux ecosystem. |
| `monitoring` | Lux Network Monitoring Stack | Mixed | Comprehensive monitoring solution for Lux Network with Grafana, Prometheus, and Loki. |
| `mpc` | Lux MPC: Resilient MPC (Multi-Party Computation) Nodes for Distributed Crypto Wallet Generation | Go | > _"Setting up MPC wallets has always been painful, complex, and confusing. With Lux MPC, you can launch a secure MPC node cluster and generate wallets in minutes."_ |
| `multi-party-sig` | multi-party-sig | Go | [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) |
| `multinet` | Multi-Network Consensus (MultiNet) | Mixed | **MultiNet** is a unified framework for orchestrating **parallel consensus** across multiple heterogeneous blockchains (L1, L2, L3, …). At its core, MultiNet provides: |
| `netrunner` | Lux Network Runner | Go | This tool is under heavy development and the documentation/code snippets below may vary slightly from the actual code in the repository. Updates to the documentation may happen some time after an update to the codebas... |
| `netrunner-sdk` | netrunner-sdk | Go |  |
| `node` | node | Go | <div align="center"> <img src="resources/LuxLogoRed.png?raw=true"> </div> |
| `node-fresh` | node-fresh | Go | <div align="center"> <img src="resources/LuxLogoRed.png?raw=true"> </div> |
| `optimism` | optimism | Go |  |
| `qzmq` | QZMQ - Quantum-Safe ZeroMQ | Go | [![Go Reference](https://pkg.go.dev/badge/github.com/luxfi/qzmq.svg)](https://pkg.go.dev/github.com/luxfi/qzmq) [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE) |
| `ringtail` | Ringtail | Go | This is a pure Golang implementation of Ringtail [eprint.iacr.org/2024/1113](https://eprint.iacr.org/2024/1113), a practical two-round threshold signature scheme from LWE. |
| `stack` | stack | Go |  |
| `town` | Lux Town | TypeScript/JS | - Docker |
| `trace` | trace | Go |  |
| `tss` | Multi-Party Threshold Signature Scheme | Go | [![MIT licensed][1]][2] [![GoDoc][3]][4] [![Go Report Card][5]][6] |
| `web` | web | TypeScript/JS | Lux Ecosystem on the World Wide Web. |
| `zmq` | zmq4 - LuxFi Fork | Go | [![GitHub release](https://img.shields.io/github/release/luxfi/zmq.svg)](https://github.com/luxfi/zmq/releases) [![go.dev reference](https://pkg.go.dev/badge/github.com/luxfi/zmq/v4)](https://pkg.go.dev/github.com/lux... |

---
Source: local scan of ~/work/lux. For GitHub, see https://github.com/luxfi