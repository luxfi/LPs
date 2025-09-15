# Patterns and Antipatterns in Distributed Ledger Design

## Introduction: The Language of Patterns

Patterns are recurring solutions to common problems. Antipatterns are recurring mistakes that seem like solutions. In distributed systems, the line between pattern and antipattern is often thin, context-dependent, and discovered only through painful experience.

---

## Section I: Consensus Patterns

### Pattern: Optimistic Execution with Rollback

**Context**: Need high throughput but must maintain consistency.

**Solution**:
```
1. Execute transactions optimistically
2. Track dependencies and conflicts
3. Roll back and retry on conflicts
4. Commit when consensus achieved
```

**Example Implementation**:
```go
type OptimisticExecutor struct {
    pending   map[TxID]*State
    conflicts map[TxID][]TxID
}

func (e *OptimisticExecutor) Execute(tx Transaction) (*Result, error) {
    state := e.pending[tx.ID] 
    result := tx.Apply(state)
    
    if conflicts := e.detectConflicts(tx); len(conflicts) > 0 {
        e.rollback(tx)
        return nil, ErrConflict
    }
    
    e.pending[tx.ID] = result.State
    return result, nil
}
```

**Benefits**: High throughput, natural parallelism
**Liabilities**: Complex rollback logic, memory overhead

### Pattern: Leader Rotation with VRF

**Context**: Need unpredictable leader selection to prevent targeted attacks.

**Solution**:
```
VRF(secret_key, seed) → (proof, output)

Leader = argmax(VRF_output) among all participants
```

**Benefits**: Unpredictable, verifiable, fair
**Liabilities**: Requires synchronized randomness source

### Antipattern: Naive Longest Chain

**Problem**: Following longest chain without additional checks.

**Why It Fails**:
```
Attacker with 30% hashpower:
- Privately mine chain
- Release when longer
- Causes frequent reorgs
```

**Correct Pattern**: Weighted by total work, not length.

### Antipattern: Fixed Committee Consensus

**Problem**: Static validator set becomes attack target.

**Manifestation**:
```
Committee = [V₁, V₂, ..., Vₙ] // Never changes

Result:
- Adaptive adversary corrupts over time
- DDoS targets known
- No recovery mechanism
```

**Correct Pattern**: Rotating committees with overlap.

---

## Section II: State Management Patterns

### Pattern: Merkle Mountain Ranges

**Context**: Need to prove historical state without storing all history.

**Solution**:
```
     Peak₃
       /\
      /  \
  Peak₂  /  \
    /\  /    \
   /  \/      \
  □  □  □  □  □  □  □
  
Proof = [peak₁, peak₂, ..., sibling_hashes]
```

**Benefits**: Logarithmic proofs, append-only
**Trade-offs**: Multiple peaks to track

### Pattern: State Rent with Graceful Degradation

**Context**: Prevent state bloat while preserving user assets.

**Solution**:
```solidity
contract StateRent {
    mapping(address => uint) lastPayment;
    mapping(address => bytes) archivedState;
    
    modifier rentPaid() {
        if (block.timestamp - lastPayment[msg.sender] > RENT_PERIOD) {
            archiveState(msg.sender);
            require(msg.value >= RENT_AMOUNT, "Pay rent");
            lastPayment[msg.sender] = block.timestamp;
        }
        _;
    }
    
    function archiveState(address user) internal {
        archivedState[user] = serializeState(user);
        deleteActiveState(user);
    }
}
```

### Pattern: Witness-Guided Execution

**Context**: Stateless clients need to verify transactions.

**Solution**:
```
Transaction = {
    operations: [...],
    witness: {
        pre_state: {...},
        merkle_proofs: [...],
        post_state: {...}
    }
}

Verify: Apply operations to pre_state, check post_state matches
```

### Antipattern: Unbounded State Growth

**Problem**: Allowing unlimited state accumulation.

**Manifestation**:
```solidity
// DON'T DO THIS
mapping(uint => Data) public allDataEver;  // Never deleted
Data[] public growingForever;               // Only appends

// Result: State size → ∞
```

**Correct Pattern**: Implement state rent, pruning, or archival.

---

## Section III: Network Patterns

### Pattern: Epidemic Gossip with Reconciliation

**Context**: Disseminate information efficiently in P2P network.

**Solution**:
```
On receiving message m:
    if unseen(m):
        process(m)
        for peer in sample(peers, √n):
            send(peer, m)
    
Periodically:
    peer = random(peers)
    diff = symmetric_difference(my_messages, peer_messages)
    exchange(peer, diff)
```

**Analysis**: Messages reach all nodes in O(log n) rounds.

### Pattern: Adaptive Peer Selection

**Context**: Optimize peer connections for performance.

