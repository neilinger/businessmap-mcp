#!/usr/bin/env python3
"""
Script to update all tool handlers to support multi-instance configuration
"""
import re
import sys

def update_tool_file(filepath):
    """Update a single tool file to add instance parameter support"""
    print(f"Updating {filepath}...")

    with open(filepath, 'r') as f:
        content = f.read()

    # Track if we made changes
    original_content = content

    # Pattern 1: async ({ param1, param2 }) => { try { ... await client.method()
    # Need to add 'instance' to params and add getClientForInstance call

    # Find all async handlers that don't have instance yet
    def fix_handler(match):
        full = match.group(0)
        params = match.group(1)
        body = match.group(2)

        # Skip if already has instance
        if 'instance' in params or 'getClientForInstance' in body:
            return full

        # Add instance to params
        if params.strip() == '':
            new_params = '{ instance }: any'
        else:
            new_params = params.rstrip('}') + ', instance }: any'

        # Add getClientForInstance call
        indent = '          '
        client_call = f'{indent}const client = await getClientForInstance(clientOrFactory, instance);\n{indent}'

        return f'async ({new_params}) => {{\n        try {{\n{client_call}{body}'

    # Match: async ({ params }) => { try { code
    pattern = r'async \((\{[^}]*\})\) => \{\s*try \{\s*(.*?)(?=\n\s*\})'
    content = re.sub(pattern, fix_handler, content, flags=re.DOTALL)

    # Pattern 2: async (params) => { try { const var = params; ... await client.method(params)
    def fix_params_handler(match):
        full = match.group(0)

        # Skip if already has instance
        if 'instance' in full or 'getClientForInstance' in full:
            return full

        # Replace: async (params) => { try {
        # With: async (params: any) => { try { const { instance, ...restParams } = params; const client = await getClientForInstance(clientOrFactory, instance);
        fixed = full.replace(
            'async (params) => {\n        try {\n          ',
            'async (params: any) => {\n        try {\n          const { instance, ...restParams } = params;\n          const client = await getClientForInstance(clientOrFactory, instance);\n          '
        )

        # Also replace 'client.method(params)' with 'client.method(restParams)'
        fixed = re.sub(r'client\.(\w+)\(params\)', r'client.\1(restParams)', fixed)

        return fixed

    pattern2 = r'async \(params\) => \{\s*try \{.*?(?=\n\s*\}\s*\n\s*\})'
    content = re.sub(pattern2, fix_params_handler, content, flags=re.DOTALL)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✓ Updated {filepath}")
        return True
    else:
        print(f"  - No changes needed for {filepath}")
        return False

def main():
    files = [
        'src/server/tools/board-tools.ts',
        'src/server/tools/card-tools.ts',
    ]

    updated = 0
    for filepath in files:
        try:
            if update_tool_file(filepath):
                updated += 1
        except Exception as e:
            print(f"Error updating {filepath}: {e}", file=sys.stderr)

    print(f"\nUpdated {updated} files")

if __name__ == '__main__':
    main()
