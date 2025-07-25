---
lp: <LP number>
title: <The LP title is a few words, not a complete sentence>
description: <Description is one full (short) sentence>
author: <a comma separated list of the author's or authors' name + GitHub username (in parenthesis), or name and email (in angle brackets).  Example, FirstName LastName (@GitHubUsername), FirstName LastName <foo@bar.com>, FirstName (@GitHubUsername) and GitHubUsername (@GitHubUsername)>
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: <Standards Track, Meta, or Informational>
category: <Core, Networking, Interface, LRC> (*only required for Standards Track LPs)
created: <date created on, in ISO 8601 (yyyy-mm-dd) format>
requires: <LP number(s)> (*optional; remove if none)
replaces: <LP number(s)> (*optional; remove if none)
---

This is the suggested template for new LPs.

## Abstract

A short (~200 word) description of the technical issue being addressed. This should be a very terse and human-readable version of the specification section. Someone should be able to read only the abstract to get the gist of what this specification does.

## Motivation

The motivation section should describe the "why" of this LP. What problem does it solve? Why should someone want to implement this standard? What benefit does it provide to the Lux ecosystem? What use cases does this LP address?

## Specification

The technical specification should describe the syntax and semantics of any new feature. The specification should be detailed enough to allow competing, interoperable implementations for any of the current Lux platforms.

## Rationale

The rationale fleshes out the specification by describing what motivated the design and why particular design decisions were made. It should describe alternate designs that were considered and related work, e.g. how the feature is supported in other languages.

The rationale should discuss important objections or concerns raised during discussion around the LP.

## Backwards Compatibility

All LPs that introduce backwards incompatibilities must include a section describing these incompatibilities and their consequences. The LP must explain how the author proposes to deal with these incompatibilities. LP submissions without a sufficient backwards compatibility treatise may be rejected outright.

## Test Cases

Test cases for an implementation are mandatory for LPs that are affecting consensus changes. Tests should either be inlined in the LP as data (such as input/expected output pairs, or included in `../assets/lp-###/<filename>`.

## Reference Implementation

An optional section that contains a reference/example implementation that people can use to assist in understanding or implementing this specification. If the implementation is too large to reasonably be included inline, then consider adding it to `../assets/lp-###/` or linking to a repository.

## Security Considerations

All LPs must contain a section that discusses the security implications/considerations relevant to the proposed change. Include information that might be important for security discussions, surfaces risks and can be used throughout the life cycle of the proposal. E.g. include security-relevant design decisions, concerns, important discussions, implementation-specific guidance and pitfalls, an outline of threats and risks and how they are being addressed. LP submissions missing the "Security Considerations" section will be rejected. An LP cannot proceed to status "Final" without a Security Considerations discussion deemed sufficient by the reviewers.

## Economic Impact (optional)

Discuss the economic implications of the proposed change, such as effects on token supply, fee structures, incentives, and market dynamics.

## Open Questions (optional)

List any unresolved issues, trade-offs, or questions that require further discussion before the LP can advance.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
