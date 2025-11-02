#!/usr/bin/env python3
"""
Script to update all schema files to add instance parameter
"""
import re
import os

def update_schema_file(filepath):
    """Update a single schema file to add instanceParameterSchema"""
    print(f"Updating {filepath}...")

    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content

    # Check if we already have the import
    if 'import { instanceParameterSchema } from' not in content:
        # Add import after first import statement
        content = re.sub(
            r"(import { z } from 'zod';)",
            r"\1\nimport { instanceParameterSchema } from './common-schemas.js';",
            content
        )

    # Find all z.object({ ... }) exports and add ...instanceParameterSchema
    def add_instance_param(match):
        full = match.group(0)
        schema_name = match.group(1)
        schema_body = match.group(2)

        # Skip if already has instanceParameterSchema
        if '...instanceParameterSchema' in schema_body or 'instanceParameterSchema' in schema_name:
            return full

        # Skip utility schemas that are truly empty (no parameters at all)
        if schema_body.strip() == '':
            # These empty schemas should get instance param
            return f"export const {schema_name} = z.object({{\n  ...instanceParameterSchema,\n}});"

        # Add ...instanceParameterSchema at the end of the schema body
        # Find the last property before the closing brace
        if schema_body.strip():
            # Has content, add instance param after existing props
            return f"export const {schema_name} = z.object({{{schema_body}  ...instanceParameterSchema,\n}});"
        else:
            # Empty object, just add instance param
            return f"export const {schema_name} = z.object({{\n  ...instanceParameterSchema,\n}});"

    # Pattern: export const somethingSchema = z.object({ ... });
    pattern = r'export const (\w+Schema) = z\.object\(\{([^}]*)\}\);'
    content = re.sub(pattern, add_instance_param, content, flags=re.DOTALL)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✓ Updated {filepath}")
        return True
    else:
        print(f"  - No changes needed for {filepath}")
        return False

def main():
    schema_files = [
        'src/schemas/board-schemas.ts',
        'src/schemas/card-schemas.ts',
        'src/schemas/bulk-schemas.ts',
    ]

    updated = 0
    for filepath in schema_files:
        try:
            if os.path.exists(filepath):
                if update_schema_file(filepath):
                    updated += 1
            else:
                print(f"File not found: {filepath}")
        except Exception as e:
            print(f"Error updating {filepath}: {e}")

    print(f"\nUpdated {updated} schema files")

if __name__ == '__main__':
    main()
