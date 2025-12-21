---
lp: 86
title: Security Practices and Responsible Disclosure
description: How to report vulnerabilities, bug bounty program, and security response procedures
author: Lux Security Team
status: Final
type: Meta
created: 2025-12-21
tags: [security, disclosure, bug-bounty, cve]
---

# LP-0086: Security Practices and Responsible Disclosure

## Abstract

This LP defines how security researchers should report vulnerabilities to Lux Network, our bug bounty program, response SLAs, and safe harbor protections. This is the canonical reference for responsible disclosure.

## Motivation

Clear security reporting procedures:
1. **Enable researchers** to report issues safely
2. **Protect users** through rapid response
3. **Reward contributions** fairly
4. **Maintain trust** through transparency

---

## Reporting a Vulnerability

### Primary Contact

**Email**: security@lux.network

**PGP Key**: Available at https://lux.network/.well-known/security.txt

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
[Key available at security.txt]
-----END PGP PUBLIC KEY BLOCK-----
```

### What to Include

```yaml
report:
  title: "Brief description"
  severity: Critical | High | Medium | Low
  affected:
    - component: "node/geth/coreth/contracts"
      version: "v1.x.x"
      file: "path/to/vulnerable/code"
  
  description: |
    Detailed explanation of the vulnerability,
    including root cause analysis.
  
  reproduction:
    steps:
      - "Step 1"
      - "Step 2"
    environment: "Go 1.22, Ubuntu 24.04"
    
  impact: |
    What an attacker could do with this.
    Estimated funds at risk if applicable.
    
  poc: |
    Proof of concept code (if safe to include).
    Mark clearly as [REDACTED] if dangerous.
    
  suggested_fix: |
    Optional: Your recommended fix.
    
  researcher:
    name: "Your name or handle"
    contact: "email or signal"
    wallet: "0x... for bounty payment"
```

### Alternative Channels

| Channel | Use Case |
|---------|----------|
| security@lux.network | Primary (encrypted email) |
| GitHub Security Advisory | For open-source components |
| Immunefi | Bug bounty platform |
| Signal | Encrypted chat (request contact) |

---

## Severity Classification

### Critical (CVSS 9.0-10.0)

**Response**: 4 hours acknowledgment, 24-48 hours fix

- Direct loss of funds (any amount)
- Consensus failure / chain halt
- Remote code execution on validators
- Private key extraction
- Bridge drain vulnerabilities

**Bounty**: $50,000 - $500,000

### High (CVSS 7.0-8.9)

**Response**: 24 hours acknowledgment, 7 days fix

- Potential fund loss requiring specific conditions
- Denial of service on core infrastructure
- Privilege escalation
- Cryptographic weakness (non-immediate exploit)
- Smart contract reentrancy with limited scope

**Bounty**: $10,000 - $50,000

### Medium (CVSS 4.0-6.9)

**Response**: 48 hours acknowledgment, 30 days fix

- Limited DoS (single node)
- Information disclosure (non-sensitive)
- Access control bypass (non-financial)
- Gas griefing attacks

**Bounty**: $2,000 - $10,000

### Low (CVSS 0.1-3.9)

**Response**: 7 days acknowledgment, 90 days fix

- Best practice violations
- Minor information leaks
- UI/UX security issues
- Documentation errors with security implications

**Bounty**: $500 - $2,000

### Informational

- Code quality issues
- Non-exploitable findings
- Theoretical attacks

**Bounty**: Swag + recognition

---

## Bug Bounty Program

### In Scope

| Component | Repository | Bounty Multiplier |
|-----------|------------|-------------------|
| Node Core | luxfi/node | 1.5x |
| EVM/Geth | luxfi/geth | 1.5x |
| Coreth | luxfi/coreth | 1.5x |
| Consensus | luxfi/consensus | 2.0x |
| Cryptography | luxfi/crypto | 2.0x |
| Threshold/MPC | luxfi/threshold | 2.0x |
| Bridge Contracts | luxfi/bridge | 2.0x |
| DeFi Precompiles | geth/precompiles | 1.5x |
| Token Contracts | luxfi/contracts | 1.0x |
| SDK/Tools | luxfi/sdk | 0.5x |

### Out of Scope

- Third-party services (AWS, Cloudflare, etc.)
- Social engineering attacks
- Physical security
- Spam/phishing (report to abuse@lux.network)
- Known issues in public tracker
- Issues in forked upstream code (report upstream first)
- Testnet-only issues (unless affecting mainnet)

### Bounty Calculation

```
Base Bounty = Severity Base × Component Multiplier × Impact Factor

Impact Factors:
- Funds at Risk > $100M: 2.0x
- Funds at Risk > $10M: 1.5x
- Funds at Risk > $1M: 1.2x
- Funds at Risk < $1M: 1.0x
- No Funds at Risk: 0.5x
```

### Payment

- **Currency**: USDC, LUX, or USD wire (researcher choice)
- **Timeline**: Within 14 days of fix deployment
- **Tax**: Researcher responsible for tax obligations
- **Wallet**: Provide in initial report or upon confirmation

---

## Response Process

### Timeline

```
Day 0:    Vulnerability reported
          ├── Auto-acknowledgment (immediate)
          └── Severity triage (4-24 hours)
          
