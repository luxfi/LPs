#!/usr/bin/env python3

"""
Update Index Script
Automatically updates the LP index in README.md based on LP files
"""

import os
import re
try:
    import yaml
    _yaml_available = True
except ImportError:
    _yaml_available = False
from datetime import datetime
from pathlib import Path

def extract_frontmatter(filepath):
    """Extract YAML frontmatter from a markdown file"""
    with open(filepath, 'r') as f:
        content = f.read()

    # Find frontmatter between --- markers
    match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.MULTILINE | re.DOTALL)
    if not match:
        return None
    fm_text = match.group(1)
    if _yaml_available:
        try:
            return yaml.safe_load(fm_text)
        except Exception:
            print(f"Error parsing YAML in {filepath}")
            return None

    # Fallback: simple parse of key: value pairs
    data = {}
    for line in fm_text.splitlines():
        if ':' in line:
            key, val = line.split(':', 1)
            data[key.strip()] = val.strip().strip('"').strip("'")
    return data

def get_all_lps(directory='LPs'):
    """Get all LP files and their metadata"""
    lps = []
    
    for filename in os.listdir(directory):
        if filename.endswith('.md') and filename.startswith('lp-'):
            filepath = os.path.join(directory, filename)
            frontmatter = extract_frontmatter(filepath)
            
            if frontmatter:
                # Extract LP number from filename
                match = re.search(r'lp-(\d+)\.md', filename)
                if match:
                    lp_number = int(match.group(1))
                    frontmatter['number'] = lp_number
                    frontmatter['filename'] = filename
                    lps.append(frontmatter)
    
    # Sort by LP number
    lps.sort(key=lambda x: x['number'])
    return lps

def categorize_lps(lps):
    """Categorize LPs by type and category"""
    categories = {
        'meta': [],
        'core': [],
        'networking': [],
        'interface': [],
        'lrc': [],
        'informational': []
    }
    
    for lp in lps:
        lp_type = lp.get('type', '').lower()
        category = lp.get('category', '').lower()
        
        if lp_type == 'meta':
            categories['meta'].append(lp)
        elif lp_type == 'informational':
            categories['informational'].append(lp)
        elif lp_type == 'standards track':
            if category == 'core':
                categories['core'].append(lp)
            elif category == 'networking':
                categories['networking'].append(lp)
            elif category == 'interface':
                categories['interface'].append(lp)
            elif category == 'lrc':
                categories['lrc'].append(lp)
    
    return categories

def format_table_row(lp):
    """Format a LP as a markdown table row"""
    number = lp['number']
    title = lp.get('title', 'Untitled')
    authors = lp.get('author', 'Unknown')
    lp_type = lp.get('type', 'Unknown')
    category = lp.get('category', '-')
    status = lp.get('status', 'Unknown')
    
    # Clean up authors (remove emails/github handles for brevity)
    authors = re.sub(r'\s*\([^)]*\)', '', authors)
    authors = re.sub(r'\s*<[^>]*>', '', authors)
    
    # Truncate long titles
    if len(title) > 50:
        title = title[:47] + '...'
    
    return f"| [LP-{number}](./LPs/lp-{number}.md) | {title} | {authors} | {lp_type} | {category} | {status} |"

def generate_index_section():
    """Generate the index section for README"""
    lps = get_all_lps()
    
    if not lps:
        return "No LPs found."
    
    # Main table
    output = ["## LP Index\n"]
    output.append("| Number | Title | Author(s) | Type | Category | Status |")
    output.append("|:-------|:------|:----------|:-----|:---------|:-------|")
    
    for lp in lps:
        output.append(format_table_row(lp))
    
    # LRC-specific table
    lrcs = [lp for lp in lps if lp.get('category', '').lower() == 'lrc']
    if lrcs:
        output.append("\n### Notable LRCs (Application Standards)\n")
        output.append("| LRC Number | LP | Title | Status |")
        output.append("|:-----------|:----|:------|:-------|")
        
        for lrc in lrcs:
            number = lrc['number']
            title = lrc.get('title', 'Untitled')
            status = lrc.get('status', 'Unknown')

            # Extract LRC number from title if present
            lrc_match = re.search(r'LRC-(\d+)', title)
            if lrc_match:
                lrc_num = f"LRC-{lrc_match.group(1)}"
            else:
                lrc_num = f"LRC-{number}"

            output.append(f"| {lrc_num} | [LP-{number}](./LPs/lp-{number}.md) | {title} | {status} |")
    
    return '\n'.join(output)

def update_readme():
    """Update the README.md file with the new index"""
    readme_path = 'README.md'
    
    # Read current README
    with open(readme_path, 'r') as f:
        content = f.read()
    
    # Find the section to replace
    start_marker = "## LP Index"
    end_marker = "## LP Process"
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    if start_idx == -1 or end_idx == -1:
        print("Could not find the index section in README.md")
        return False
    
    # Generate new index
    new_index = generate_index_section()
    
    # Replace the section
    new_content = content[:start_idx] + new_index + "\n\n" + content[end_idx:]
    
    # Write back
    with open(readme_path, 'w') as f:
        f.write(new_content)

    # Clean up and normalize markdown: remove tabs, replacement characters, and normalize lists
    with open(readme_path, 'r') as f:
        content = f.read().replace('\t', '').replace('\uFFFC', '')
    # Remove leading spaces before bullet and numbered list markers
    content = re.sub(r'(?m)^\s+([•])', r'\1', content)
    content = re.sub(r'(?m)^\s+([0-9]+\.)', r'\1', content)
    # Convert bullet characters to hyphens for proper markdown lists
    content = content.replace('•', '-')
    # Normalize bullet marker spacing
    content = re.sub(r'(?m)^- +', '- ', content)
    with open(readme_path, 'w') as f:
        f.write(content)

    print(f"README.md updated successfully!")
    return True

def generate_statistics():
    """Generate statistics about LPs"""
    lps = get_all_lps()
    categories = categorize_lps(lps)
    
    print("\nLP Statistics:")
    print(f"  Total LPs: {len(lps)}")
    print(f"  Meta: {len(categories['meta'])}")
    print(f"  Core: {len(categories['core'])}")
    print(f"  Networking: {len(categories['networking'])}")
    print(f"  Interface: {len(categories['interface'])}")
    print(f"  LRC: {len(categories['lrc'])}")
    print(f"  Informational: {len(categories['informational'])}")
    
    # Status breakdown
    status_count = {}
    for lp in lps:
        status = lp.get('status', 'Unknown')
        status_count[status] = status_count.get(status, 0) + 1
    
    print("\nStatus Breakdown:")
    for status, count in sorted(status_count.items()):
        print(f"  {status}: {count}")

if __name__ == "__main__":
    print("Updating LP index...")
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir.parent)
    
    # Update README
    if update_readme():
        generate_statistics()
    else:
        print("Failed to update README.md")