# LP-606: Cross-Chain Messaging Protocol (Warp)

## Overview

LP-606 standardizes cross-chain messaging across Lux, Zoo, and Hanzo chains using the Warp protocol. This ensures exactly one way to send authenticated messages between chains, enabling composable cross-chain applications.

## Motivation

Current cross-chain communication challenges:
- **Message Authentication**: Verifying cross-chain messages
- **Replay Protection**: Preventing message replay attacks
- **Atomicity**: Ensuring all-or-nothing execution
- **Latency**: Slow cross-chain confirmations

Our solution provides:
- **BLS Aggregation**: Efficient signature aggregation
- **Verkle Proofs**: Constant-size state proofs
- **Native Integration**: Built into consensus layer
- **Sub-second Messaging**: Fast finality with FPC

## Technical Specification

### Unified Warp Message Format

```go
package warp

import (
    "github.com/luxfi/lux/crypto/bls"
    "github.com/luxfi/lux/verkle"
)

// WarpMessage - EXACTLY ONE message format for all chains
type WarpMessage struct {
    // Message metadata
    SourceChainID      uint64  // 120, 121, or 122
    DestinationChainID uint64  // 120, 121, or 122
    Nonce             uint64  // Replay protection
    
    // Message content
    Payload           []byte
    
    // Authentication
    Signature         BLSSignature
}

// UnsignedMessage before signing
type UnsignedMessage struct {
    SourceChainID      uint64
    DestinationChainID uint64
    Nonce             uint64
    Payload           []byte
    
    // Cached values
    id    Hash
    bytes []byte
}

// BLSSignature for efficient aggregation
type BLSSignature struct {
    Signers   BitSet       // Which validators signed
    Signature []byte       // Aggregated BLS signature
    PublicKey []byte       // Aggregated public key
}

// MessageType enumeration
type MessageType uint8

const (
    // Core message types
    TypeTransfer    MessageType = 0  // Asset transfer
    TypeCall        MessageType = 1  // Contract call
    TypeState       MessageType = 2  // State sync
    TypeValidator   MessageType = 3  // Validator updates
    
    // LP-specific types
    TypeJob         MessageType = 10 // AI job submission
    TypeReceipt     MessageType = 11 // Compute receipt
    TypeRoyalty     MessageType = 12 // Royalty payment
)

// WarpCodec for serialization - SINGLE codec
var WarpCodec = NewCodec()
```

### Message Authentication (LP-118)

```go
// LP118Handler manages signature aggregation
type LP118Handler struct {
    validators ValidatorSet
    aggregator *SignatureAggregator
    verifier   *WarpVerifier
}

// SignatureAggregator combines validator signatures
type SignatureAggregator struct {
    threshold   float64  // 67% default
    timeout     time.Duration
    signatures  map[Hash]*PartialSig
}

// AggregateSignatures combines signatures efficiently
func (a *SignatureAggregator) AggregateSignatures(
    msg *UnsignedMessage,
    sigs []*PartialSig,
) (*BLSSignature, error) {
    // Check threshold
    totalWeight := uint64(0)
    for _, sig := range sigs {
        totalWeight += sig.Weight
    }
    
    if float64(totalWeight) < float64(a.validators.TotalWeight()) * a.threshold {
        return nil, ErrInsufficientSignatures
    }
    
    // Aggregate BLS signatures
    aggSig := bls.AggregateSignatures(sigs)
    aggPubKey := bls.AggregatePublicKeys(sigs)
    
    return &BLSSignature{
        Signers:   a.getSignerBitset(sigs),
        Signature: aggSig,
        PublicKey: aggPubKey,
    }, nil
}

// VerifyMessage validates cross-chain message
func (v *WarpVerifier) VerifyMessage(
    msg *WarpMessage,
    sourceValidators ValidatorSet,
) error {
    // Verify source chain
    if msg.SourceChainID != 120 && msg.SourceChainID != 121 && msg.SourceChainID != 122 {
        return ErrInvalidSourceChain
    }
    
    // Verify BLS signature
    msgBytes := msg.UnsignedBytes()
    valid := bls.Verify(
        msg.Signature.PublicKey,
        msgBytes,
        msg.Signature.Signature,
    )
    
    if !valid {
        return ErrInvalidSignature
    }
    
    // Check weight threshold
    signedWeight := sourceValidators.GetWeight(msg.Signature.Signers)
    if signedWeight < sourceValidators.Threshold() {
        return ErrInsufficientWeight
    }
    
    return nil
}
```

