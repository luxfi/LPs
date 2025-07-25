#!/usr/bin/env bash
set -euo pipefail

#
# Script to create GitHub Discussions for each LP automatically using GitHub CLI.
# Usage: Run this in a terminal with GH CLI authenticated and internet access.
#

REPO="luxfi/lps"

for file in LPs/lp-*.md; do
  # Extract LP number and title from frontmatter
  lp_number=$(grep -E '^lp: ' "$file" | awk '{print $2}')
  title=$(grep -E '^title: ' "$file" | sed -E 's/^title: (.+)/\1/')

  # Construct discussion title and body
  disc_title="LP ${lp_number}: ${title}"
  disc_body="Discussion for LP-${lp_number}: https://github.com/${REPO}/blob/main/${file}"

  echo "Creating discussion for LP-${lp_number}: $disc_title"
  gh discussion create --repo "$REPO" \
    --category "LP Discussions" \
    --title "$disc_title" \
    --body "$disc_body"
done