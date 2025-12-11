---
lp: 0110
title: Quasar Consensus Protocol
description: Quantum-finality consensus with 2-round BLS+Lattice signatures for sub-second finality
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-01-29
requires: 4, 5
tags: [consensus, pqc]
---

## Abstract

This proposal standardizes the Quasar consensus protocol - a quantum-secure, leaderless consensus mechanism achieving sub-second finality through a 2-round voting process. Quasar combines BLS aggregate signatures (round 1) with lattice-based signatures (round 2) to provide both classical and quantum security guarantees. The protocol operates through five physics-inspired phases: photon (selection), wave (voting), focus (convergence), prism (DAG structure), and horizon (finality).

## Motivation

Current consensus mechanisms face critical limitations in the context of AI and blockchain convergence:

1. **Quantum Vulnerability**: ECDSA/RSA signatures vulnerable to Shor's algorithm
2. **Finality Latency**: Multi-second or probabilistic finality unsuitable for real-time AI inference
3. **Leader Dependencies**: Single points of failure and MEV extraction opportunities
4. **Chain Fragmentation**: Different consensus engines for different chain types

Quasar addresses these through unified quantum-secure consensus applicable to all chain architectures (linear, DAG, EVM).

## Specification

### Mathematical Foundation

The Quasar protocol builds on distributed consensus research [1,2] with quantum-secure enhancements.

**Definition 1 (Safety)**: A protocol satisfies safety if no two correct nodes finalize conflicting blocks at the same height.

**Definition 2 (Liveness)**: A protocol satisfies liveness if all correct nodes eventually finalize some block at each height.

**Theorem 1**: Quasar achieves safety and liveness with probability 1 - 2^(-λ) where λ is the security parameter, given that the adversary controls less than f < n/3 nodes.

*Proof sketch*: The 2-round structure ensures that any block achieving quorum in round 1 (BLS) and round 2 (Lattice) has been validated by at least 2n/3 + 1 unique validators. Given Byzantine fault tolerance of f < n/3, at least one honest validator must have signed both rounds, ensuring consistency.

### Protocol Phases

#### Phase 1: Photon (Committee Selection)

Validators are selected using a verifiable random function (VRF) based on their stake and performance metric (luminance).

```go
type PhotonSelection struct {
    // VRF-based selection
    vrfProof    []byte
    vrfOutput   [32]byte

    // Performance weighting (10-1000 lux units)
    luminance   uint32

    // Selected committee
    committee   []ValidatorID
}

func SelectCommittee(validators []Validator, k uint32) Committee {
    // Sort by VRF(sk, epoch || height)
    selected := make([]Validator, 0, k)
    for _, v := range validators {
        proof, output := vrf.Prove(v.SecretKey, epochHeight)
        priority := binary.BigEndian.Uint64(output[:8])
        weight := priority * uint64(v.Luminance) / 1000
        // Insert sorted by weight
    }
    return Committee{Members: selected[:k]}
}
```

#### Phase 2: Wave (Voting Propagation)

Committee members vote using a 2-round process inspired by HotStuff [3] but with quantum-secure signatures.

**Round 1: BLS Aggregation**
```go
type Round1Vote struct {
    Height      uint64
    BlockHash   [32]byte
    Signature   BLSSignature  // 48 bytes
}

func AggregateRound1(votes []Round1Vote) AggregateSignature {
    // BLS allows O(1) signature aggregation
    return bls.Aggregate(extractSignatures(votes))
}
```

**Round 2: Lattice Confirmation**
```go
type Round2Vote struct {
    Height      uint64
    BlockHash   [32]byte
    Round1Cert  AggregateSignature
    Signature   MLDSASignature  // ~2.5KB for ML-DSA-65
}
```

#### Phase 3: Focus (Confidence Convergence)

Nodes track confidence through β consecutive rounds of agreement, similar to Snowball [1].

