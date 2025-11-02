#!/bin/bash

# This script applies multi-instance support updates to all remaining tool files
# It uses sed to make systematic replacements

cd /Users/neil/src/solo/businessmap-mcp/trees/issue-8-multi-instance-config

echo "Applying multi-instance updates to board-tools.ts..."

# Update registerGetColumns
sed -i.bak1 '/private registerGetColumns/,/^  }$/ {
  /async ({ board_id })/ {
    s/async ({ board_id })/async ({ board_id, instance }: any)/
    a\
        try {\
          const client = await getClientForInstance(clientOrFactory, instance);
    s/try {/\
/
  }
}' src/server/tools/board-tools.ts

# Update registerGetLanes
sed -i.bak2 '/private registerGetLanes/,/^  }$/ {
  /async ({ board_id })/ {
    s/async ({ board_id })/async ({ board_id, instance }: any)/
    a\
        try {\
          const client = await getClientForInstance(clientOrFactory, instance);
    s/try {/\
/
  }
}' src/server/tools/board-tools.ts

echo "Script completed"
