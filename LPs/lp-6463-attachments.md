---
lp: 6463
title: LuxChat Encrypted Attachments
description: LuxChat Encrypted Attachments specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
requires: [2200, 2211]
tags: [luxda-bus, e2ee, chat, pqc]
---

## Abstract

This LP defines how chat messages reference and securely share file attachments. Files are stored in the content-addressed system (LP-6441), encrypted with message-specific keys, and referenced from encrypted chat messages.

## Motivation

Messaging applications need to share:

1. **Images**: Photos, screenshots, memes
2. **Documents**: PDFs, office files
3. **Media**: Audio, video clips
4. **Archives**: Compressed files

Attachments must be:
- End-to-end encrypted
- Efficiently stored and retrieved
- Access-controlled to conversation participants

## Specification

### 1. Attachment Encryption

#### 1.1 Encryption Flow

```
Original File
      ↓
  Compress (optional)
      ↓
  Encrypt (AES-256-GCM)
      ↓
  Chunk (per LP-6441)
      ↓
  Store in DA
      ↓
  Get CID
      ↓
  Include CID + key in message
```

#### 1.2 File Encryption

```go
type EncryptedAttachment struct {
    // Content-addressed reference
    CID *CID

    // Decryption key
    Key [32]byte

    // Metadata (encrypted in message)
    Metadata AttachmentMetadata
}

type AttachmentMetadata struct {
    FileName    string
    MimeType    string
    Size        uint64
    Dimensions  *Dimensions  // For images/video
    Duration    *uint64      // For audio/video
    Thumbnail   *Thumbnail
}

func EncryptAttachment(file io.Reader, metadata *AttachmentMetadata) (*EncryptedAttachment, error) {
    // Generate random file key
    var fileKey [32]byte
    rand.Read(fileKey[:])

    // Read and encrypt file
    plaintext, _ := io.ReadAll(file)

    // Optional: compress
    if shouldCompress(metadata.MimeType) {
        plaintext = compress(plaintext)
    }

    // Encrypt with AES-256-GCM
    nonce := DeriveNonce(fileKey, 0)
    ciphertext := AESGCMEncrypt(fileKey[:], nonce, plaintext, nil)

    // Upload to content store
    cid, err := contentStore.UploadFile(
        bytes.NewReader(ciphertext),
        "",
        &UploadOpts{Encrypted: true},
    )
    if err != nil {
        return nil, err
    }

    return &EncryptedAttachment{
        CID:      cid,
        Key:      fileKey,
        Metadata: *metadata,
    }, nil
}
```

#### 1.3 File Decryption

```go
func DecryptAttachment(att *EncryptedAttachment) ([]byte, error) {
    // Download from content store
    var buf bytes.Buffer
    if err := contentStore.DownloadFile(att.CID, &buf); err != nil {
        return nil, err
    }
    ciphertext := buf.Bytes()

    // Decrypt
    nonce := DeriveNonce(att.Key, 0)
    plaintext, err := AESGCMDecrypt(att.Key[:], nonce, ciphertext, nil)
    if err != nil {
        return nil, err
    }

    // Decompress if needed
    if isCompressed(plaintext) {
        plaintext = decompress(plaintext)
    }

    return plaintext, nil
}
```

### 2. Message Integration

#### 2.1 Attachment in DM

```go
type DMAttachmentContent struct {
    // Attachment reference
    Attachment EncryptedAttachment

    // Optional caption
    Caption string

    // Reply context
    ReplyTo *uint64  // Sequence number
}

func SendDMWithAttachment(session *Session, file io.Reader, meta *AttachmentMetadata, caption string) error {
    // Encrypt and upload attachment
    att, err := EncryptAttachment(file, meta)
    if err != nil {
        return err
    }

    // Create message content
    content := &DMAttachmentContent{
        Attachment: *att,
        Caption:    caption,
    }

    // Encrypt message (key goes inside encrypted content)
    msg, err := session.Encrypt(content.Encode())
    if err != nil {
        return err
    }

    // Publish to DM namespace
    return dmNamespace.Publish(msg)
}
```

#### 2.2 Attachment in Group

For groups, the attachment key is included in the MLS-encrypted message:

```go
func SendGroupAttachment(group *GroupState, file io.Reader, meta *AttachmentMetadata) error {
    // Encrypt attachment with random key
    att, err := EncryptAttachment(file, meta)
    if err != nil {
        return err
    }

    // Create application message with attachment
    content := &GroupAttachmentContent{
        Attachment: *att,
    }

    // MLS encrypt (all members can decrypt → get file key)
    msg, err := group.EncryptMessage(content.Encode())
    if err != nil {
        return err
    }

    return groupNamespace.Publish(msg)
}
```

