# LP Consolidation Plan - Architecture Specification

## Design Principles
1. **Orthogonality**: Each LP addresses exactly one concern
2. **DRY**: No duplication across standards  
3. **Composability**: Standards build on primitives
4. **Academic Rigor**: Reference foundational papers
5. **L2 Support**: Base standards for HIP/ZIP dependencies

## Final LP Numbering Scheme

### Core (1-99): protocol fundamentals

| LP | Title | Dependencies | Status |
|----|-------|--------------|--------|
| lp-1 | genesis state specification | - | final |
| lp-2 | account model and state tree | lp-1 | final |
| lp-3 | transaction format and validation | lp-2 | final |
| lp-4 | block structure and headers | lp-3 | final |
| lp-5 | merkle patricia trie specification | - | final |
| lp-6 | rlp encoding standard | - | final |
| lp-7 | signature schemes (ecdsa, eddsa) | - | final |
| lp-8 | address format and derivation | lp-7 | final |
| lp-9 | network protocol messages | lp-4 | final |
| lp-10 | p2p discovery protocol | lp-9 | deprecated → lp-110 |
| lp-11 | node synchronization protocol | lp-9,lp-4 | final |
| lp-12 | fee market mechanism | lp-3 | final |
| lp-13 | state root calculation | lp-5,lp-2 | final |
| lp-14 | receipt structure | lp-3 | final |
| lp-15 | log and event specification | lp-14 | final |
| lp-16 | uncle/ommer blocks | lp-4 | deprecated |
| lp-17 | difficulty adjustment | - | deprecated → lp-101 |
| lp-18 | gas cost schedule | lp-12 | final |
| lp-19 | opcode specification | - | final |

### Consensus (100-199): agreement protocols

| LP | Title | Dependencies | References | Status |
|----|-------|--------------|------------|--------|
| lp-100 | snowball family specification | - | [snowball 2018] | final |
| lp-101 | snowman linear consensus | lp-100 | [snowman 2020] | final |
| lp-102 | avalanche dag consensus | lp-100 | [avalanche 2020] | final |
| lp-103 | slush meta-stable protocol | lp-100 | [slush 2019] | final |
| lp-104 | snowflake query amplification | lp-103 | [snowflake 2019] | final |
| lp-105 | vertex structure for dag | lp-102 | - | final |
| lp-106 | confidence threshold parameters | lp-100 | - | final |
| lp-107 | quorum certificate format | lp-101 | - | final |
| lp-108 | view change protocol | lp-101 | - | final |
| lp-109 | fork resolution rules | lp-101,lp-102 | - | final |
| lp-110 | gossip protocol for consensus | lp-9 | - | final |
| lp-111 | validator sampling | lp-106 | - | final |
| lp-112 | stake-weighted voting | lp-111 | - | final |
| lp-113 | finality gadget | lp-107 | - | final |
| lp-114 | checkpoint mechanism | lp-113 | - | final |
| lp-115 | quasar quantum-finality | lp-113,lp-201 | [LP-700] | draft |
| lp-116 | bft safety proofs | lp-100 | [pbft 1999] | final |
| lp-117 | liveness conditions | lp-116 | - | final |
| lp-118 | network partition handling | lp-117 | - | final |
| lp-119 | consensus versioning | lp-100 | - | final |

### Cryptography (200-299): security primitives

