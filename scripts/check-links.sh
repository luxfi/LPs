#!/bin/bash

# Enhanced Link Checker Script v2
# Checks all links in LP files for validity with smart handling

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Track stats
TOTAL_LINKS=0
BROKEN_LINKS=0
SKIPPED_LINKS=0
EXTERNAL_CHECKED=0
EXTERNAL_BROKEN=0

# Check if URL returns 200
check_url() {
    local url=$1
    local status=$(curl -sSfI --max-time 10 --connect-timeout 5 "$url" 2>/dev/null | head -1 | cut -d' ' -f2)
    if [ "$status" = "200" ] || [ "$status" = "301" ] || [ "$status" = "302" ]; then
        echo "200"
    else
        echo "$status"
    fi
}

# Check if local file exists
check_local_file() {
    local file=$1
    local base_dir=$2
    file=${file#./}
    if [ -f "$base_dir/$file" ]; then
        echo "found"
    else
        echo "not_found"
    fi
}

# Check LP file with multiple naming formats
check_lp_file() {
    local lp_num=$1
    local file_dir=$2
    for format in "lp-$lp_num.md" "lp-0$lp_num.md"; do
        if [ -f "$file_dir/$format" ]; then
            echo "found:$format"
            return 0
        fi
    done
    echo "not_found"
}

# Check if line looks like Go code (not a real link)
is_go_code() {
    local line=$1
    # Go type signatures often contain: space comma type patterns
    # Real markdown links have [text](url) format
    if [[ $line =~ ^[a-zA-Z_]+[[:space:]]+[a-zA-Z_]+(\[[^]]+\])?[[:space:]]*,[[:space:]]*[a-zA-Z_]+ ]]; then
        return 0
    fi
    # Lines with multiple spaces and types
    if [[ $line =~ ^(store|ctx|fn|func|config|config|type|interface)[[:space:]] ]]; then
        return 0
    fi
    return 1
}

echo "Checking links in LP files..."
echo "=============================="

for file in $(find LPs -name "*.md" -type f | sort); do
    echo -e "\nChecking: $file"

    # Extract links properly - only from markdown [text](url) format
    links=$(grep -oE '\[([^]]+)\]\(([^)]+)\)' "$file" 2>/dev/null | sed -E 's/\[([^]]+)\]\(([^)]+)\)/\2/g' | sort -u)

    if [ -z "$links" ]; then
        echo "  No links found"
        continue
    fi

    file_dir=$(dirname "$file")

    while IFS= read -r link; do
        TOTAL_LINKS=$((TOTAL_LINKS + 1))

        [ -z "$link" ] && continue

        # Skip anchor links
        if [[ $link == "#"* ]]; then
            echo -n "  Anchor: $link "
            print_success "Skipped"
            SKIPPED_LINKS=$((SKIPPED_LINKS + 1))
            continue
        fi

        # Skip Go code patterns
        if is_go_code "$link"; then
            echo -n "  Go code: $link "
            print_warning "Skipped (code)"
            SKIPPED_LINKS=$((SKIPPED_LINKS + 1))
            continue
        fi

        # Handle external URLs
        if [[ $link == http://* ]] || [[ $link == https://* ]]; then
            echo -n "  External: $link "

            # Skip docs site paths
            if [[ $link == *"/docs/lp-"* ]] || [[ $link == *"/docs/category/"* ]]; then
                print_warning "Docs route (skip)"
                SKIPPED_LINKS=$((SKIPPED_LINKS + 1))
                continue
            fi

            # Skip external repo internal paths (not checkable locally)
            if [[ $link == *github.com*"/blob/"* ]] || [[ $link == *github.com*"/tree/"* ]]; then
                if [ "$SKIP_EXTERNAL" = "1" ]; then
                    print_warning "Skipped"
                    SKIPPED_LINKS=$((SKIPPED_LINKS + 1))
                else
                    status=$(check_url "$link")
                    EXTERNAL_CHECKED=$((EXTERNAL_CHECKED + 1))
                    if [ "$status" = "200" ]; then
                        print_success "Valid"
                    else
                        print_error "Broken ($status)"
                        BROKEN_LINKS=$((BROKEN_LINKS + 1))
                        EXTERNAL_BROKEN=$((EXTERNAL_BROKEN + 1))
                    fi
                fi
            else
                print_warning "External URL (skip)"
                SKIPPED_LINKS=$((SKIPPED_LINKS + 1))
            fi
            continue
        fi

        # Handle local file references
        echo -n "  Local: $link "

        # Skip docs site routing paths
        if [[ $link == /docs/* ]]; then
            print_warning "Docs route (skip)"
            SKIPPED_LINKS=$((SKIPPED_LINKS + 1))
            continue
        fi

        # Skip absolute filesystem paths
        if [[ $link == /* ]]; then
            print_warning "FS path (skip)"
            SKIPPED_LINKS=$((SKIPPED_LINKS + 1))
            continue
        fi

        # Check for LP file references (lp-NNN or just NNN)
        if [[ $link =~ ^\.\/lp-([0-9]+) ]] || [[ $link =~ ^lp-([0-9]+) ]]; then
            lp_num="${BASH_REMATCH[1]}"
            result=$(check_lp_file "$lp_num" "$file_dir")
            if [[ $result == found:* ]]; then
                print_success "Found (${result#found:})"
            else
                nearby=$(ls "$file_dir"/lp-${lp_num}*.md 2>/dev/null | head -1)
                if [ -n "$nearby" ]; then
                    basename_near=$(basename "$nearby")
                    print_error "Not found - did you mean ./$basename_near?"
                else
                    print_error "Not found"
                fi
                BROKEN_LINKS=$((BROKEN_LINKS + 1))
            fi
            continue
        fi

        # Regular local file check
        result=$(check_local_file "$link" "$file_dir")
        if [ "$result" = "found" ]; then
            print_success "Found"
        else
            print_error "Not found"
            BROKEN_LINKS=$((BROKEN_LINKS + 1))
        fi
    done <<< "$links"
done

echo -e "\n=============================="
echo "Link Check Summary:"
echo "  Files checked: $(find LPs -name "*.md" -type f | wc -l)"
echo "  Total links: $TOTAL_LINKS"
echo "  Skipped: $SKIPPED_LINKS"
echo "  External checked: $EXTERNAL_CHECKED"
echo "  Broken links: $BROKEN_LINKS"
if [ $EXTERNAL_BROKEN -gt 0 ]; then
    echo "  External broken: $EXTERNAL_BROKEN"
fi

echo ""
if [ $BROKEN_LINKS -gt 0 ]; then
    print_error "Found $BROKEN_LINKS broken links!"
    echo ""
    echo "Tip: Run with SKIP_EXTERNAL=1 to skip external URL checks"
    exit 1
else
    print_success "All links are valid!"
    exit 0
fi
