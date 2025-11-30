#!/bin/bash

# Find all API route files
find app/api -name "route.ts" -type f | while read file; do
  # Check if the file already has dynamic export
  if ! grep -q "export const dynamic" "$file"; then
    # Check if the file uses cookies, headers, or request
    if grep -qE "(cookies\(\)|headers\(\)|request\.url)" "$file"; then
      echo "Adding dynamic export to $file"
      # Add the export after imports
      sed -i '' '/^import/,/^$/!b; /^$/a\
\
export const dynamic = "force-dynamic";
' "$file"
    fi
  fi
done
