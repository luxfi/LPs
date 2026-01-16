---
lp: 6441
title: LuxDA Content Addressing
description: LuxDA Content Addressing specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines a content-addressing system for LuxDA, enabling IPFS-like file storage with Merkle DAG manifests. Large files are chunked into blobs, organized into DAGs, and referenced by content identifiers (CIDs).

## Motivation

Many applications need to store files larger than single blob limits:

1. **Large Files**: Media, documents, datasets
2. **Deduplication**: Same content = same CID
3. **Incremental Updates**: Change only modified chunks
4. **Verifiable References**: CID proves content integrity

## Specification

### 1. Content Identifiers (CIDs)

#### 1.1 CID Structure

```go
type CID struct {
    Version  uint8     // CID version (1)
    Codec    uint64    // Multicodec (raw, dag-pb, dag-cbor)
    Hash     Multihash // Content hash
}

type Multihash struct {
    Code   uint64 // Hash algorithm code
    Digest []byte // Hash digest
}
```

Default configuration:
- Version: 1
- Codec: `dag-cbor` (0x71) for DAG nodes, `raw` (0x55) for leaf data
- Hash: SHA3-256 (0x16)

#### 1.2 CID Encoding

```go
func EncodeCID(cid *CID) string {
    // Multibase encode (base32)
    raw := append([]byte{cid.Version}, encodeVarint(cid.Codec)...)
    raw = append(raw, encodeMultihash(cid.Hash)...)
    return multibaseEncode(raw, "base32")
}

func DecodeCID(s string) (*CID, error) {
    raw, err := multibaseDecode(s)
    if err != nil {
        return nil, err
    }
    return parseCID(raw)
}
```

Example CID:
```
bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi
```

### 2. Merkle DAG Structure

#### 2.1 DAG Node Types

```go
type DAGNode interface {
    CID() *CID
    Links() []DAGLink
    Data() []byte
}

type DAGLink struct {
    Name   string // Optional name
    CID    *CID   // Target CID
    Size   uint64 // Cumulative size
}
```

#### 2.2 File DAG Layout

```
                    Root (File Manifest)
                    CID: Qm...root
                    /    |    \
                   /     |     \
              Chunk1  Chunk2  Chunk3
              CID:Qm1 CID:Qm2 CID:Qm3
```

#### 2.3 Directory DAG Layout

```
                    Root (Directory)
                    CID: Qm...dir
                    /      |      \
                   /       |       \
              file1.txt  file2.txt  subdir/
              CID:Qm1    CID:Qm2    CID:Qm3
                                      |
                                   file3.txt
                                   CID:Qm4
```

### 3. File Chunking

#### 3.1 Chunking Strategy

```go
type ChunkingStrategy interface {
    Chunk(reader io.Reader) ([][]byte, error)
}

// Fixed-size chunking
type FixedChunker struct {
    ChunkSize int
}

func (fc *FixedChunker) Chunk(reader io.Reader) ([][]byte, error) {
    var chunks [][]byte
    buf := make([]byte, fc.ChunkSize)

    for {
        n, err := io.ReadFull(reader, buf)
        if n > 0 {
            chunk := make([]byte, n)
            copy(chunk, buf[:n])
            chunks = append(chunks, chunk)
        }
        if err == io.EOF {
            break
        }
        if err != nil && err != io.ErrUnexpectedEOF {
            return nil, err
        }
    }

    return chunks, nil
}

// Content-defined chunking (Rabin fingerprint)
type RabinChunker struct {
    MinSize int
    AvgSize int
    MaxSize int
}

func (rc *RabinChunker) Chunk(reader io.Reader) ([][]byte, error) {
    rabin := NewRabinFingerprint(rc.AvgSize)
    // ... content-defined boundary detection
}
```

Default parameters:
- Minimum chunk: 256 KiB
- Average chunk: 1 MiB
- Maximum chunk: 2 MiB (MaxBlobSize)

### 4. Manifest Format

#### 4.1 File Manifest

```go
type FileManifest struct {
    // File metadata
    Name     string
    Size     uint64
    MimeType string

    // Chunking info
    ChunkStrategy string // "fixed" or "rabin"
    ChunkSize     uint32 // For fixed chunking

    // Content
    Chunks []ChunkRef
}

type ChunkRef struct {
    CID    *CID
    Offset uint64
    Size   uint32
}

// CBOR encoding
func (fm *FileManifest) Encode() []byte {
    return cbor.Marshal(fm)
}
```

#### 4.2 Directory Manifest