Day 1-3:  Initial assessment
          ├── Confirm vulnerability
          ├── Assign severity
          └── Notify researcher
          
Day 3-7:  Fix development
          ├── Develop patch
          ├── Internal review
          └── Researcher review (optional)
          
Day 7-14: Deployment
          ├── Testnet deployment
          ├── Security monitoring
          └── Mainnet deployment
          
Day 14+:  Disclosure
          ├── Researcher credited
          ├── Public advisory
          └── Bounty payment
```

### Communication

| Event | Researcher Notification |
|-------|------------------------|
| Report received | Immediate (auto) |
| Triage complete | Within 24 hours |
| Fix in progress | Within 72 hours |
| Fix deployed (testnet) | Same day |
| Fix deployed (mainnet) | Same day |
| Bounty approved | Within 7 days of deployment |
| Public disclosure | 14-90 days after fix |

---

## Coordinated Disclosure

### Standard Timeline

| Severity | Disclosure After Fix |
|----------|---------------------|
| Critical | 14 days |
| High | 30 days |
| Medium | 60 days |
| Low | 90 days |

### Disclosure Content

Public advisories include:
- Vulnerability description (sanitized)
- Affected versions
- Fixed versions
- Mitigation steps
- CVE ID (if assigned)
- Researcher credit (if desired)

### CVE Assignment

For critical/high vulnerabilities:
1. We request CVE from MITRE
2. CVE reserved during fix development
3. CVE published with disclosure

---

## Safe Harbor

### Legal Protection

Lux Network commits to:

1. **No legal action** against researchers who:
   - Follow this disclosure policy
   - Make good-faith efforts to avoid harm
   - Do not access/modify user data beyond PoC needs
   - Do not disrupt services beyond testing

2. **Protection from third parties**:
   - We will not refer researchers to law enforcement
   - We will advocate for researchers if third parties pursue action

3. **Clear scope**:
   - Testing on testnets: Always permitted
   - Testing on mainnet: Permitted with minimal impact
   - User data access: Never permitted
   - Fund movement: Only to demonstrate, immediately return

### Researcher Commitments

You agree to:
1. Report vulnerabilities before public disclosure
2. Give us reasonable time to fix (per severity)
3. Not access/store user data
4. Not disrupt production services
5. Not use vulnerabilities for financial gain (beyond bounty)

### Exclusions

Safe harbor does NOT apply to:
- Malicious exploitation
- Data theft or ransom
- Service disruption beyond testing
- Violation of other users' privacy
- Actions that violate applicable law

---

## Security Contacts

### Team

| Role | Contact |
|------|---------|
| Security Lead | security@lux.network |
| Emergency Hotline | +1-XXX-XXX-XXXX |
| PGP Fingerprint | XXXX XXXX XXXX XXXX |

### External

| Platform | Link |
|----------|------|
| Immunefi | immunefi.com/bounty/lux |
| GitHub Security | github.com/luxfi/node/security |
| security.txt | lux.network/.well-known/security.txt |

---

## Incident Response

### If You Discover Active Exploitation

1. **Email immediately**: security@lux.network with subject "[ACTIVE] Brief description"
2. **Call hotline**: For critical active exploits
3. **Do NOT**: Post publicly, notify others, attempt to front-run

### Our Response

1. Immediate assessment (15 minutes)
2. Circuit breaker activation if needed
3. War room convened
4. Researcher kept informed
5. Post-incident: Enhanced bounty consideration

---

## Recognition

### Hall of Fame

Researchers who report valid vulnerabilities are recognized:
- Public acknowledgment (if desired)
- Hall of Fame listing
- Swag package
- Conference invitations

### Repeat Contributors

| Tier | Criteria | Benefits |
|------|----------|----------|
| Bronze | 1+ valid reports | Hall of Fame |
| Silver | 3+ valid reports | Priority response, swag |
| Gold | 5+ valid reports | Direct access, events |
| Platinum | 10+ or critical | Advisory role, retainer |

---

## Audit Partners

### Approved Auditors

| Firm | Specialization |
|------|----------------|
| Trail of Bits | Protocol, crypto |
| OpenZeppelin | Smart contracts |
| Consensys Diligence | DeFi |
| Sigma Prime | Consensus |
| Zellic | Bridges |
| OtterSec | Full stack |

### Requesting an Audit

For new protocol integrations, contact: audits@lux.network

---

## Updates to This Policy

This policy is versioned. Changes announced via:
- GitHub releases
- Security mailing list
- Discord #security channel

Current version: 1.0.0 (2025-12-21)

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│                    REPORT A VULNERABILITY                   │
├─────────────────────────────────────────────────────────────┤
│  Email:     security@lux.network (PGP encrypted)           │
│  Immunefi:  immunefi.com/bounty/lux                        │
│  GitHub:    github.com/luxfi/node/security/advisories      │
├─────────────────────────────────────────────────────────────┤
│  Include:   Severity, Component, Steps, Impact, PoC        │
│  Response:  4h (Critical) to 7d (Low)                      │
│  Bounty:    $500 - $500,000 based on severity              │
├─────────────────────────────────────────────────────────────┤
│  Safe Harbor: We won't sue good-faith researchers          │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

This document itself should be:
- Publicly accessible
- Version controlled
- Regularly reviewed
- Translated to major languages

---

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