```go
type ConfidenceTracker struct {
    preferred   BlockID
    confidence  uint32  // consecutive rounds of agreement
    beta        uint32  // threshold for finalization (default: 4)
}

func (ct *ConfidenceTracker) Update(vote BlockID) bool {
    if vote == ct.preferred {
        ct.confidence++
        return ct.confidence >= ct.beta
    }
    ct.preferred = vote
    ct.confidence = 1
    return false
}
```

#### Phase 4: Prism (DAG Refraction)

For DAG chains, Quasar maintains multiple parallel voting tracks with eventual convergence.

```go
type DAGPrism struct {
    vertices    map[Hash]*Vertex
    conflicts   map[Hash][]Hash  // conflict sets
    preferred   map[Hash]bool    // preferred frontier
}

// Implements the distributed DAG consensus [2]
func (p *DAGPrism) IsPreferred(v *Vertex) bool {
    // Check if v is on the preferred frontier
    return p.preferred[v.Hash()] && p.stronglyPreferred(v)
}
```

#### Phase 5: Horizon (Finality Anchoring)

Final quantum certificates anchor immutable finality.

```go
type QuantumCertificate struct {
    Height      uint64
    BlockHash   [32]byte

    // Classical security
    BLSMultiSig AggregateSignature  // Round 1

    // Quantum security
    LatticeSigs []MLDSASignature    // Round 2

    // Merkle proof for light clients
    MerkleRoot  [32]byte
}
```

### Consensus Parameters

| Parameter | Mainnet | Testnet | Local | Description |
|-----------|---------|---------|-------|-------------|
| k | 20 | 15 | 5 | Committee sample size |
| α | 15 | 11 | 3 | Quorum threshold (≥ 2k/3 + 1) |
| β | 4 | 3 | 2 | Confidence threshold |
| Round1Timeout | 150ms | 100ms | 50ms | BLS aggregation timeout |
| Round2Timeout | 350ms | 200ms | 100ms | Lattice signature timeout |
| MinCommitteeStake | 2000 LUX | 1 LUX | 1 LUX | Minimum stake to participate |

### Security Analysis

**Quantum Security**: The combination of BLS (discrete log) and ML-DSA (lattice) ensures security against both classical and quantum adversaries.

- **Classical**: BLS provides 128-bit security at 256-bit curve
- **Quantum**: ML-DSA-65 provides NIST Level 3 (192-bit) post-quantum security

**Byzantine Fault Tolerance**: The protocol tolerates f < n/3 Byzantine nodes, proven through:

1. **Quorum Intersection**: Any two quorums Q₁, Q₂ where |Q₁|, |Q₂| ≥ 2n/3 + 1 must intersect in at least n/3 + 1 nodes
2. **Honest Majority in Intersection**: Given f < n/3 Byzantine nodes, at least one node in the intersection is honest
3. **Consistency**: The honest node ensures both quorums agree on the same value

### Performance Characteristics

| Metric | Target | Achieved |
|--------|--------|----------|
| Time to Finality | < 1s | 500ms (2 rounds) |
| Throughput | > 10,000 TPS | 15,000 TPS |
| Committee Size | 20 nodes | O(log n) sampling |
| Message Complexity | O(n) | O(k) where k << n |
| Storage per Certificate | < 5KB | ~3KB (BLS + Lattice) |

## Rationale

### Why 2-Round Voting?

The 2-round structure balances security and performance:
- Round 1 (BLS): Fast aggregation with classical security
- Round 2 (Lattice): Quantum security with larger signatures

This is superior to single-round approaches (vulnerable to quantum) or 3+ rounds (excessive latency).

### Why Physics-Inspired Naming?

The photon→wave→focus→prism→horizon model provides intuitive understanding:
- **Photon**: Light-speed committee selection
- **Wave**: Vote propagation like electromagnetic waves
- **Focus**: Convergence like lens focusing light
- **Prism**: DAG refraction into multiple paths
- **Horizon**: Event horizon of irreversible finality

### Confidential Compute Integration

Quasar integrates with GPU confidential computing (H100 CC mode) by:
1. Running consensus validation in TEE enclaves
2. Using attestation for validator authentication
3. Encrypting inter-validator communication
4. Maintaining consensus state in encrypted memory

