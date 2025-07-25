#!/bin/bash

# New LP Creation Script
# Helps authors create a new LP with proper formatting

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo -e "${GREEN}Welcome to the LP Creation Wizard!${NC}"
echo "==================================="
echo

# Get LP details
read -p "Enter your name: " author_name
read -p "Enter your email or GitHub username: " author_contact
read -p "Enter LP title: " title
read -p "Enter brief description (one line): " description

# Select type
echo -e "\nSelect LP type:"
echo "1) Standards Track"
echo "2) Meta"
echo "3) Informational"
read -p "Choose (1-3): " type_choice

case $type_choice in
    1)
        lp_type="Standards Track"
        # Ask for category
        echo -e "\nSelect category:"
        echo "1) Core"
        echo "2) Networking"
        echo "3) Interface"
        echo "4) LRC (Application Standard)"
        read -p "Choose (1-4): " cat_choice
        
        case $cat_choice in
            1) category="Core" ;;
            2) category="Networking" ;;
            3) category="Interface" ;;
            4) category="LRC" ;;
            *) category="Core" ;;
        esac
        ;;
    2)
        lp_type="Meta"
        category=""
        ;;
    3)
        lp_type="Informational"
        category=""
        ;;
    *)
        lp_type="Standards Track"
        category="Core"
        ;;
esac

# Format author
if [[ $author_contact == *"@"* ]]; then
    # It's an email
    author="$author_name <$author_contact>"
else
    # It's a GitHub username
    author="$author_name (@$author_contact)"
fi

# Get current date
created_date=$(date +%Y-%m-%d)

# Create the file
filename="LPs/lp-draft.md"

print_info "Creating new LP draft at $filename"

# Generate the LP content
cat > "$filename" << EOF
---
lp: <to be assigned>
title: $title
description: $description
author: $author
discussions-to: <URL>
status: Draft
type: $lp_type
EOF

if [ -n "$category" ]; then
    echo "category: $category" >> "$filename"
fi

cat >> "$filename" << 'EOF'
created: DATE_PLACEHOLDER
requires: <LP number(s)>
replaces: <LP number(s)>
---

## Abstract

[TODO: Write a short (~200 word) description of the technical issue being addressed. This should be a very terse and human-readable version of the specification section. Someone should be able to read only the abstract to get the gist of what this specification does.]

## Motivation

[TODO: Explain why this LP is needed. What problem does it solve? Why should someone want to implement this standard? What benefit does it provide to the Lux ecosystem? What use cases does this LP address?]

## Specification

[TODO: Describe the syntax and semantics of any new feature. The specification should be detailed enough to allow competing, interoperable implementations for any of the current Lux platforms.]

### Overview

[TODO: Provide a high-level overview]

### Detailed Specification

[TODO: Provide detailed technical specification]

EOF

# Add code example for Standards Track
if [ "$lp_type" == "Standards Track" ]; then
    cat >> "$filename" << 'EOF'
### Interface

```solidity
// TODO: Add interface definition if applicable
interface IExample {
    function exampleFunction() external;
}
```

EOF
fi

cat >> "$filename" << 'EOF'
## Rationale

[TODO: Flesh out the specification by describing what motivated the design and why particular design decisions were made. Describe alternate designs that were considered and related work. The rationale should discuss important objections or concerns raised during discussion around the LP.]

## Backwards Compatibility

[TODO: Describe any backwards incompatibilities and their consequences. The LP must explain how the author proposes to deal with these incompatibilities. LP submissions without a sufficient backwards compatibility treatise may be rejected outright.]

EOF

# Add test cases for Standards Track
if [ "$lp_type" == "Standards Track" ]; then
    cat >> "$filename" << 'EOF'
## Test Cases

[TODO: Provide test cases for an implementation. Tests should either be inlined in the LP as data (such as input/expected output pairs, or included in `../assets/lp-###/<filename>`.]

```
// Example test case
Input: ...
Expected: ...
Actual: ...
```

## Reference Implementation

[TODO: Provide a reference/example implementation that people can use to assist in understanding or implementing this specification. If the implementation is too large to reasonably be included inline, then consider adding it to `../assets/lp-###/` or linking to a repository.]

```solidity
// TODO: Add reference implementation
contract Example {
    // Implementation here
}
```

EOF
fi

cat >> "$filename" << 'EOF'
## Security Considerations

[TODO: Discuss security implications/considerations relevant to the proposed change. Include information that might be important for security discussions, surfaces risks and can be used throughout the life cycle of the proposal. E.g. include security-relevant design decisions, concerns, important discussions, implementation-specific guidance and pitfalls, an outline of threats and risks and how they are being addressed.]

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
EOF

# Replace date placeholder
sed -i.bak "s/DATE_PLACEHOLDER/$created_date/g" "$filename" && rm "${filename}.bak"

print_success "LP draft created successfully!"
echo
print_info "Next steps:"
echo "1. Fill in the TODO sections in $filename"
echo "2. Post your idea in GitHub Discussions for initial feedback"
echo "3. Run ./scripts/validate-lp.sh $filename to check formatting"
echo "4. Submit a PR when ready"
echo
echo "For the discussions-to field, create a new discussion at:"
echo "https://github.com/luxfi/lps/discussions/new"