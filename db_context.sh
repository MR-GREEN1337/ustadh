#!/bin/bash

# Find all .py files in db/models directory and save their names and content to claude_context.txt
find backend/src/db/models -name "*.py" -exec sh -c 'echo "File: {}" >> claude_context.txt; cat {} >> claude_context.txt; echo "\n" >> claude_context.txt' \;