```go
type DirectoryManifest struct {
    // Directory metadata
    Name string

    // Entries
    Entries []DirEntry
}

type DirEntry struct {
    Name   string
    Type   EntryType // File, Directory, Symlink
    CID    *CID
    Size   uint64
    Mode   uint32
    Mtime  uint64
}
```

### 5. File Operations

#### 5.1 File Upload

```go
func (s *ContentStore) UploadFile(reader io.Reader, name string, opts *UploadOpts) (*CID, error) {
    // 1. Chunk the file
    chunker := selectChunker(opts)
    chunks, err := chunker.Chunk(reader)
    if err != nil {
        return nil, err
    }

    // 2. Store each chunk as a blob
    chunkRefs := make([]ChunkRef, len(chunks))
    offset := uint64(0)

    for i, chunk := range chunks {
        // Store in DA layer
        ref, err := s.DAClient.Put(context.Background(), chunk)
        if err != nil {
            return nil, err
        }

        chunkRefs[i] = ChunkRef{
            CID:    blobCommitmentToCID(ref.Commitment),
            Offset: offset,
            Size:   uint32(len(chunk)),
        }
        offset += uint64(len(chunk))
    }

    // 3. Create manifest
    manifest := &FileManifest{
        Name:          name,
        Size:          offset,
        ChunkStrategy: opts.ChunkStrategy,
        Chunks:        chunkRefs,
    }

    // 4. Store manifest as blob
    manifestBytes := manifest.Encode()
    manifestRef, err := s.DAClient.Put(context.Background(), manifestBytes)
    if err != nil {
        return nil, err
    }

    return blobCommitmentToCID(manifestRef.Commitment), nil
}
```

#### 5.2 File Download

```go
func (s *ContentStore) DownloadFile(cid *CID, writer io.Writer) error {
    // 1. Fetch manifest
    manifestBlob, err := s.DAClient.Get(context.Background(), cidToCommitment(cid))
    if err != nil {
        return err
    }

    manifest := &FileManifest{}
    if err := cbor.Unmarshal(manifestBlob, manifest); err != nil {
        return err
    }

    // 2. Fetch and write each chunk
    for _, chunkRef := range manifest.Chunks {
        chunk, err := s.DAClient.Get(context.Background(), cidToCommitment(chunkRef.CID))
        if err != nil {
            return err
        }

        if _, err := writer.Write(chunk); err != nil {
            return err
        }
    }

    return nil
}
```

#### 5.3 Partial Download (Range Request)

```go
func (s *ContentStore) DownloadRange(cid *CID, start, end uint64, writer io.Writer) error {
    // 1. Fetch manifest
    manifest, err := s.getManifest(cid)
    if err != nil {
        return err
    }

    // 2. Find relevant chunks
    for _, chunkRef := range manifest.Chunks {
        chunkEnd := chunkRef.Offset + uint64(chunkRef.Size)

        // Skip chunks before range
        if chunkEnd <= start {
            continue
        }

        // Stop after range
        if chunkRef.Offset >= end {
            break
        }

        // Fetch chunk
        chunk, err := s.DAClient.Get(context.Background(), cidToCommitment(chunkRef.CID))
        if err != nil {
            return err
        }

        // Calculate slice within chunk
        sliceStart := max(0, int64(start)-int64(chunkRef.Offset))
        sliceEnd := min(int64(len(chunk)), int64(end)-int64(chunkRef.Offset))

        writer.Write(chunk[sliceStart:sliceEnd])
    }

    return nil
}
```

### 6. CID ↔ BlobCommitment Mapping

#### 6.1 Conversion

```go
func blobCommitmentToCID(commitment [32]byte) *CID {
    return &CID{
        Version: 1,
        Codec:   0x55, // raw
        Hash: Multihash{
            Code:   0x16, // sha3-256
            Digest: commitment[:],
        },
    }
}

func cidToCommitment(cid *CID) [32]byte {
    if cid.Hash.Code != 0x16 {
        panic("unsupported hash")
    }
    var commitment [32]byte
    copy(commitment[:], cid.Hash.Digest)
    return commitment
}
```

#### 6.2 Alternative Hash Support

For content imported from IPFS:

```go
func hashToCommitment(hash Multihash) ([32]byte, error) {
    switch hash.Code {
    case 0x16: // SHA3-256 (native)
        var commitment [32]byte
        copy(commitment[:], hash.Digest)
        return commitment, nil

    case 0x12: // SHA2-256 (IPFS default)
        // Store with SHA3 wrapper
        return sha3.Sum256(hash.Digest), nil

    default:
        return [32]byte{}, ErrUnsupportedHash
    }
}
```

