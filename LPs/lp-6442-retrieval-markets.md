---
lp: 6442
title: LuxDA Retrieval Markets
description: LuxDA Retrieval Markets specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines the retrieval market for LuxDA, enabling economic incentives for long-term storage and bandwidth provision. Store providers earn fees for serving data beyond the guaranteed retention period.

## Motivation

Beyond protocol-guaranteed retention, users need:

1. **Extended Storage**: Keep data for years, not days
2. **Bandwidth Incentives**: Reward providers for serving data
3. **Quality of Service**: Premium retrieval performance
4. **Geographic Distribution**: Data closer to users

## Specification

### 1. Market Structure

#### 1.1 Roles

| Role | Description | Requirements |
|------|-------------|--------------|
| Client | Pays for storage/retrieval | LUX tokens |
| Provider | Stores and serves data | Storage, bandwidth, stake |
| Indexer | Tracks provider inventory | Query service |

#### 1.2 Service Types

```go
type ServiceType uint8

const (
    ServiceStorage    ServiceType = 1  // Store data for duration
    ServiceRetrieval  ServiceType = 2  // Serve data on demand
    ServicePinning    ServiceType = 3  // Keep data available
    ServiceReplication ServiceType = 4 // Replicate to locations
)
```

### 2. Storage Deals

#### 2.1 Deal Structure

```go
type StorageDeal struct {
    // Identification
    DealID       [32]byte
    Client       Identity
    Provider     Identity

    // Content
    CID          *CID
    Size         uint64
    Replicas     uint8

    // Terms
    StartTime    uint64
    Duration     uint64
    PricePerByte uint64  // Per byte per epoch
    TotalPrice   *big.Int

    // Payment
    PaymentMethod PaymentMethod
    Collateral    *big.Int

    // State
    Status       DealStatus
}

type DealStatus uint8
const (
    DealProposed DealStatus = 0
    DealAccepted DealStatus = 1
    DealActive   DealStatus = 2
    DealExpired  DealStatus = 3
    DealFailed   DealStatus = 4
)
```

#### 2.2 Deal Lifecycle

```
Client Proposes Deal
         ↓
Provider Evaluates
         ↓
Provider Accepts / Rejects
         ↓
Client Funds Escrow
         ↓
Deal Active
         ↓
Provider Proves Storage (periodic)
         ↓
Deal Expires → Funds Released
    OR
Provider Fails Proof → Slashed
```

#### 2.3 Deal Proposal

```go
type DealProposal struct {
    CID           *CID
    Size          uint64
    Duration      uint64
    MaxPrice      uint64
    MinReplicas   uint8
    Locations     []string  // Preferred regions
    StartDeadline uint64    // Must start by this time
    ClientSig     []byte
}

func (c *Client) ProposeDeal(proposal *DealProposal) (*DealID, error) {
    // Find matching providers
    providers := c.Indexer.FindProviders(proposal)

    // Request quotes
    quotes := make([]*Quote, 0)
    for _, provider := range providers {
        quote, err := provider.RequestQuote(proposal)
        if err == nil && quote.Price <= proposal.MaxPrice {
            quotes = append(quotes, quote)
        }
    }

    // Select best quotes
    selected := selectBestQuotes(quotes, proposal.MinReplicas)

    // Create deals
    var dealID [32]byte
    for _, quote := range selected {
        deal := createDeal(proposal, quote)
        dealID = deal.DealID
        c.submitDeal(deal)
    }

    return &dealID, nil
}
```

### 3. Retrieval Protocol

#### 3.1 Retrieval Request

```go
type RetrievalRequest struct {
    CID         *CID
    Offset      uint64  // For range requests
    Length      uint64
    MaxPrice    uint64  // Max price per byte
    ClientID    Identity
    Nonce       [32]byte
    Signature   []byte
}

type RetrievalResponse struct {
    RequestID   [32]byte
    Status      RetrievalStatus
    Price       uint64
    Data        []byte
    Proof       []byte  // Payment proof or merkle proof
}
```

#### 3.2 Payment Channels

For efficient micropayments:

```go
type PaymentChannel struct {
    ChannelID   [32]byte
    Client      Identity
    Provider    Identity
    Capacity    *big.Int
    Spent       *big.Int
    Expiry      uint64
}

type PaymentVoucher struct {
    ChannelID   [32]byte
    Amount      *big.Int  // Cumulative amount
    Signature   []byte
}

func (c *PaymentChannel) CreateVoucher(amount *big.Int) *PaymentVoucher {
    newSpent := new(big.Int).Add(c.Spent, amount)
    return &PaymentVoucher{
        ChannelID: c.ChannelID,
        Amount:    newSpent,
        Signature: c.Client.Sign(c.ChannelID, newSpent),
    }
}
```

#### 3.3 Retrieval Flow

```python
def retrieve_data(cid, client):
    # 1. Find providers
    providers = indexer.find_providers(cid)

    # 2. Get quotes
    best_quote = min(
        (p.get_quote(cid) for p in providers),
        key=lambda q: q.price
    )

    # 3. Open or reuse payment channel
    channel = client.get_channel(best_quote.provider)
    if not channel or channel.capacity < best_quote.total_price:
        channel = client.open_channel(best_quote.provider, deposit)

    # 4. Stream retrieval with incremental payment
    data = []
    for chunk in best_quote.provider.stream_data(cid):
        # Verify chunk
        if not verify_chunk(chunk, cid):
            raise InvalidChunk()

        # Pay for chunk
        voucher = channel.create_voucher(chunk.size * best_quote.price_per_byte)
        best_quote.provider.receive_voucher(voucher)

        data.append(chunk.data)

    return b''.join(data)
```

### 4. Pricing

#### 4.1 Price Discovery

```go
type PriceOracle struct {
    // Historical prices
    StoragePrices   []PricePoint
    RetrievalPrices []PricePoint

    // Current market rates
    CurrentStorage   uint64  // Per GB per month
    CurrentRetrieval uint64  // Per GB served
}

func (po *PriceOracle) GetStoragePrice(size uint64, duration uint64) *big.Int {
    // Base price from market
    basePrice := po.CurrentStorage * size / (1024 * 1024 * 1024)

    // Duration multiplier
    months := duration / (30 * 24 * 3600)
    totalPrice := basePrice * months

    return big.NewInt(int64(totalPrice))
}
```

#### 4.2 Provider Pricing

```go
type ProviderPricing struct {
    // Storage pricing
    StoragePerGBMonth uint64

    // Retrieval pricing
    RetrievalPerGB    uint64
    BandwidthTiers    []BandwidthTier

    // Minimum deal size
    MinDealSize uint64
    MinDuration uint64
}

type BandwidthTier struct {
    MaxBandwidth uint64  // Bytes per second
    PriceMultiplier float64
}
```

### 5. Proofs

#### 5.1 Storage Proofs

Providers must prove they still have data:

```go
type StorageProof struct {
    DealID      [32]byte
    Epoch       uint64
    Challenge   [32]byte  // Random challenge from chain
    Response    []byte    // Proof of data possession
    Signature   []byte
}

func GenerateStorageProof(deal *StorageDeal, challenge [32]byte) (*StorageProof, error) {
    // Select random chunks based on challenge
    chunkIndices := deriveChunkIndices(challenge, deal.CID)

    // Generate merkle proof for chunks
    proofData := make([]byte, 0)
    for _, idx := range chunkIndices {
        chunk := loadChunk(deal.CID, idx)
        proofData = append(proofData, chunk...)
    }

    return &StorageProof{
        DealID:    deal.DealID,
        Epoch:     currentEpoch(),
        Challenge: challenge,
        Response:  sha3.Sum256(proofData),
    }, nil
}
```

#### 5.2 Delivery Proofs

```go
type DeliveryProof struct {
    RequestID     [32]byte
    CID           *CID
    BytesDelivered uint64
    ClientSig     []byte  // Client confirms receipt
    ProviderSig   []byte
}
```

### 6. Slashing

#### 6.1 Slashing Conditions

| Condition | Penalty |
|-----------|---------|
| Failed storage proof | 5% collateral |
| Repeated proof failures | 100% collateral + deal termination |
| Data unavailable | Proportional to remaining deal |
| Invalid data served | 10% collateral |

#### 6.2 Dispute Resolution

```go
type Dispute struct {
    DisputeID   [32]byte
    DealID      [32]byte
    Claimant    Identity
    Type        DisputeType
    Evidence    []byte
    Status      DisputeStatus
}

func ResolveDispute(dispute *Dispute) Resolution {
    switch dispute.Type {
    case DisputeDataUnavailable:
        // Request data from provider
        data, err := provider.RequestData(dispute.DealID)
        if err != nil {
            return SlashProvider(dispute.DealID)
        }
        // Verify data matches deal
        if !verifyData(data, dispute.DealID) {
            return SlashProvider(dispute.DealID)
        }
        return DismissDispute()

    case DisputeInvalidData:
        // Verify evidence
        if verifyInvalidDataEvidence(dispute.Evidence) {
            return SlashProvider(dispute.DealID)
        }
        return DismissDispute()
    }
}
```

