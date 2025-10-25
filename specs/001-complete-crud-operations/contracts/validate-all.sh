#!/bin/bash
# Validate all OpenAPI contracts

echo "Validating BusinessMap CRUD OpenAPI Contracts..."
echo "================================================"

contracts=(
  "comments-api.yaml"
  "subtasks-api.yaml"
  "custom-fields-api.yaml"
  "workspaces-api.yaml"
  "boards-api.yaml"
  "cards-api.yaml"
)

failed=0
passed=0

for contract in "${contracts[@]}"; do
  echo ""
  echo "Validating: $contract"
  if npx @apidevtools/swagger-cli validate "$contract" 2>&1; then
    echo "✓ $contract is valid"
    ((passed++))
  else
    echo "✗ $contract validation failed"
    ((failed++))
  fi
done

echo ""
echo "================================================"
echo "Results: $passed passed, $failed failed"

if [ $failed -eq 0 ]; then
  echo "✓ All contracts are valid!"
  exit 0
else
  echo "✗ Some contracts have validation errors"
  exit 1
fi