**Solution**:
```go
type PeerSelector struct {
    scores map[PeerID]float64
}

func (ps *PeerSelector) UpdateScore(peer PeerID, latency time.Duration, success bool) {
    old := ps.scores[peer]
    
    reward := 0.0
    if success {
        reward = 1.0 / (1.0 + latency.Seconds())
    } else {
        reward = -1.0
    }
    
    // Exponential moving average
    ps.scores[peer] = 0.9*old + 0.1*reward
}

func (ps *PeerSelector) SelectPeers(n int) []PeerID {
    // Thompson sampling
    selected := []PeerID{}
    for i := 0; i < n; i++ {
        peer := ps.thompsonSample()
        selected = append(selected, peer)
    }
    return selected
}
```

### Pattern: Network Partition Healing

**Context**: Recover from network splits.

**Solution**:
```
Phase 1: Detect partition
    - Monitor peer connectivity
    - Detect sudden drops

Phase 2: Maintain partition state
    - Continue local consensus
    - Queue cross-partition messages

Phase 3: Heal partition
    - Exchange partition histories
    - Merge compatible histories
    - Fork if incompatible
```

### Antipattern: Hub-and-Spoke Topology

**Problem**: Centralized network structure.

```
     Hub
    / | \
   /  |  \
  N₁  N₂  N₃
```

**Why It Fails**: Single point of failure, congestion, censorship.

**Correct Pattern**: Mesh or structured overlay.

---

## Section IV: Cryptographic Patterns

### Pattern: Commit-Reveal for Fair Ordering

**Context**: Prevent front-running and MEV.

**Solution**:
```
Phase 1 (Commit): 
    commitment = H(transaction || nonce)
    submit(commitment)

Phase 2 (Reveal):
    reveal(transaction, nonce)
    verify(H(transaction || nonce) == commitment)
    
Phase 3 (Execute):
    order = sort_by_commitment_hash(transactions)
    execute_in_order(order)
```

### Pattern: Threshold Signatures with Key Refresh

**Context**: Distributed key management with recovery.

**Solution**:
```
Setup: 
    secret s → shares s₁, s₂, ..., sₙ
    threshold t where t < n

Sign:
    signatures σᵢ from t participants
    combine(σ₁, ..., σₜ) → signature

Refresh (periodic):
    new_shares = refresh_protocol(old_shares)
    // Same secret, new shares
```

### Pattern: Zero-Knowledge State Transitions

**Context**: Privacy-preserving state updates.

**Solution**:
```rust
struct StateTransition {
    old_state_commitment: Hash,
    new_state_commitment: Hash,
    proof: ZKProof,
}

impl StateTransition {
    fn verify(&self) -> bool {
        verify_proof(
            self.proof,
            public_inputs![
                self.old_state_commitment,
                self.new_state_commitment
            ]
        )
    }
}
```

### Antipattern: Reusing Nonces

**Problem**: Using same nonce across different contexts.

```
// DON'T DO THIS
nonce = current_timestamp()
sig1 = sign(msg1, nonce)
sig2 = sign(msg2, nonce)  // Same nonce!
```

**Consequence**: Reveals private key through linear algebra.

**Correct Pattern**: Unique nonce per signature.

---

## Section V: Economic Patterns

### Pattern: Progressive Fee Escalation

**Context**: Manage congestion without pricing out users.

**Solution**:
```
base_fee(usage) = {
    minimal         if usage < 50%
    linear growth   if 50% < usage < 80%
    exponential     if usage > 80%
}

priority_fee = user_bid
total_fee = base_fee + priority_fee
```

### Pattern: Quadratic Funding

**Context**: Democratic allocation of resources.

**Solution**:
```
funding = (Σ√contribution_i)²

Example:
    100 people give $1 each: (100 × 1)² = $10,000
    1 person gives $100: (1 × 10)² = $100
```

**Benefits**: Favors broad support over concentrated wealth.

### Pattern: Bonding Curves for Liquidity

**Context**: Automated market making without order books.

**Solution**:
```
price = f(supply)

Common curves:
    Linear: p = a × supply
    Exponential: p = a × e^(b×supply)
    Sigmoid: p = L / (1 + e^(-k(supply - x₀)))
```

### Antipattern: Fixed Block Rewards Forever

**Problem**: Infinite inflation, no fee sustainability.

```
Block N: reward = 50
Block 2N: reward = 50
Block ∞: reward = 50
```

**Consequence**: Hyperinflation, security budget crisis.

**Correct Pattern**: Decreasing emissions with fee transition.

---

## Section VI: Governance Patterns

### Pattern: Time-Locked Governance

**Context**: Prevent governance attacks while enabling upgrades.