| LP | Title | Dependencies | References | Status |
|----|-------|--------------|------------|--------|
| lp-200 | hash function requirements | - | [sha3-256] | final |
| lp-201 | bls signature aggregation | - | [bls12-381] | final |
| lp-202 | threshold signatures (tss) | lp-201 | [gg20] | final |
| lp-203 | verifiable random functions | lp-200 | [vrf-ed25519] | final |
| lp-204 | zero-knowledge proof systems | - | [groth16, plonk] | final |
| lp-205 | merkle proof format | lp-5,lp-200 | - | final |
| lp-206 | commitment schemes | lp-200 | [kzg] | final |
| lp-207 | ml-kem key encapsulation | - | [nist ml-kem] | final |
| lp-208 | ml-dsa signatures | - | [nist ml-dsa] | final |
| lp-209 | slh-dsa hash signatures | - | [nist slh-dsa] | final |
| lp-210 | lattice-based cryptography | lp-207,lp-208 | [kyber, dilithium] | final |
| lp-211 | ring signature protocol | lp-7 | [cryptonote] | draft |
| lp-212 | pedersen commitments | lp-206 | - | final |
| lp-213 | bulletproofs | lp-204 | [bulletproofs 2017] | draft |
| lp-214 | stark proof system | lp-204 | [stark 2018] | draft |
| lp-215 | mpc protocols | lp-202 | [cgg21] | final |
| lp-216 | secret sharing schemes | lp-215 | [shamir, feldman] | final |
| lp-217 | distributed key generation | lp-216 | [dkg-bls] | final |
| lp-218 | quantum-safe migration | lp-207,lp-208,lp-209 | - | draft |
| lp-219 | hybrid classical-quantum | lp-218 | - | draft |

### Token Standards (300-399): asset primitives

| LP | Title | Dependencies | ERC | Status |
|----|-------|--------------|-----|--------|
| lp-300 | token interface base | lp-15 | - | final |
| lp-301 | fungible token (lrc-20) | lp-300 | erc-20 | final |
| lp-302 | non-fungible token (lrc-721) | lp-300 | erc-721 | final |
| lp-303 | multi-token (lrc-1155) | lp-300 | erc-1155 | final |
| lp-304 | token metadata extension | lp-301,lp-302 | - | final |
| lp-305 | permit signatures | lp-301 | erc-2612 | final |
| lp-306 | flash mint interface | lp-301 | erc-3156 | final |
| lp-307 | token bound accounts | lp-302 | erc-6551 | draft |
| lp-308 | semi-fungible token | lp-303 | erc-3525 | draft |
| lp-309 | soulbound token | lp-302 | erc-5192 | draft |
| lp-310 | fractional nft | lp-302 | - | draft |
| lp-311 | royalty standard | lp-302 | erc-2981 | final |
| lp-312 | token upgrade mechanism | lp-301 | - | draft |
| lp-313 | batch operations | lp-300 | - | final |
| lp-314 | token hooks | lp-300 | erc-777 | deprecated |
| lp-315 | wrapper token | lp-301 | - | final |

### Bridge/Interop (400-499): cross-chain communication

| LP | Title | Dependencies | Status |
|----|-------|--------|--------|
| lp-400 | cross-chain message format | lp-9 | final |
| lp-401 | bridge validator set | lp-112 | final |
| lp-402 | merkle proof verification | lp-205 | final |
| lp-403 | bridge asset registry | lp-301 | final |
| lp-404 | lock-mint mechanism | lp-403 | final |
| lp-405 | burn-unlock mechanism | lp-403 | final |
| lp-406 | liquidity pool bridge | lp-403 | draft |
| lp-407 | atomic swap protocol | lp-400 | final |
| lp-408 | bridge fee structure | lp-12 | final |
| lp-409 | finality proofs | lp-402 | final |
| lp-410 | bridge security framework | lp-401 | final |
| lp-411 | mpc bridge protocol | lp-215 | draft |
| lp-412 | teleport protocol | lp-400 | draft |
| lp-413 | warp messaging | lp-400 | final |
| lp-414 | bridge slashing | lp-401 | draft |
| lp-415 | cross-chain queries | lp-400 | draft |

### L2 Support (500-599): layer-2 primitives

