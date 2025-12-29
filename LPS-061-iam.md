---
lps: 061
title: Identity and Access Management Architecture
tags: [iam, oauth, oidc, identity, authentication, authorization]
description: OAuth 2.1 and OpenID Connect identity architecture for Lux services
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Identity
created: 2020-03-01
references:
  - RFC 6749 (OAuth 2.0)
  - RFC 9126 (OAuth 2.1)
  - OpenID Connect Core 1.0
  - lps-060 (DID Specification)
---

# LPS-061: Identity and Access Management Architecture

## Abstract

Defines the identity architecture for all Lux and Hanzo services. Hanzo IAM (hanzo.id) is the single OIDC provider. All authenticated services validate JWTs issued by IAM. The `owner` claim in the JWT scopes all data queries to the organization. No service maintains its own user database.

## Specification

### Architecture

```
Client -> Hanzo IAM (hanzo.id) -> JWT (id_token + access_token)
Client -> Service API (Bearer token) -> Validate JWT -> Extract org from owner claim
```

### Token Format

Access tokens are JWTs signed with RS256. Claims:

| Claim | Type | Description |
|-------|------|-------------|
| sub | string | User ID |
| owner | string | Organization ID (scopes all queries) |
| aud | string | Target service audience |
| scope | string | Space-separated scopes |
| iat | uint64 | Issued-at timestamp |
| exp | uint64 | Expiration timestamp |

### Authorization Flows

| Flow | Use Case |
|------|----------|
| Authorization Code + PKCE | Web and mobile apps |
| Client Credentials | Service-to-service |
| Device Authorization | CLI tools, IoT |

### Service Integration

Every Lux service MUST:
1. Validate the JWT signature against IAM's JWKS endpoint (`hanzo.id/.well-known/jwks.json`).
2. Check `exp` and `aud` claims.
3. Extract `owner` from the JWT and scope all database queries to that organization.
4. Reject tokens with missing or empty `owner`.

### Gateway Integration

The API gateway (api.hanzo.ai) validates tokens at the edge and injects `X-Hanzo-User` and `X-Hanzo-Org` headers. Backend services behind the gateway may trust these headers without re-validating the JWT.

## Security Considerations

1. Tokens are short-lived (15 minutes). Refresh tokens are rotated on each use.
2. All secrets (client IDs, signing keys) are stored in KMS (kms.hanzo.ai).
3. PKCE is mandatory for all public clients. No implicit flow.
4. Token revocation is supported via the revocation endpoint.

## Reference

| Resource | Location |
|----------|----------|
| Hanzo IAM | https://hanzo.id |
| JWKS endpoint | https://hanzo.id/.well-known/jwks.json |
| IAM implementation | `github.com/hanzoai/iam` |
| Gateway | `github.com/hanzoai/gateway` |

## Copyright

Copyright (C) 2020-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