**Solution**:
```solidity
contract TimeLockGovernance {
    uint constant DELAY = 7 days;
    uint constant VETO_PERIOD = 2 days;
    
    struct Proposal {
        bytes callData;
        uint executeTime;
        bool executed;
        bool vetoed;
    }
    
    function propose(bytes calldata data) external {
        proposals[id] = Proposal({
            callData: data,
            executeTime: block.timestamp + DELAY,
            executed: false,
            vetoed: false
        });
    }
    
    function execute(uint id) external {
        Proposal storage p = proposals[id];
        require(block.timestamp >= p.executeTime);
        require(block.timestamp < p.executeTime + VETO_PERIOD);
        require(!p.vetoed && !p.executed);
        
        p.executed = true;
        (bool success,) = address(this).call(p.callData);
        require(success);
    }
}
```

### Pattern: Futarchy Markets

**Context**: Decision making through prediction markets.

**Solution**:
```
For decision D:
    Market 1: Value if D accepted
    Market 2: Value if D rejected
    
Decision = argmax(market_price)
Settle winning market, refund losing market
```

### Pattern: Rage Quit Protection

**Context**: Allow exit before controversial changes.

**Solution**:
```solidity
contract RageQuit {
    uint quitDeadline;
    bool controversial_upgrade_pending;
    
    function proposeUpgrade() external {
        controversial_upgrade_pending = true;
        quitDeadline = block.timestamp + 30 days;
    }
    
    function rageQuit() external {
        require(block.timestamp < quitDeadline);
        require(controversial_upgrade_pending);
        
        uint share = calculateShare(msg.sender);
        transfer(msg.sender, share);
        burnGovernanceTokens(msg.sender);
    }
}
```

### Antipattern: Plutocracy

**Problem**: Wealth equals power.

```
voting_power = token_balance

Result:
    Whales control everything
    Small holders disenfranchised
    Governance capture by few
```

**Correct Pattern**: Quadratic voting, reputation systems, or hybrid models.

---

## Section VII: Security Patterns

### Pattern: Defense in Depth

**Context**: Multiple security layers.

**Implementation**:
```
Layer 1: Input validation
Layer 2: Access control  
Layer 3: Rate limiting
Layer 4: Monitoring
Layer 5: Circuit breakers
Layer 6: Recovery procedures
```

### Pattern: Invariant Checking

**Context**: Ensure system properties always hold.

**Solution**:
```solidity
modifier checkInvariants() {
    _;
    
    // Post-execution checks
    assert(totalSupply == sumOfBalances());
    assert(reserveRatio() >= MIN_RESERVE);
    assert(address(this).balance >= totalDeposits);
}
```

### Pattern: Emergency Pause with Gradual Resume

**Context**: Stop damage while investigating.

**Solution**:
```solidity
contract EmergencyPause {
    bool public paused;
    uint public pausedAt;
    uint public resumeAt;
    
    function pause() external onlyGuardian {
        paused = true;
        pausedAt = block.timestamp;
        resumeAt = pausedAt + INVESTIGATION_PERIOD;
    }
    
    function resume() external {
        require(block.timestamp >= resumeAt);
        paused = false;
    }
    
    modifier whenNotPaused() {
        require(!paused || block.timestamp >= resumeAt);
        _;
    }
}
```

### Antipattern: Security Through Obscurity

**Problem**: Hiding code thinking it provides security.

```
"Our consensus algorithm is proprietary"
"Smart contract source is closed"
"Security audit is confidential"
```

**Why It Fails**: Decompilation, reverse engineering, insider threats.

**Correct Pattern**: Open source with formal verification.

---

## Section VIII: Scaling Patterns

### Pattern: State Channels with Watchtowers

**Context**: Off-chain scaling with security.

**Solution**:
```
Channel State:
    participants: [A, B]
    balances: [100, 50]
    nonce: 42
    signatures: [sig_A, sig_B]

Watchtower:
    monitors: blockchain
    stores: latest_states
    action: submit fraud proof if old state published
```

### Pattern: Optimistic Rollups with Fast Withdrawals

**Context**: L2 scaling with capital efficiency.

**Solution**:
```
Normal withdrawal: 7 day challenge period

Fast withdrawal:
    1. User requests withdrawal
    2. Liquidity provider fronts funds
    3. LP claims withdrawal after challenge period
    4. User pays small fee for immediacy
```

### Pattern: Data Availability Sampling

**Context**: Verify data availability without downloading all.

**Solution**:
```
Data → Erasure code → 2n chunks (any n reconstruct)

Each light client:
    Sample k random chunks
    If all k available, assume all available
    
Probability of unavailable data passing:
    P(fail) = (1/2)^k
```

