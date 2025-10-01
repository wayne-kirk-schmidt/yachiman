#!/bin/bash
# unpack_batches.sh
# Unpack all batch_XXX_processed.zip files
# Moves leftovers.txt to batch_XXX_leftovers.txt

for zip in batch_*_processed.zip; do
    echo "Processing $zip ..."
    batch_name=$(basename "$zip" .zip)

    # Make a folder to extract into
    mkdir -p "$batch_name"
    unzip -o "$zip" -d "$batch_name" >/dev/null

    # If leftovers.txt exists, rename it uniquely
    if [ -f "$batch_name/leftovers.txt" ]; then
        mv "$batch_name/leftovers.txt" "${batch_name}_leftovers.txt"
        echo "  → Leftovers saved as ${batch_name}_leftovers.txt"
    fi
done