| LP | Title | Dependencies | For | Status |
|----|-------|--------------|-----|--------|
| lp-500 | rollup data availability | lp-4 | HIP-1,ZIP-1 | final |
| lp-501 | state commitment scheme | lp-206 | HIP-2,ZIP-2 | final |
| lp-502 | fraud proof format | lp-204 | HIP-3 | final |
| lp-503 | validity proof format | lp-204 | ZIP-3 | final |
| lp-504 | sequencer registry | lp-112 | HIP-4,ZIP-4 | final |
| lp-505 | l2 block format | lp-4 | HIP-5,ZIP-5 | final |
| lp-506 | batch submission | lp-500 | HIP-6,ZIP-6 | final |
| lp-507 | withdrawal mechanism | lp-409 | HIP-7,ZIP-7 | final |
| lp-508 | fee abstraction | lp-12 | HIP-8,ZIP-8 | draft |
| lp-509 | l2 bridge interface | lp-400 | HIP-9,ZIP-9 | final |
| lp-510 | shared sequencing | lp-504 | HIP-10,ZIP-10 | draft |
| lp-511 | l2 consensus rules | lp-101 | HIP-11,ZIP-11 | draft |
| lp-512 | state rent for l2 | lp-18 | HIP-12,ZIP-12 | draft |
| lp-513 | l2 upgrade mechanism | - | HIP-13,ZIP-13 | draft |
| lp-514 | interoperability standard | lp-509 | HIP-14,ZIP-14 | draft |
| lp-515 | prover marketplace | lp-503 | ZIP-15 | draft |

### Technical (600-699): implementation details

| LP | Title | Dependencies | Status |
|----|-------|--------------|--------|
| lp-600 | vm execution environment | lp-19 | final |
| lp-601 | gas metering | lp-18 | final |
| lp-602 | state sync protocol | lp-11 | final |
| lp-603 | verkle tree migration | lp-5 | draft |
| lp-604 | database layout | lp-2 | final |
| lp-605 | validator lifecycle | lp-112 | final |
| lp-606 | fixed point arithmetic | - | final |
| lp-607 | gpu acceleration | - | experimental |
| lp-608 | network topology | lp-10 | final |
| lp-609 | mempool design | lp-3 | final |
| lp-610 | indexer protocol | lp-15 | final |
| lp-611 | archive node spec | lp-604 | final |
| lp-612 | light client protocol | lp-11 | final |
| lp-613 | json-rpc specification | - | final |
| lp-614 | websocket protocol | lp-613 | final |
| lp-615 | graphql interface | lp-610 | draft |

### Research (700-799): experimental protocols

| LP | Title | Dependencies | Status |
|----|-------|--------------|--------|
| lp-700 | quasar consensus (reserved) | lp-115 | experimental |
| lp-701 | mev protection | lp-609 | research |
| lp-702 | decentralized sequencing | lp-504 | research |
| lp-703 | parallel execution | lp-600 | research |
| lp-704 | state expiry | lp-604 | research |
| lp-705 | account abstraction | lp-2 | research |
| lp-706 | recursive proofs | lp-204 | research |
| lp-707 | homomorphic encryption | - | research |
| lp-708 | secure multiparty computation | lp-215 | research |
| lp-709 | distributed randomness | lp-203 | research |
| lp-710 | quantum networking | - | research |

### Meta (800-899): process and governance

| LP | Title | Dependencies | Status |
|----|-------|--------------|--------|
| lp-800 | lp process specification | - | final |
| lp-801 | governance framework | lp-800 | final |
| lp-802 | security audit requirements | - | final |
| lp-803 | deprecation process | lp-800 | final |
| lp-804 | emergency procedures | lp-801 | final |
| lp-805 | compatibility guidelines | - | final |
| lp-806 | testing requirements | - | final |
| lp-807 | documentation standards | - | final |
| lp-808 | reference implementation | - | final |
| lp-809 | versioning scheme | - | final |

## Consolidation Instructions

### Phase 1: Core Cleanup (Week 1)
1. **Merge duplicate consensus specs**:
   - lp-10 (p-chain) → lp-101 (snowman)
   - lp-600 (snowman duplicate) → lp-101
   - lp-consensus-params → split into lp-106

2. **Extract primitives from compounds**:
   - lp-0 → split meta (lp-800) and architecture (deprecate)
   - lp-fundamental-principles → lp-801 (governance)
   - lp-complete-knowledge → deprecate (redundant index)

3. **Standardize cryptography**:
   - lp-001/002/003 → lp-207/208/209
   - lp-4 (quantum) → lp-218 (migration strategy)

### Phase 2: Token Consolidation (Week 2)
1. **Unify token standards**:
   - lp-20 → lp-301 (lrc-20)
   - lp-721 → lp-302 (lrc-721)
   - lp-1155 → lp-303 (lrc-1155)
   - Extensions (28-31) → lp-304-315

