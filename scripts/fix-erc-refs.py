#!/usr/bin/env python3
"""Fix cross-references after ERC alignment"""

import os
import re

LP_DIR = "/Users/z/work/lux/lps/LPs"

# Old → New mapping
REMAP = {
    3024: 3612, 3026: 3363, 3027: 3009, 3030: 3528,
    3050: 3165, 3051: 3173, 3052: 3967, 3053: 3201,
    3054: 3169, 3055: 3572,
    3100: 3155, 3101: 3157, 3102: 3525, 3150: 3909,
    3200: 3721, 3201: 3722, 3202: 3723, 3203: 3981,
    3204: 3675, 3220: 3192, 3230: 3551,
    3300: 3337, 3301: 3338, 3302: 3271, 3303: 3579,
    3400: 3626, 3401: 3627, 3410: 3156, 3420: 3777,
}

def fix_refs(content):
    """Replace old LP references with new ones"""
    changes = 0
    for old, new in REMAP.items():
        # Match LP-XXXX, lp-XXXX, LP XXXX patterns
        patterns = [
            (rf'\bLP-{old}\b', f'LP-{new}'),
            (rf'\blp-{old}\b', f'lp-{new}'),
            (rf'requires:.*\b{old}\b', lambda m: m.group(0).replace(str(old), str(new))),
        ]
        for pat, repl in patterns:
            new_content, n = re.subn(pat, repl, content)
            if n > 0:
                changes += n
                content = new_content
    return content, changes

def main():
    total_changes = 0
    files_changed = 0
    
    for f in os.listdir(LP_DIR):
        if not f.endswith('.md'):
            continue
        
        path = os.path.join(LP_DIR, f)
        with open(path, 'r') as file:
            content = file.read()
        
        new_content, changes = fix_refs(content)
        
        if changes > 0:
            with open(path, 'w') as file:
                file.write(new_content)
            print(f"{f}: {changes} refs fixed")
            total_changes += changes
            files_changed += 1
    
    print(f"\nTotal: {total_changes} refs fixed in {files_changed} files")

if __name__ == '__main__':
    main()
