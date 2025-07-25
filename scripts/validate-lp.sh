#!/bin/bash

# LP Validation Script
# Validates that a LP file meets all formatting and content requirements

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if file is provided
if [ $# -eq 0 ]; then
    print_error "No file provided"
    echo "Usage: $0 <lp-file.md>"
    exit 1
fi

LP_FILE=$1

# Check if file exists
if [ ! -f "$LP_FILE" ]; then
    print_error "File not found: $LP_FILE"
    exit 1
fi

# Valid status values
VALID_STATUSES=("Draft" "Review" "Last Call" "Final" "Withdrawn" "Deferred" "Superseded" "Stagnant")

echo "Validating LP: $LP_FILE"
echo "================================"

ERRORS=0
WARNINGS=0

# Check YAML frontmatter
echo -n "Checking YAML frontmatter... "
if ! grep -q "^---$" "$LP_FILE"; then
    print_error "Missing YAML frontmatter"
    ((ERRORS++))
else
    # Extract frontmatter
    FRONTMATTER=$(sed -n '/^---$/,/^---$/p' "$LP_FILE")
    
    # Check required fields
    for field in "lp" "title" "description" "author" "status" "type" "created"; do
        if ! echo "$FRONTMATTER" | grep -q "^$field:"; then
            print_error "Missing required field: $field"
            ((ERRORS++))
        fi
    done
    
    # Check if Standards Track has category
    if echo "$FRONTMATTER" | grep -q "^type: Standards Track"; then
        if ! echo "$FRONTMATTER" | grep -q "^category:"; then
            print_error "Standards Track LPs must have a category"
            ((ERRORS++))
        fi
    fi
    
    # Validate status field
    STATUS=$(echo "$FRONTMATTER" | grep "^status:" | cut -d' ' -f2- | tr -d ' ')
    if [ ! -z "$STATUS" ]; then
        VALID_STATUS=0
        for valid in "${VALID_STATUSES[@]}"; do
            if [ "$STATUS" == "$(echo $valid | tr -d ' ')" ]; then
                VALID_STATUS=1
                break
            fi
        done
        if [ $VALID_STATUS -eq 0 ]; then
            print_error "Invalid status: $STATUS. Must be one of: ${VALID_STATUSES[*]}"
            ((ERRORS++))
        fi
    fi
    
    if [ $ERRORS -eq 0 ]; then
        print_success "Valid"
    fi
fi

# Check required sections based on LP type
echo "Checking required sections..."

# Extract LP type from frontmatter
LP_TYPE=$(grep "^type:" "$LP_FILE" | cut -d: -f2- | xargs)

# Define required sections based on type
if [[ "$LP_TYPE" == "Meta" ]] || [[ "$LP_TYPE" == "Informational" ]]; then
    REQUIRED_SECTIONS=("Abstract" "Motivation")
else
    REQUIRED_SECTIONS=("Abstract" "Motivation" "Specification" "Rationale" "Backwards Compatibility" "Security Considerations")
fi

for section in "${REQUIRED_SECTIONS[@]}"; do
    echo -n "  Checking $section... "
    if ! grep -q "^## $section" "$LP_FILE"; then
        print_error "Missing required section: $section"
        ((ERRORS++))
    else
        print_success "Found"
    fi
done

# Check abstract length
echo -n "Checking abstract length... "
ABSTRACT=$(sed -n '/^## Abstract$/,/^##/p' "$LP_FILE" | sed '1d;$d')
WORD_COUNT=$(echo "$ABSTRACT" | wc -w)
if [ $WORD_COUNT -gt 300 ]; then
    print_warning "Abstract is $WORD_COUNT words (recommended: ~200)"
    ((WARNINGS++))
else
    print_success "OK ($WORD_COUNT words)"
fi

# Check for test cases in Standards Track
if grep -q "^type: Standards Track" "$LP_FILE"; then
    echo -n "Checking for test cases... "
    if ! grep -q "^## Test Cases" "$LP_FILE"; then
        print_warning "Standards Track LPs should include test cases"
        ((WARNINGS++))
    else
        print_success "Found"
    fi
fi

# Check for proper markdown formatting
echo "Checking markdown formatting..."

# Check for broken links
echo -n "  Checking for broken internal links... "
BROKEN_LINKS=$(grep -o '\[.*\](.*)' "$LP_FILE" | grep -v "http" | grep -c "]()" || true)
if [ $BROKEN_LINKS -gt 0 ]; then
    print_warning "Found $BROKEN_LINKS potentially broken links"
    ((WARNINGS++))
else
    print_success "OK"
fi

# Check code blocks
echo -n "  Checking code blocks... "
if grep -q '```' "$LP_FILE"; then
    # Check if code blocks have language specified
    if grep -q '^```$' "$LP_FILE"; then
        print_warning "Code blocks should specify language"
        ((WARNINGS++))
    else
        print_success "OK"
    fi
fi

# Check LP number format
echo -n "Checking LP number format... "
FILENAME=$(basename "$LP_FILE")
if [[ $FILENAME =~ ^lp-[0-9]+\.md$ ]] || [[ $FILENAME =~ ^lp-[0-9]+-r[0-9]+\.md$ ]] || [[ $FILENAME == "lp-draft.md" ]]; then
    print_success "Valid"
else
    print_error "Invalid filename format. Should be 'lp-N.md', 'lp-N-rM.md', or 'lp-draft.md'"
    ((ERRORS++))
fi

# Summary
echo "================================"
echo "Validation Summary:"
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"

if [ $ERRORS -gt 0 ]; then
    print_error "Validation failed with $ERRORS errors"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    print_warning "Validation passed with $WARNINGS warnings"
    exit 0
else
    print_success "Validation passed!"
    exit 0
fi