### 3. Thumbnails

#### 3.1 Thumbnail Generation

```go
type Thumbnail struct {
    // Small image data (encrypted inline)
    Data []byte

    // Dimensions
    Width  uint32
    Height uint32

    // Blurhash for placeholder
    Blurhash string
}

func GenerateThumbnail(image []byte, maxSize int) (*Thumbnail, error) {
    // Decode image
    img, _, err := image.Decode(bytes.NewReader(image))
    if err != nil {
        return nil, err
    }

    // Resize
    thumb := resize.Thumbnail(uint(maxSize), uint(maxSize), img, resize.Lanczos3)

    // Encode as JPEG
    var buf bytes.Buffer
    jpeg.Encode(&buf, thumb, &jpeg.Options{Quality: 70})

    // Generate blurhash
    blurhash, _ := blurhash.Encode(4, 3, img)

    return &Thumbnail{
        Data:     buf.Bytes(),
        Width:    uint32(thumb.Bounds().Dx()),
        Height:   uint32(thumb.Bounds().Dy()),
        Blurhash: blurhash,
    }, nil
}
```

#### 3.2 Inline vs Reference

Small thumbnails (< 10KB) are included inline in the message.
Larger thumbnails are stored separately:

```go
func (att *EncryptedAttachment) SetThumbnail(thumb *Thumbnail) {
    if len(thumb.Data) < 10*1024 {
        // Inline (encrypted with message)
        att.Metadata.Thumbnail = thumb
    } else {
        // Separate upload
        thumbCID, thumbKey := EncryptAndUpload(thumb.Data)
        att.Metadata.Thumbnail = &Thumbnail{
            CID:      thumbCID,
            Key:      thumbKey,
            Width:    thumb.Width,
            Height:   thumb.Height,
            Blurhash: thumb.Blurhash,
        }
    }
}
```

### 4. Access Control

#### 4.1 DM Access

In DM, both participants have the file key:

```go
// File key is inside encrypted DM message
// Only Alice and Bob can decrypt message → get key
// Only Alice and Bob can decrypt file
```

#### 4.2 Group Access - Current Epoch

Members with current epoch key can decrypt:

```go
// File key in MLS application message
// Current members can decrypt message → get key
// Current members can decrypt file
```

#### 4.3 Group Access - After Member Removal

```go
// Removed member still has old file key
// Files sent before removal remain accessible to them
// This is intentional - they had access when sent

// For truly private files after removal:
// - Re-encrypt with new key
// - Send as new message
// - Old link no longer works for removed member
```

#### 4.4 Revoking Access

```go
func RevokeAttachmentAccess(oldAtt *EncryptedAttachment, group *GroupState) (*EncryptedAttachment, error) {
    // Download and decrypt with old key
    plaintext, err := DecryptAttachment(oldAtt)
    if err != nil {
        return nil, err
    }

    // Re-encrypt with new key
    newAtt, err := EncryptAttachment(
        bytes.NewReader(plaintext),
        &oldAtt.Metadata,
    )
    if err != nil {
        return nil, err
    }

    // Old CID/key no longer shared
    // Only new members get new CID/key
    return newAtt, nil
}
```

### 5. Media Streaming

#### 5.1 Range Requests

For large media files, support partial decryption:

```go
type StreamableAttachment struct {
    EncryptedAttachment

    // Chunk map for random access
    ChunkMap []ChunkInfo
}

type ChunkInfo struct {
    Offset uint64
    Size   uint32
    CID    *CID
    Nonce  []byte
}

func (sa *StreamableAttachment) ReadRange(start, end uint64) ([]byte, error) {
    // Find relevant chunks
    chunks := sa.FindChunks(start, end)

    // Download and decrypt each chunk
    var result []byte
    for _, chunk := range chunks {
        data, _ := contentStore.DownloadRange(chunk.CID, chunk.Offset, chunk.Size)
        decrypted := AESGCMDecrypt(sa.Key[:], chunk.Nonce, data, nil)
        result = append(result, decrypted...)
    }

    // Trim to exact range
    return result[start-chunks[0].Offset : end-chunks[0].Offset], nil
}
```

#### 5.2 Progressive Loading

```go
func StreamVideo(att *StreamableAttachment, player VideoPlayer) error {
    // Stream chunks progressively
    for _, chunk := range att.ChunkMap {
        data, err := contentStore.DownloadChunk(chunk.CID)
        if err != nil {
            return err
        }

        decrypted := AESGCMDecrypt(att.Key[:], chunk.Nonce, data, nil)
        player.AppendData(decrypted)
    }

    return nil
}
```