### Antipattern: Unbounded Parallelism

**Problem**: Assuming infinite parallelization.

```
// DON'T DO THIS
async function processAll(transactions) {
    return Promise.all(
        transactions.map(tx => process(tx))
    );  // Memory explosion, no backpressure
}
```

**Correct Pattern**: Bounded concurrency with backpressure.

---

## Section IX: Interoperability Patterns

### Pattern: Hash Time-Locked Contracts

**Context**: Atomic swaps across chains.

**Solution**:
```
Alice (Chain A → Chain B):
    secret = random()
    hash = H(secret)
    lock_funds(hash, timeout=48h)

Bob (Chain B → Chain A):
    see hash on Chain A
    lock_funds(hash, timeout=24h)
    
Alice:
    reveal(secret) on Chain B
    claim Bob's funds
    
Bob:
    see secret on Chain B
    reveal(secret) on Chain A
    claim Alice's funds
```

### Pattern: Light Client Bridges

**Context**: Verify other chain's state.

**Solution**:
```rust
struct LightClient {
    validator_set: ValidatorSet,
    latest_header: Header,
    headers: MerkleTree<Header>,
}

impl LightClient {
    fn verify_proof(&self, proof: Proof) -> bool {
        // Verify signatures
        let signatures_valid = self.validator_set
            .verify(proof.header, proof.signatures);
        
        // Verify ancestry
        let ancestry_valid = self.headers
            .verify_path(proof.header, proof.path);
        
        signatures_valid && ancestry_valid
    }
}
```

### Pattern: Message Relayers with Incentives

**Context**: Cross-chain message delivery.

**Solution**:
```
Relayer stakes collateral
User pays fee for message delivery

Success: Relayer gets fee + collateral back
Failure: Collateral slashed, user refunded
Timeout: User can claim collateral
```

### Antipattern: Trusted Bridges

**Problem**: Centralized bridge operators.

```
Bridge controlled by:
    - Multisig of 3 people
    - Single company
    - Upgradeable proxy
    
Result: $600M hack (Ronin), $325M hack (Wormhole)
```

**Correct Pattern**: Trustless light client verification.

---

## Section X: Meta-Patterns

### Pattern: Progressive Decentralization

**Context**: Bootstrap network with training wheels.

**Stages**:
```
Stage 0: Centralized prototype
Stage 1: Federated validators
Stage 2: Permissioned participation
Stage 3: Permissionless with guards
Stage 4: Fully decentralized
```

### Pattern: Graceful Degradation

**Context**: Maintain service under adverse conditions.

**Implementation**:
```
if (optimal_conditions) {
    full_functionality()
} else if (degraded_conditions) {
    essential_functions_only()
} else if (emergency_conditions) {
    safety_mode()
} else {
    halt_and_catch_fire()
}
```

### Pattern: Evolutionary Architecture

**Context**: System must adapt to unknown future.

**Principles**:
```
1. Modular components (can replace parts)
2. Stable interfaces (backward compatibility)
3. Feature flags (gradual rollout)
4. Metrics driven (measure everything)
5. Rollback capability (undo mistakes)
```

### The Ultimate Antipattern: Premature Optimization

**Problem**: Optimizing before understanding.

```
"We need 1M TPS from day one"
"Let's use quantum-resistant crypto now"
"We'll shard across 1024 chains"
```

**Why It Fails**: Complexity, bugs, maintenance burden.

**Correct Pattern**: 
```
1. Make it work
2. Make it right  
3. Make it fast
```

---

## Conclusion: The Wisdom of Patterns

Patterns are not rules but heuristics. They encode the collective wisdom of those who have built before us. But context is king - yesterday's pattern may be today's antipattern.

The art lies not in memorizing patterns but in recognizing when to apply them, when to adapt them, and when to abandon them entirely.

Study patterns to understand principles.
Apply principles to solve problems.
From solved problems, new patterns emerge.

The cycle continues.

---

## A Pattern Language for Blockchain

Just as Christopher Alexander created a pattern language for architecture, we need a pattern language for blockchain:

**Large Scale Patterns**:
- Network topology
- Consensus mechanism  
- Economic model

**Medium Scale Patterns**:
- State management
- Message passing
- Governance structure

**Small Scale Patterns**:
- Data structures
- Cryptographic primitives
- API design

Each pattern connects to others, forming a language that lets us describe and build complex systems from simple, composable parts.

---

*"Each pattern describes a problem which occurs over and over again in our environment, and then describes the core of the solution to that problem, in such a way that you can use this solution a million times over, without ever doing it the same way twice."*

The same is true for blockchain. The patterns remain; their expressions evolve.

Build with patterns.
Break patterns when needed.
Create new patterns from the pieces.

This is the way.