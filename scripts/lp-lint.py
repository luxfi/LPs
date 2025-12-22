#!/usr/bin/env python3
"""
LP-lint: Machine-enforceable validation rules per LP-0099 v5.1

Rules:
1. Range check - LP must be in correct range for its domain
2. Status check - Status must match range constraints
3. Content check - Required sections and references
4. Duplicate check - No duplicate LP numbers
5. Filename check - Filename must match frontmatter
"""

import os
import re
import sys
import yaml
from pathlib import Path
from collections import defaultdict

LP_DIR = Path("/Users/z/work/lux/lps/LPs")

# Range definitions per LP-0099 v5.0
RANGES = {
    (0, 99): {
        "name": "Constitutional/Meta",
        "allowed_status": ["Final"],
        "required_status": "Final",
    },
    (100, 999): {
        "name": "Core Protocols",
        "allowed_status": ["Draft", "Final", "Superseded"],
    },
    (1000, 1999): {
        "name": "Chain Specifications",
        "allowed_status": ["Draft", "Final", "Superseded"],
    },
    (2000, 2999): {
        "name": "DAO, Governance & ESG",
        "allowed_status": ["Draft", "Final", "Superseded", "Research"],
    },
    (3000, 3999): {
        "name": "Solidity, Tokens & Web3",
        "allowed_status": ["Draft", "Final", "Superseded"],
    },
    (4000, 4999): {
        "name": "Cryptography/PQC",
        "allowed_status": ["Draft", "Final", "Superseded"],
    },
    (5000, 5999): {
        "name": "AI/Attestation",
        "allowed_status": ["Draft", "Final", "Superseded"],
    },
    (6000, 6999): {
        "name": "Bridges/Interop",
        "allowed_status": ["Draft", "Final", "Superseded"],
    },
    (7000, 7999): {
        "name": "Threshold/MPC",
        "allowed_status": ["Draft", "Final", "Superseded"],
    },
    (8000, 8999): {
        "name": "ZK/Privacy",
        "allowed_status": ["Draft", "Final", "Superseded"],
    },
    (9000, 9999): {
        "name": "DeFi/Markets",
        "allowed_status": ["Draft", "Final", "Superseded"],
    },
    (10000, 19999): {
        "name": "Learning Paths",
        "allowed_status": ["Draft", "Research"],
        "forbidden_status": ["Final"],
    },
    (50000, 59999): {
        "name": "Research Indexes",
        "allowed_status": ["Research"],
        "forbidden_status": ["Final"],
    },
}

VALID_STATUSES = ["Draft", "Final", "Superseded", "Research"]
VALID_TYPES = ["Standards Track", "Meta", "Informational"]
VALID_CATEGORIES = ["Core", "Networking", "Interface", "LRC", "Bridge"]

class LintError:
    def __init__(self, lp_num, file_path, rule, message, severity="error"):
        self.lp_num = lp_num
        self.file_path = file_path
        self.rule = rule
        self.message = message
        self.severity = severity  # error, warning, info
    
    def __str__(self):
        icon = "❌" if self.severity == "error" else "⚠️" if self.severity == "warning" else "ℹ️"
        return f"{icon} LP-{self.lp_num}: [{self.rule}] {self.message}"

def get_range_for_lp(lp_num):
    """Get the range definition for an LP number."""
    for (start, end), info in RANGES.items():
        if start <= lp_num <= end:
            return info
    return None

def parse_frontmatter(content):
    """Parse YAML frontmatter from LP file."""
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return None
    try:
        return yaml.safe_load(match.group(1))
    except yaml.YAMLError:
        return None

