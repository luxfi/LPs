#!/usr/bin/env bash
set -euo pipefail

#
# Script to create GitHub Discussions for each LIP automatically using GitHub CLI.
# Usage: Run this in a terminal with GH CLI authenticated and internet access.
#

REPO="luxfi/lips"

for file in LIPs/lip-*.md; do
  # Extract LIP number and title from frontmatter
  lip_number=$(grep -E '^lip: ' "$file" | awk '{print $2}')
  title=$(grep -E '^title: ' "$file" | sed -E 's/^title: (.+)/\1/')

  # Construct discussion title and body
  disc_title="LIP ${lip_number}: ${title}"
  disc_body="Discussion for LIP-${lip_number}: https://github.com/${REPO}/blob/main/${file}"

  echo "Creating discussion for LIP-${lip_number}: $disc_title"
  gh discussion create --repo "$REPO" \
    --category "LIP Discussions" \
    --title "$disc_title" \
    --body "$disc_body"
done