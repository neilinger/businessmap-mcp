#!/usr/bin/env python3
import re

# Read the file
with open('src/server/tools/board-tools.ts', 'r') as f:
    content = f.read()

# Pattern 1: async (params) => { try { const boards = await client.
# Replace with: async (params: any) => { try { const { instance, ...restParams } = params; const client = await getClientForInstance(clientOrFactory, instance); const boards = await client.

# Pattern 2: async ({ param1, param2 }) => { try { const result = await client.
# Replace with: async ({ param1, param2, instance }: any) => { try { const client = await getClientForInstance(clientOrFactory, instance); const result = await client.

# Pattern 3: references to just 'client' need to be updated

# Replace pattern: async (params) => {
content = re.sub(
    r'async \(params\) => \{\s*try \{\s*const ',
    r'async (params: any) => {\n        try {\n          const { instance, ...restParams } = params;\n          const client = await getClientForInstance(clientOrFactory, instance);\n          const ',
    content
)

# Replace 'await client.getBoards(params)' with 'await client.getBoards(restParams)'
content = content.replace('await client.getBoards(params)', 'await client.getBoards(restParams)')

# Pattern for destructured params without instance
# async ({ board_id, board_name, workspace_id }) => {
patterns_to_fix = [
    (r'async \(\{ board_id, board_name, workspace_id \}\) => \{',
     r'async ({ board_id, board_name, workspace_id, instance }: any) => {'),
    (r'async \(\{ board_id \}\) => \{',
     r'async ({ board_id, instance }: any) => {'),
    (r'async \(\{ name, description, workspace_id \}\) => \{',
     r'async ({ name, description, workspace_id, instance }: any) => {'),
    (r'async \(\{ board_id, name, description \}\) => \{',
     r'async ({ board_id, name, description, instance }: any) => {'),
    (r'async \(\{ card_id, archive_first = true \}\) => \{',
     r'async ({ card_id, archive_first = true, instance }: any) => {'),
    (r'async \(\{ resource_ids, analyze_dependencies = true \}\) => \{',
     r'async ({ resource_ids, analyze_dependencies = true, instance }: any) => {'),
    (r'async \(\{ workflow_id, name, position, color, description \}\) => \{',
     r'async ({ workflow_id, name, position, color, description, instance }: any) => {'),
    (r'async \(\{ lane_id \}\) => \{',
     r'async ({ lane_id, instance }: any) => {'),
]

for pattern, replacement in patterns_to_fix:
    content = re.sub(pattern, replacement, content)

# Now add getClientForInstance call after try { in methods where we have destructured params
# Pattern: after async ({ ... instance }: any) => {\n        try {
# Add: const client = await getClientForInstance(clientOrFactory, instance);

# Find all instances where we have destructured params with instance but no getClientForInstance yet
# Look for: async ({ .*instance.*}: any) => {\n\s*try {\n\s*(?!const client = await getClientForInstance)
def add_get_client(match):
    """Add getClientForInstance call if not present"""
    full_match = match.group(0)
    if 'getClientForInstance' not in full_match:
        # Insert after 'try {'
        return full_match.replace('try {\n', 'try {\n          const client = await getClientForInstance(clientOrFactory, instance);\n')
    return full_match

# Pattern to find async handlers with instance param
handler_pattern = r'async \(\{[^}]*instance[^}]*\}: any\) => \{[^}]*try \{[^\n]*\n(?:\s*const client = await getClientForInstance)?'
content = re.sub(handler_pattern, add_get_client, content, flags=re.DOTALL)

# Write the file back
with open('src/server/tools/board-tools.ts', 'w') as f:
    f.write(content)

print("Board tools updated successfully")
