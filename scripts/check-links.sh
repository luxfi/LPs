#!/bin/bash

# Link Checker Script
# Checks all links in LP files for validity

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to check if URL is valid (skippable for restricted networks)
check_url() {
    local url=$1
    # Allow skipping external checks in restricted environments
    if [ "$SKIP_EXTERNAL" = "1" ]; then
        return 0
    fi
    # Conservative curl options to avoid long hangs
    if curl -sSfI --max-time 10 --connect-timeout 5 "$url" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to check if local file exists
check_local_file() {
    local file=$1
    local base_dir=$2
    
    # Remove leading ./
    file=${file#./}
    
    # Check relative to base directory
    if [ -f "$base_dir/$file" ]; then
        return 0
    else
        return 1
    fi
}

echo "Checking links in LP files..."
echo "=============================="

TOTAL_LINKS=0
BROKEN_LINKS=0
CHECKED_FILES=0

# Find LP markdown files only (scope per repo guidelines)
for file in $(find LPs -name "*.md" -type f); do
    ((CHECKED_FILES++))
    echo -e "\nChecking: $file"
    
    # Extract all links from the file
    # Matches [text](url) pattern
    links=$(grep -oE '\[([^]]+)\]\(([^)]+)\)' "$file" | sed -E 's/\[([^]]+)\]\(([^)]+)\)/\2/g')
    
    if [ -z "$links" ]; then
        echo "  No links found"
        continue
    fi
    
    # Get directory of current file for relative links
    file_dir=$(dirname "$file")
    
    # Check each link
    while IFS= read -r link; do
        ((TOTAL_LINKS++))
        
        # Skip empty links
        if [ -z "$link" ]; then
            continue
        fi
        
        # Skip anchor links
        if [[ $link == "#"* ]]; then
            echo -n "  Anchor: $link "
            print_success "Skipped"
            continue
        fi
        
        # Check if it's an external URL
        if [[ $link == http://* ]] || [[ $link == https://* ]]; then
            echo -n "  External: $link "
            if [ "$SKIP_EXTERNAL" = "1" ]; then
                print_warning "Skipped"
            elif check_url "$link"; then
                print_success "Valid"
            else
                print_error "Broken"
                ((BROKEN_LINKS++))
            fi
        else
            # It's a local file reference
            echo -n "  Local: $link "
            if check_local_file "$link" "$file_dir"; then
                print_success "Found"
            else
                print_error "Not found"
                ((BROKEN_LINKS++))
            fi
        fi
    done <<< "$links"
done

echo -e "\n=============================="
echo "Link Check Summary:"
echo "  Files checked: $CHECKED_FILES"
echo "  Total links: $TOTAL_LINKS"
echo "  Broken links: $BROKEN_LINKS"

if [ $BROKEN_LINKS -gt 0 ]; then
    print_error "Found $BROKEN_LINKS broken links!"
    exit 1
else
    print_success "All links are valid!"
    exit 0
fi