### Cross-Chain Router

```solidity
// SINGLE router contract deployed at SAME address on ALL chains
contract WarpRouter {
    // Chain configuration
    mapping(uint256 => ChainConfig) public chains;
    
    // Message tracking
    mapping(bytes32 => MessageStatus) public messages;
    
    // Nonce tracking for replay protection
    mapping(uint256 => mapping(address => uint256)) public nonces;
    
    struct ChainConfig {
        address gateway;     // Chain gateway contract
        uint256 chainId;     // 120, 121, or 122
        bool active;
    }
    
    struct MessageStatus {
        bool sent;
        bool received;
        bool executed;
        uint256 timestamp;
    }
    
    event MessageSent(
        uint256 indexed destChainId,
        bytes32 indexed messageId,
        bytes payload
    );
    
    event MessageReceived(
        uint256 indexed sourceChainId,
        bytes32 indexed messageId,
        bytes payload
    );
    
    // Send cross-chain message
    function sendMessage(
        uint256 destChainId,
        bytes calldata payload
    ) external returns (bytes32 messageId) {
        require(chains[destChainId].active, "Invalid destination");
        
        // Create unsigned message
        UnsignedMessage memory msg = UnsignedMessage({
            sourceChainId: block.chainid,
            destinationChainId: destChainId,
            nonce: nonces[block.chainid][msg.sender]++,
            payload: payload
        });
        
        messageId = keccak256(abi.encode(msg));
        
        // Mark as sent
        messages[messageId] = MessageStatus({
            sent: true,
            received: false,
            executed: false,
            timestamp: block.timestamp
        });
        
        emit MessageSent(destChainId, messageId, payload);
        
        // Trigger validator signing
        _requestSignatures(msg);
    }
    
    // Receive cross-chain message
    function receiveMessage(
        WarpMessage calldata message,
        bytes calldata proof
    ) external {
        bytes32 messageId = keccak256(abi.encode(message));
        
        require(!messages[messageId].received, "Already received");
        require(message.destinationChainId == block.chainid, "Wrong chain");
        
        // Verify BLS signature
        require(
            _verifyBLSSignature(message, proof),
            "Invalid signature"
        );
        
        // Mark as received
        messages[messageId].received = true;
        messages[messageId].timestamp = block.timestamp;
        
        emit MessageReceived(
            message.sourceChainId,
            messageId,
            message.payload
        );
        
        // Execute if contract call
        if (_isContractCall(message.payload)) {
            _executeMessage(message);
        }
    }
}
```

### Native Chain Integration

```go
// WarpVM adds cross-chain support to VM
type WarpVM interface {
    VM
    
    // GetMessageSignature signs outgoing message
    GetMessageSignature(msg *UnsignedMessage) (*BLSSignature, error)
    
    // VerifyMessageSignature verifies incoming message
    VerifyMessageSignature(msg *WarpMessage) error
    
    // GetBlockSignature for block-level messages
    GetBlockSignature(blockID Hash) (*BLSSignature, error)
}

// WarpBackend implements cross-chain messaging
type WarpBackend struct {
    vm        WarpVM
    validators ValidatorSet
    aggregator *LP118Handler
}

// SendWarpMessage initiates cross-chain message
func (w *WarpBackend) SendWarpMessage(
    destChainID uint64,
    payload []byte,
) (*WarpMessage, error) {
    // Create unsigned message
    unsignedMsg := &UnsignedMessage{
        SourceChainID:      w.vm.ChainID(),
        DestinationChainID: destChainID,
        Nonce:             w.getNextNonce(),
        Payload:           payload,
    }
    
    // Get validator signatures
    sig, err := w.aggregator.GetAggregatedSignature(unsignedMsg)
    if err != nil {
        return nil, err
    }
    
    // Create signed message
    return &WarpMessage{
        UnsignedMessage: *unsignedMsg,
        Signature:       *sig,
    }, nil
}
```

### Cross-Chain State Proofs