def lint_file(file_path):
    """Lint a single LP file and return errors."""
    errors = []
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Parse frontmatter
    fm = parse_frontmatter(content)
    if not fm:
        errors.append(LintError(0, file_path, "parse", "Invalid YAML frontmatter"))
        return errors
    
    lp_num = fm.get('lp')
    if lp_num is None:
        errors.append(LintError(0, file_path, "parse", "Missing 'lp' field in frontmatter"))
        return errors
    
    # Rule 1: Range check
    range_info = get_range_for_lp(lp_num)
    if range_info is None:
        errors.append(LintError(lp_num, file_path, "range", 
            f"LP-{lp_num} is not in any defined range - INVALID"))
    
    # Rule 2: Status check
    status = fm.get('status', '')
    if status not in VALID_STATUSES:
        errors.append(LintError(lp_num, file_path, "status", 
            f"Invalid status '{status}'. Must be one of: {VALID_STATUSES}"))
    
    if range_info:
        # Check if status is allowed for this range
        if "forbidden_status" in range_info and status in range_info["forbidden_status"]:
            errors.append(LintError(lp_num, file_path, "status", 
                f"Status '{status}' is forbidden for {range_info['name']} range"))
        
        if "required_status" in range_info and status != range_info["required_status"]:
            errors.append(LintError(lp_num, file_path, "status", 
                f"Status must be '{range_info['required_status']}' for {range_info['name']} range",
                severity="warning"))
    
    # Rule 3: Type check
    lp_type = fm.get('type', '')
    if lp_type and lp_type not in VALID_TYPES:
        errors.append(LintError(lp_num, file_path, "type", 
            f"Invalid type '{lp_type}'. Must be one of: {VALID_TYPES}"))
    
    # Rule 4: Category check (only for Standards Track)
    if lp_type == "Standards Track":
        category = fm.get('category', '')
        if category and category not in VALID_CATEGORIES:
            errors.append(LintError(lp_num, file_path, "category", 
                f"Invalid category '{category}'. Must be one of: {VALID_CATEGORIES}"))
    
    # Rule 5: Filename check
    expected_prefix = f"lp-{lp_num:04d}-" if lp_num < 10000 else f"lp-{lp_num:05d}-"
    if not file_path.name.startswith(expected_prefix):
        errors.append(LintError(lp_num, file_path, "filename", 
            f"Filename should start with '{expected_prefix}'",
            severity="warning"))
    
    # Rule 6: Required fields
    required_fields = ['lp', 'title', 'status']
    for field in required_fields:
        if field not in fm:
            errors.append(LintError(lp_num, file_path, "required", 
                f"Missing required field: '{field}'"))
    
    # Rule 7: Superseded LP must reference replacement
    if status == "Superseded" and "superseded-by" not in fm:
        errors.append(LintError(lp_num, file_path, "superseded", 
            "Superseded LPs must include 'superseded-by' field",
            severity="warning"))
    
    # Rule 8: Final LP should have reference implementation
    if status == "Final" and lp_type == "Standards Track":
        if "## Reference Implementation" not in content and "## Implementation" not in content:
            errors.append(LintError(lp_num, file_path, "implementation", 
                "Final Standards Track LPs should have Implementation section",
                severity="warning"))
    
    return errors

def check_duplicates(lp_files):
    """Check for duplicate LP numbers."""
    errors = []
    seen = defaultdict(list)
    
    for file_path, lp_num in lp_files.items():
        seen[lp_num].append(file_path)
    
    for lp_num, files in seen.items():
        if len(files) > 1:
            for f in files:
                errors.append(LintError(lp_num, f, "duplicate", 
                    f"Duplicate LP number. Also in: {[str(x) for x in files if x != f]}"))
    
    return errors

def main():
    print("=" * 60)
    print("LP-lint: Canonical Validation (LP-0099 v5.1)")
    print("=" * 60)
    
    all_errors = []
    lp_files = {}
    
    # Collect all LP files and their numbers
    for f in sorted(LP_DIR.glob("lp-*.md")):
        if f.name == "lp-draft.md":
            continue
        
        with open(f, 'r') as file:
            content = file.read()
        
        fm = parse_frontmatter(content)
        if fm and 'lp' in fm:
            lp_files[f] = fm['lp']
    
    print(f"\nFound {len(lp_files)} LP files\n")
    
    # Check duplicates first
    all_errors.extend(check_duplicates(lp_files))
    
    # Lint each file
    for file_path in sorted(lp_files.keys()):
        errors = lint_file(file_path)
        all_errors.extend(errors)
    
    # Report results
    error_count = sum(1 for e in all_errors if e.severity == "error")
    warning_count = sum(1 for e in all_errors if e.severity == "warning")
    
    if all_errors:
        print("\nIssues Found:")
        print("-" * 40)
        
        # Group by LP number
        by_lp = defaultdict(list)
        for e in all_errors:
            by_lp[e.lp_num].append(e)
        
        for lp_num in sorted(by_lp.keys()):
            for e in by_lp[lp_num]:
                print(e)
        
        print()
    
    print("=" * 60)
    print(f"Summary: {error_count} errors, {warning_count} warnings")
    print("=" * 60)
    
    # Exit with error code if there are errors
    if error_count > 0:
        print("\n❌ Lint FAILED")
        sys.exit(1)
    elif warning_count > 0:
        print("\n⚠️ Lint passed with warnings")
        sys.exit(0)
    else:
        print("\n✅ Lint passed")
        sys.exit(0)

if __name__ == "__main__":
    main()
