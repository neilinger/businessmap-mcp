#!/usr/bin/env python3
"""
Script to add instance parameter to all schema files.
Updates all z.object() declarations to include instanceParameterSchema.
"""

import re
import sys
from pathlib import Path

SCHEMAS_DIR = Path(__file__).parent.parent / "src" / "schemas"

def has_instance_import(content: str) -> bool:
    """Check if file already imports instanceParameterSchema"""
    return "instanceParameterSchema" in content

def add_instance_import(content: str) -> str:
    """Add instanceParameterSchema import to common-schemas import"""
    # Check if already has import from common-schemas
    if "from './common-schemas.js'" in content or 'from "./common-schemas.js"' in content:
        # Add instanceParameterSchema to existing import
        pattern = r"import\s*\{([^}]+)\}\s*from\s*['\"]\.\/common-schemas\.js['\"];"
        match = re.search(pattern, content)
        if match:
            imports = match.group(1).strip()
            if "instanceParameterSchema" not in imports:
                new_imports = f"{imports}, instanceParameterSchema"
                content = re.sub(pattern, f"import {{ {new_imports} }} from './common-schemas.js';", content)
    else:
        # Add new import after first import statement
        pattern = r"(import\s+\{[^}]+\}\s+from\s+['\"][^'\"]+['\"];)"
        match = re.search(pattern, content)
        if match:
            first_import = match.group(1)
            content = content.replace(
                first_import,
                f"{first_import}\nimport {{ instanceParameterSchema }} from './common-schemas.js';"
            )
    return content

def add_instance_to_schema(content: str) -> str:
    """Add ...instanceParameterSchema to all z.object() declarations"""
    # Pattern to match z.object({ ... })
    # We need to find the closing }) and add the spread before it

    # Split into lines for easier processing
    lines = content.split('\n')
    result = []
    in_schema = False
    brace_count = 0
    schema_start = -1

    for i, line in enumerate(lines):
        # Check if this line starts a schema definition
        if 'z.object({' in line:
            in_schema = True
            schema_start = i
            brace_count = line.count('{') - line.count('}')
        elif in_schema:
            brace_count += line.count('{') - line.count('}')

            # If we're closing the schema object
            if brace_count == 0 and '});' in line:
                # Check if instance parameter already added
                schema_lines = lines[schema_start:i+1]
                schema_text = '\n'.join(schema_lines)

                if '...instanceParameterSchema' not in schema_text:
                    # Add the spread parameter before closing
                    if line.strip() == '});':
                        result.append('  ...instanceParameterSchema,')
                    else:
                        # Insert before the });
                        line = line.replace('});', '  ...instanceParameterSchema,\n});')

                in_schema = False
                brace_count = 0
                schema_start = -1

        result.append(line)

    return '\n'.join(result)

def update_schema_file(filepath: Path) -> bool:
    """Update a single schema file with instance parameter"""
    print(f"Processing {filepath.name}...")

    # Skip common-schemas.ts and index.ts
    if filepath.name in ['common-schemas.ts', 'index.ts']:
        print(f"  Skipping {filepath.name}")
        return False

    content = filepath.read_text()

    # Check if already updated
    if '...instanceParameterSchema' in content:
        print(f"  Already updated")
        return False

    # Add import if needed
    if not has_instance_import(content):
        content = add_instance_import(content)

    # Add instance parameter to all schemas
    content = add_instance_to_schema(content)

    # Write back
    filepath.write_text(content)
    print(f"  Updated successfully")
    return True

def main():
    """Main function to update all schema files"""
    if not SCHEMAS_DIR.exists():
        print(f"Error: Schemas directory not found: {SCHEMAS_DIR}")
        sys.exit(1)

    print(f"Updating schemas in {SCHEMAS_DIR}\n")

    updated_count = 0
    for schema_file in SCHEMAS_DIR.glob("*.ts"):
        if update_schema_file(schema_file):
            updated_count += 1

    print(f"\nCompleted: {updated_count} files updated")

if __name__ == "__main__":
    main()