2. **DeFi suite reorganization**:
   - lp-60-74 → deprecate overview pages
   - Create atomic standards in 350-399 range

### Phase 3: Bridge Standards (Week 3)
1. **Consolidate bridge protocols**:
   - lp-13-19 (various bridge) → lp-400-415
   - lp-21 (teleport) → lp-412
   - lp-22 (warp) → lp-413

2. **MPC unification**:
   - lp-13/14 (m-chain) → lp-411 (mpc bridge)
   - lp-103/104 (mpc research) → lp-215/708

### Phase 4: Technical Specs (Week 4)
1. **Chain specifications**:
   - lp-11/12 (x/c-chain) → reference core standards
   - lp-80/81/99 (a/b/q-chain) → implementation docs

2. **Advanced features**:
   - lp-advanced-* → split into atomic standards
   - lp-patterns → lp-807 (documentation)

## New LPs for L2 Support

### Critical L2 Dependencies
1. **lp-500**: rollup data availability (HIP-1, ZIP-1)
2. **lp-501**: state commitment scheme (HIP-2, ZIP-2)  
3. **lp-502**: fraud proof format (HIP-3)
4. **lp-503**: validity proof format (ZIP-3)
5. **lp-504**: sequencer registry (HIP-4, ZIP-4)
6. **lp-505**: l2 block format (HIP-5, ZIP-5)
7. **lp-506**: batch submission (HIP-6, ZIP-6)
8. **lp-507**: withdrawal mechanism (HIP-7, ZIP-7)
9. **lp-509**: l2 bridge interface (HIP-9, ZIP-9)

### L2 References
- HIP standards inherit from lp-500-515
- ZIP standards inherit from lp-500-515
- Both reference core cryptography (lp-200-219)

## Deprecation List

### Immediate Deprecation
1. **Redundant/Duplicate**:
   - lp-0 (split into components)
   - lp-10 (replaced by lp-101)
   - lp-4-r2 (superseded)
   - lp-complete-knowledge-base
   - lp-research-index (use categories)
   - lp-ecosystem-crossover

2. **Non-atomic (split required)**:
   - lp-advanced-features
   - lp-advanced-topics  
   - lp-patterns-and-antipatterns
   - lp-philosophical-foundations
   - lp-l1-l2-l3-architecture

3. **Move to documentation**:
   - lp-test-engineering → docs/testing.md
   - lp-60 (defi overview) → docs/defi.md
   - lp-90-97 (research papers) → docs/research/

### Staged Deprecation (6 months)
- lp-16 (uncle blocks - not used)
- lp-17 (difficulty - pos migration)
- lp-314 (token hooks - security issues)

## Migration Script

```bash
#!/bin/bash
# LP consolidation automation

# Phase 1: Backup current state
git checkout -b lp-consolidation
mkdir -p LPs/deprecated
mkdir -p docs/research

# Phase 2: Core renumbering
mv LPs/lp-0.md LPs/deprecated/
mv LP-600-snowman.md LPs/lp-101.md
mv LP-001-ML-KEM.md LPs/lp-207.md
mv LP-002-ML-DSA.md LPs/lp-208.md  
mv LP-003-SLH-DSA.md LPs/lp-209.md

# Phase 3: Update references
find LPs -name "*.md" -exec sed -i 's/lp-0\]/lp-800\]/g' {} \;
find LPs -name "*.md" -exec sed -i 's/lp-600/lp-101/g' {} \;

# Phase 4: Validate
make validate-all
make check-links
```

## Success Metrics
1. **Zero duplication**: No overlapping specifications
2. **Clear dependencies**: Explicit requirement chains
3. **L2 ready**: All HIP/ZIP dependencies satisfied
4. **Academic rigor**: Papers cited for consensus/crypto
5. **Clean hierarchy**: Logical progression from primitive to complex

## References
- [snowball 2018]: "Scalable and Probabilistic Leaderless BFT Consensus"
- [avalanche 2020]: "Avalanche Platform Specification"
- [pbft 1999]: "Practical Byzantine Fault Tolerance"
- [nist pqc]: NIST Post-Quantum Cryptography Standards
- [cgg21]: "UC Non-Interactive, Proactive, Threshold ECDSA"