### 7. Deduplication

#### 7.1 Chunk-Level Deduplication

```go
func (s *ContentStore) StoreWithDedup(chunk []byte) (*CID, error) {
    commitment := sha3.Sum256(chunk)
    cid := blobCommitmentToCID(commitment)

    // Check if already stored
    if s.DAClient.Has(commitment[:]) {
        return cid, nil // Already exists
    }

    // Store new chunk
    _, err := s.DAClient.Put(context.Background(), chunk)
    return cid, err
}
```

#### 7.2 Cross-User Deduplication

When multiple users upload same content:
- Same chunks → same CIDs
- Only one copy stored
- Reference counted for retention

### 8. Gateway API

#### 8.1 HTTP Gateway

```go
type ContentGateway struct {
    store *ContentStore
}

func (g *ContentGateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    // Parse CID from path: /ipfs/{cid} or /lux/{cid}
    cid, err := parseCIDFromPath(r.URL.Path)
    if err != nil {
        http.Error(w, "invalid CID", 400)
        return
    }

    // Handle range requests
    if rangeHeader := r.Header.Get("Range"); rangeHeader != "" {
        g.serveRange(w, r, cid, rangeHeader)
        return
    }

    // Full download
    g.serveFull(w, cid)
}

func (g *ContentGateway) serveFull(w http.ResponseWriter, cid *CID) {
    manifest, err := g.store.getManifest(cid)
    if err != nil {
        http.Error(w, "not found", 404)
        return
    }

    w.Header().Set("Content-Type", manifest.MimeType)
    w.Header().Set("Content-Length", strconv.FormatUint(manifest.Size, 10))

    g.store.DownloadFile(cid, w)
}
```

#### 8.2 URL Format

```
https://gateway.lux.network/lux/{cid}
https://gateway.lux.network/lux/{cid}/{path}
https://{cid}.ipfs.lux.network/
```

### 9. IPFS Compatibility

#### 9.1 Import from IPFS

```go
func (s *ContentStore) ImportFromIPFS(ipfsCID string) (*CID, error) {
    // Fetch from IPFS gateway
    resp, err := http.Get(fmt.Sprintf("https://ipfs.io/ipfs/%s", ipfsCID))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    // Re-chunk and store in LuxDA
    return s.UploadFile(resp.Body, "", &UploadOpts{})
}
```

#### 9.2 Export to IPFS

```go
func (s *ContentStore) ExportToIPFS(cid *CID) (string, error) {
    // Download from LuxDA
    var buf bytes.Buffer
    if err := s.DownloadFile(cid, &buf); err != nil {
        return "", err
    }

    // Upload to IPFS
    return ipfs.Add(buf.Bytes())
}
```

## Rationale

### Why CID Format?

- Compatible with IPFS ecosystem
- Self-describing (includes hash algorithm)
- Supports multiple codecs

### Why Content-Defined Chunking?

- Better deduplication for similar files
- Incremental updates only change affected chunks
- Standard practice (IPFS, rsync)

### Why Manifests?

- Enables files larger than MaxBlobSize
- Supports directory structures
- Allows partial downloads

## Security Considerations

### Content Integrity

- CID includes hash of content
- Any modification changes CID
- Manifest integrity verified recursively

### Availability

- Chunks stored in DA layer
- Retention depends on payment/priority
- Manifests must be retrievable for file access

### Privacy

- Content is not encrypted by default
- For private files, encrypt before upload
- CID reveals nothing about content

## Test Plan

### Unit Tests

1. **Chunking**: Various file sizes and strategies
2. **CID Operations**: Encode/decode round-trip
3. **Manifest Serialization**: CBOR encode/decode

### Integration Tests

1. **Upload/Download**: Full file round-trip
2. **Range Requests**: Partial downloads
3. **Deduplication**: Same content, same CID

### Compatibility Tests

1. **IPFS Import**: Import existing IPFS content
2. **Gateway Compatibility**: Standard HTTP semantics

## References

- [IPFS Content Addressing](https://docs.ipfs.tech/concepts/content-addressing/)
- [Multiformats CID Spec](https://github.com/multiformats/cid)
- [UnixFS Specification](https://github.com/ipfs/specs/blob/main/UNIXFS.md)
- [CBOR: RFC 8949](https://www.rfc-editor.org/rfc/rfc8949)

---

*LP-6441 v1.0.0 - 2026-01-02*
