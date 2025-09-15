#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}Decision LP Wizard (Informational)${NC}"
echo "===================================="

read -rp "Enter your name: " author_name
read -rp "Enter your email or GitHub username: " author_contact
read -rp "Enter Decision LP title: " title
read -rp "Enter brief description (one line): " description

if [[ "$author_contact" == *"@"* ]]; then
  author="$author_name <$author_contact>"
else
  author="$author_name (@$author_contact)"
fi

created_date=$(date +%Y-%m-%d)
filename="LPs/lp-draft.md"

echo -e "${BLUE}[INFO]${NC} Creating draft at $filename"

cat > "$filename" << EOF
---
lp: <to be assigned>
title: $title
description: $description
author: $author
discussions-to: <URL>
status: Proposed
type: Informational
created: $created_date
requires: <LP number(s)>
replaces: <LP number(s)>
---

## Abstract

One-paragraph summary of the decision and scope.

## Context

Problem, constraints, and forces that led to this decision.

## Decision

The choice made. Include scope and any non-goals. Reference related LPs.

## Consequences

Positive trade-offs, risks, and migration considerations.

## Alternatives Considered

Briefly list alternatives and why they were not chosen.

## References

Related LPs, issues/PRs, benchmarks, or designs.

## Implementation Notes

Links to code modules, flags/configs, rollout/rollback plan.
EOF

echo -e "${GREEN}[SUCCESS]${NC} Draft created: $filename"