```go
// StateProof for cross-chain state verification
type StateProof struct {
    SourceChain   uint64
    BlockHeight   uint64
    StateRoot     Hash
    
    // Verkle proof for constant size
    VerkleProof   *verkle.Proof
    
    // BLS signature from validators
    Signature     *BLSSignature
}

// VerifyStateProof validates cross-chain state
func VerifyStateProof(
    proof *StateProof,
    key []byte,
    expectedValue []byte,
) error {
    // Verify Verkle proof
    valid := verkle.VerifyProof(
        proof.VerkleProof,
        proof.StateRoot,
        key,
        expectedValue,
    )
    
    if !valid {
        return ErrInvalidStateProof
    }
    
    // Verify validator signatures
    validators := GetValidatorSet(proof.SourceChain)
    return VerifyBLSSignature(
        proof.Signature,
        proof.StateRoot[:],
        validators,
    )
}
```

### Message Relaying

```go
// MessageRelayer handles cross-chain relay
type MessageRelayer struct {
    chains    map[uint64]Chain
    messages  chan *WarpMessage
    workers   int
}

// RelayMessage sends message to destination
func (r *MessageRelayer) RelayMessage(msg *WarpMessage) error {
    destChain := r.chains[msg.DestinationChainID]
    if destChain == nil {
        return ErrUnknownChain
    }
    
    // Submit to destination chain
    tx := &MessageTx{
        Message: msg,
        GasPrice: r.estimateGas(msg),
    }
    
    receipt, err := destChain.SubmitTx(tx)
    if err != nil {
        return err
    }
    
    // Wait for confirmation
    return r.waitForConfirmation(receipt)
}

// AutoRelay continuously relays messages
func (r *MessageRelayer) AutoRelay() {
    for i := 0; i < r.workers; i++ {
        go r.relayWorker()
    }
}

func (r *MessageRelayer) relayWorker() {
    for msg := range r.messages {
        if err := r.RelayMessage(msg); err != nil {
            log.Error("Failed to relay", "err", err)
            // Retry logic
            r.messages <- msg
        }
    }
}
```

## Use Cases

### 1. Cross-Chain Token Transfer
```solidity
function bridgeTokens(
    uint256 destChain,
    address token,
    uint256 amount
) external {
    // Lock tokens on source chain
    IERC20(token).transferFrom(msg.sender, address(this), amount);
    
    // Create cross-chain message
    bytes memory payload = abi.encode(
        "TRANSFER",
        token,
        msg.sender,
        amount
    );
    
    // Send via Warp
    router.sendMessage(destChain, payload);
}
```

### 2. Cross-Chain AI Job Submission
```go
func SubmitCrossChainJob(
    job *JobSpec,
    targetChain uint64,
) error {
    // Encode job as Warp message
    payload := EncodeJob(job)
    
    msg, err := warp.SendMessage(
        targetChain,
        TypeJob,
        payload,
    )
    
    if err != nil {
        return err
    }
    
    // Track job across chains
    TrackCrossChainJob(msg.ID(), job.ID)
    return nil
}
```

## Security Considerations

1. **BLS Security**: 67% validator threshold for signatures
2. **Replay Protection**: Nonce tracking per sender
3. **Timeout Protection**: Message expiry after 24 hours
4. **Rate Limiting**: Max messages per block

## Performance Targets

- **Message Latency**: <3 seconds between chains
- **Signature Aggregation**: <100ms for 100 validators
- **Proof Size**: ~1KB with Verkle + BLS
- **Throughput**: 1000+ messages/second

## Testing

```go
func TestCrossChainMessage(t *testing.T) {
    // Setup three chains
    lux := NewChain(120)
    hanzo := NewChain(121)
    zoo := NewChain(122)
    
    // Send message from Lux to Hanzo
    msg := &UnsignedMessage{
        SourceChainID: 120,
        DestinationChainID: 121,
        Payload: []byte("test"),
    }
    
    // Get signatures
    sig, err := lux.SignMessage(msg)
    assert.NoError(t, err)
    
    // Verify on destination
    err = hanzo.VerifyMessage(&WarpMessage{
        UnsignedMessage: *msg,
        Signature: *sig,
    })
    assert.NoError(t, err)
}
```

## References

1. [Avalanche Warp Messaging](https://docs.avax.network/learn/avalanche/awm)
2. [BLS Signature Aggregation](https://crypto.stanford.edu/~dabo/pubs/papers/BLSmultisig.html)
3. [IBC Protocol](https://github.com/cosmos/ibc)

---

**Status**: Draft  
**Category**: Interoperability  
**Created**: 2025-01-09