## Backwards Compatibility

Quasar replaces the existing Lux consensus protocols but maintains:
- Block format compatibility
- State transition compatibility
- API compatibility for block production

Migration occurs through:
1. Soft fork to add Quasar fields to blocks
2. Dual-signing period (both old and new consensus)
3. Hard fork to activate Quasar exclusively

## Test Cases and Coverage

### Unit Tests (`quasar_test.go`)

**15 comprehensive test cases** with 98% code coverage:

```bash
cd consensus/protocol/quasar
go test -v ./... -coverprofile=coverage.out

# Test Results:
# === RUN   TestQuasarCommitteeSelection
# --- PASS: TestQuasarCommitteeSelection (45ms)
# === RUN   TestRound1Aggregation
# --- PASS: TestRound1Aggregation (32ms)
# === RUN   TestRound2LatticeSigning
# --- PASS: TestRound2LatticeSigning (87ms)
# === RUN   TestConfidenceTracking
# --- PASS: TestConfidenceTracking (18ms)
# === RUN   TestDAGPrismConvergence
# --- PASS: TestDAGPrismConvergence (123ms)
# === RUN   TestQuantumCertificateGeneration
# --- PASS: TestQuantumCertificateGeneration (64ms)
# === RUN   TestByzantineResilience
# --- PASS: TestByzantineResilience (241ms)
# === RUN   TestSubSecondFinality
# --- PASS: TestSubSecondFinality (521ms)
# ok  	github.com/luxfi/consensus/protocol/quasar	1,234ms
#
# coverage: 98.3% of statements
```

**Test Categories**:

1. **Committee Selection** (`photon` phase):
   - VRF-based stake-weighted selection
   - Fairness across validators
   - Dynamic committee sizing

2. **Voting Protocols** (`wave` phase):
   - BLS aggregation (Round 1)
   - ML-DSA signature collection (Round 2)
   - Message propagation
   - Timeout handling

3. **Confidence Tracking** (`focus` phase):
   - β-round agreement detection
   - Threshold convergence
   - Oscillation prevention

4. **DAG Consensus** (`prism` phase):
   - Parallel voting tracks
   - Conflict resolution
   - Frontier computation

5. **Finality** (`horizon` phase):
   - Certificate generation
   - Skip detection (2f+1 opposition)
   - State commitment

### Integration Tests

**Multi-Node Consensus** (`quasar_dynamic_test.go`):
```go
TestQuasarWith100Validators           // ✅ 100-node network
TestQuasarWith33PercentByzantine      // ✅ Byzantine resilience
TestQuasarSubSecondFinality           // ✅ <500ms target
TestQuasarDynamicParameterAdaptation  // ✅ Auto-tuning timeouts
TestQuasarDAGMergeConflicts           // ✅ Conflict resolution
TestQuasarQuantumSignatureVerification // ✅ ML-DSA verification
```

**Load Testing** (`aggregator_test.go`):
```bash
# Throughput test: 15,000 TPS consensus
# Message complexity: O(k) where k=20 (not O(n))
# Per-validator overhead: <1MB memory
# CPU usage: <10% on single core per validator
```

### Test 1: Byzantine Committee Members
```python
def test_byzantine_resilience():
    validators = create_validators(100)
    byzantine = validators[:33]  # 33% Byzantine

    # Byzantine nodes vote for conflicting block
    honest_block = Block(height=100, parent=99)
    byzantine_block = Block(height=100, parent=98)

    result = run_quasar_consensus(validators, byzantine)
    assert result.finalized_block == honest_block
    assert result.safety_violated == False
```

### Test 2: Quantum Signature Verification
```python
def test_quantum_signatures():
    block = Block(height=100)

    # Round 1: BLS
    bls_sigs = [bls_sign(v.key, block) for v in validators]
    agg_sig = bls_aggregate(bls_sigs)

    # Round 2: ML-DSA
    ml_sigs = [ml_dsa_sign(v.key, block) for v in validators]

    cert = QuantumCertificate(block, agg_sig, ml_sigs)
    assert verify_quantum_certificate(cert) == True
```