### 6. Content Types

#### 6.1 Supported Types

| Category | MIME Types | Features |
|----------|-----------|----------|
| Images | image/jpeg, image/png, image/gif, image/webp | Thumbnail, preview |
| Video | video/mp4, video/webm | Thumbnail, streaming |
| Audio | audio/mpeg, audio/ogg, audio/wav | Waveform, duration |
| Documents | application/pdf, text/*, office formats | Preview, page count |
| Archives | application/zip, application/gzip | File list |

#### 6.2 Type Detection

```go
func DetectContentType(file io.Reader) (*AttachmentMetadata, error) {
    // Read header bytes
    header := make([]byte, 512)
    n, _ := file.Read(header)

    // Detect MIME type
    mimeType := http.DetectContentType(header[:n])

    // Extract type-specific metadata
    meta := &AttachmentMetadata{
        MimeType: mimeType,
    }

    switch {
    case strings.HasPrefix(mimeType, "image/"):
        meta.Dimensions = extractImageDimensions(header)
    case strings.HasPrefix(mimeType, "video/"):
        meta.Dimensions = extractVideoDimensions(header)
        meta.Duration = extractVideoDuration(header)
    case strings.HasPrefix(mimeType, "audio/"):
        meta.Duration = extractAudioDuration(header)
    }

    return meta, nil
}
```

### 7. Wire Format

#### 7.1 Attachment Content

```
AttachmentContentV1 := {
    version:     uint8    [1 byte]
    cidLen:      uint16   [2 bytes]
    cid:         bytes    [cidLen bytes]
    key:         bytes32  [32 bytes]
    metadataLen: uint16   [2 bytes]
    metadata:    bytes    [metadataLen bytes]  // CBOR encoded
    captionLen:  uint16   [2 bytes]
    caption:     bytes    [captionLen bytes]   // UTF-8
}
```

#### 7.2 Metadata CBOR

```go
type AttachmentMetadataCBOR struct {
    FileName   string       `cbor:"1,keyasint"`
    MimeType   string       `cbor:"2,keyasint"`
    Size       uint64       `cbor:"3,keyasint"`
    Width      uint32       `cbor:"4,keyasint,omitempty"`
    Height     uint32       `cbor:"5,keyasint,omitempty"`
    Duration   uint64       `cbor:"6,keyasint,omitempty"`
    Blurhash   string       `cbor:"7,keyasint,omitempty"`
    ThumbData  []byte       `cbor:"8,keyasint,omitempty"`
}
```

### 8. Size Limits

| Limit | Value | Description |
|-------|-------|-------------|
| MaxAttachmentSize | 100 MiB | Maximum file size |
| MaxThumbnailInline | 10 KiB | Thumbnail inline limit |
| MaxCaptionLength | 4096 | Caption character limit |
| MaxAttachmentsPerMessage | 10 | Attachments per message |

## Rationale

### Why Separate File Keys?

- Each file has unique key
- Compromising one file doesn't compromise others
- Access control at file granularity

### Why Store Encrypted?

- Content store operators can't see content
- Privacy even with untrusted storage
- End-to-end encryption extends to files

### Why Include Key in Message?

- Recipients already have message key
- No additional key exchange needed
- Same security properties as message

## Backwards Compatibility

This specification introduces new functionality and does not modify existing protocols. It is fully backwards compatible with existing implementations.

## Security Considerations

### Key Management

- File keys never reused
- Keys deleted when file deleted
- Keys only shared with conversation participants

### Forward Secrecy

- Files encrypted with ephemeral keys
- Session ratchet doesn't affect file keys
- Historical file access persists (by design)

### Data at Rest

- Encrypted before upload
- Storage providers see only ciphertext
- No server-side decryption possible

## Test Plan

### Unit Tests

1. **Encrypt/Decrypt**: Round-trip files of various sizes
2. **Thumbnails**: Generate and verify thumbnails
3. **Range Requests**: Partial decryption

### Integration Tests

1. **DM Attachment**: Send and receive in DM
2. **Group Attachment**: Send and receive in group
3. **Large Files**: 100 MiB files

### Performance Tests

1. **Encryption Speed**: MB/s for encryption
2. **Streaming**: Latency for range requests
3. **Concurrent**: Multiple attachments

## References

- [Signal Attachments](https://signal.org/docs/)
- [IPFS Encryption](https://docs.ipfs.tech/)
- [Matrix Media API](https://spec.matrix.org/latest/client-server-api/#content-repository)

---

*LP-6463 v1.0.0 - 2026-01-02*