### 7. Provider Registration

#### 7.1 Registration

```go
type ProviderRegistration struct {
    ProviderID  Identity
    Endpoints   []string
    Capacity    ProviderCapacity
    Stake       *big.Int
    Pricing     ProviderPricing
    Regions     []string
    Signature   []byte
}

type ProviderCapacity struct {
    StorageBytes     uint64
    BandwidthBps     uint64
    MaxDeals         uint32
    MinDealSize      uint64
}

func (r *Registry) RegisterProvider(reg *ProviderRegistration) error {
    // Verify stake
    if reg.Stake.Cmp(MinProviderStake) < 0 {
        return ErrInsufficientStake
    }

    // Lock stake
    if err := r.StakeContract.Lock(reg.ProviderID, reg.Stake); err != nil {
        return err
    }

    // Register
    r.Providers[reg.ProviderID] = reg
    return nil
}
```

#### 7.2 Reputation

```go
type ProviderReputation struct {
    TotalDeals       uint64
    SuccessfulDeals  uint64
    FailedDeals      uint64
    TotalBytesServed uint64
    AverageLatency   float64
    UptimeRatio      float64
}

func (r *Registry) GetReputation(providerID Identity) *ProviderReputation {
    // Calculate from on-chain history
    return calculateReputation(providerID)
}
```

### 8. Indexer Service

#### 8.1 Provider Index

```go
type Indexer struct {
    // CID -> Providers mapping
    ContentIndex map[*CID][]Identity

    // Provider -> Capabilities
    ProviderIndex map[Identity]*ProviderRegistration
}

func (i *Indexer) FindProviders(cid *CID) []Identity {
    return i.ContentIndex[cid]
}

func (i *Indexer) AnnounceContent(provider Identity, cids []*CID) error {
    for _, cid := range cids {
        i.ContentIndex[cid] = append(i.ContentIndex[cid], provider)
    }
    return nil
}
```

### 9. Metrics

| Metric | Description |
|--------|-------------|
| `market_deals_active` | Active storage deals |
| `market_deals_value` | Total value locked |
| `market_retrieval_volume` | Bytes retrieved |
| `market_provider_count` | Registered providers |
| `market_average_price` | Average price per GB |

## Rationale

### Why Payment Channels?

- Micropayments impractical on-chain
- Low latency for streaming retrieval
- Reduce transaction costs

### Why Storage Proofs?

- Verify providers actually store data
- Enable automated dispute resolution
- Create accountability

### Why Provider Reputation?

- Help clients choose reliable providers
- Incentivize good behavior
- Market-based quality assurance

## Backwards Compatibility

This specification introduces new functionality and does not modify existing protocols. It is fully backwards compatible with existing implementations.

## Security Considerations

### Collusion

Providers and clients could collude:
- Mitigated by random challenges
- Slashing makes collusion costly

### Sybil Attacks

Fake providers to manipulate market:
- Stake requirement raises cost
- Reputation tracks real performance

### Data Ransom

Provider refuses to serve unless paid more:
- Deal terms are binding
- Slashing for non-delivery
- Replication provides alternatives

## Test Plan

### Unit Tests

1. **Deal Lifecycle**: Propose → Accept → Complete
2. **Payment Channels**: Open, use, close
3. **Storage Proofs**: Generate and verify

### Integration Tests

1. **Full Retrieval**: End-to-end payment + data
2. **Dispute Resolution**: Challenge and response
3. **Market Dynamics**: Multiple providers competing

### Economic Tests

1. **Price Discovery**: Market equilibrium
2. **Incentive Alignment**: Provider behavior
3. **Attack Resistance**: Sybil, collusion

## References

- [Filecoin Markets](https://spec.filecoin.io/systems/filecoin_markets/)
- [IPFS Pinning Services](https://docs.ipfs.tech/concepts/pinning/)
- [Payment Channels](https://ethereum.org/en/developers/docs/scaling/payment-channels/)

---

*LP-6442 v1.0.0 - 2026-01-02*