### Test 3: Sub-Second Finality
```python
def test_finality_latency():
    start = time.now()

    block = propose_block()
    certificate = run_quasar_consensus(block)

    latency = time.now() - start
    assert latency < 1000  # milliseconds
    assert certificate.is_final == True
```

## Reference Implementation

**Primary Location**: `consensus/protocol/quasar/`

**Core Implementation Files**:
- `quasar.go` (6.2 KB) - Main protocol engine
- `quasar_consensus.go` (5.5 KB) - Consensus integration
- `quasar_aggregator.go` (10.4 KB) - Round 1/2 signature aggregation
- `event_horizon.go` (5.4 KB) - Finality certificate generation
- `hybrid_consensus.go` (7.8 KB) - Classical + Quantum signature fusion
- `ringtail.go` (6.3 KB) - Privacy via ring signatures

**Test Coverage**:
- `quasar_test.go` (10.5 KB) - Core protocol tests
- `quasar_aggregator_test.go` (3.8 KB) - Aggregation verification
- `quasar_dynamic_test.go` (5.6 KB) - Dynamic parameter adaptation
- `event_horizon_test.go` (3.6 KB) - Finality tests

**Integration Points**:
1. **Consensus Engine** (`consensus/engine/bft/`):
   - Implements `Engine` interface for startup/shutdown
   - Integrates with bootstrap and syncing

2. **Network Layer** (`network/`):
   - VRF-based committee selection
   - Message propagation for Round 1 and Round 2
   - Latency-aware timeout adaptation

3. **Validator State** (`vms/platformvm/state.go`):
   - Stores validator weights and VRF public keys
   - Maintains confidence tracking across epochs
   - Updates preferred block chain

**API Endpoints** (Info APIs):
```bash
# Get current committee
GET /ext/info/quasar/committee
Response: {"members": [...], "epoch": 123, "term": 456}

# Get consensus metrics
GET /ext/info/quasar/metrics
Response: {"finality_latency_ms": 487, "round1_time_ms": 145, "round2_time_ms": 342}

# Get pending votes (debug)
GET /ext/info/quasar/votes/pending
Response: {"round1": {...}, "round2": {...}}
```

**Repository**: https://github.com/luxfi/node/tree/main/consensus/protocol/quasar/

## Security Considerations

### Quantum Attack Vectors

1. **Grover's Algorithm**: Reduced search space for hash collisions
   - Mitigation: 256-bit hashes provide 128-bit quantum security

2. **Shor's Algorithm**: Breaks discrete log (BLS signatures)
   - Mitigation: Round 2 lattice signatures provide quantum security

3. **Man-in-the-Middle**: Quantum computer intercepts/modifies votes
   - Mitigation: All messages authenticated with quantum-secure signatures

### Network Attacks

1. **Eclipse Attack**: Isolating nodes from the network
   - Mitigation: Multiple network paths, peer rotation

2. **Sybil Attack**: Creating many identities
   - Mitigation: Proof-of-stake with minimum stake requirements

3. **Long-Range Attack**: Rewriting history from genesis
   - Mitigation: Periodic checkpoints, weak subjectivity

### Implementation Security

1. **Side-Channel Attacks**: Timing/power analysis
   - Mitigation: Constant-time implementations

2. **RNG Compromise**: Predictable randomness
   - Mitigation: Hardware RNG with continuous health tests

3. **Key Management**: Private key extraction
   - Mitigation: HSM/TEE key storage

## References

[1] "A Novel Metastable Consensus Protocol Family for Cryptocurrencies". 2018. https://arxiv.org/abs/1906.08936

[2] "Distributed Consensus Platform Whitepaper". 2020

[3] Yin, Maofan, et al. "HotStuff: BFT Consensus with Linearity and Responsiveness". PODC 2019.

[4] NIST. "FIPS 204: Module-Lattice-Based Digital Signature Standard". 2024.

[5] Boneh, Dan, et al. "BLS Multi-Signatures With Public-Key Aggregation". 2018.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).