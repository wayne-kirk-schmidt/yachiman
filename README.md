# Haiku Project Automation (v9)

This repository manages automated processing of haiku from raw sources into web-ready pages.

## Overview

- Input: drop `.pdf` or `.txt` files in `inbox/`  
- Processing: run scripts to generate per-haiku `.json` + `.html`  
- Enrichment: add tags, build manifests  
- Output: ready-to-serve static website under `data/`

## Quick Start

1. Install dependencies:  
   ```bash
   pip install -r requirements.txt
   ```

2. Drop input files into `inbox/`.

3. Run the workflow:  
   ```bash
   python scripts/build_pages.py --verbose 1
   python scripts/build_tags.py
   python scripts/build_manifest.py
   ```

4. Commit results:  
   ```bash
   git add data archive manifest.json tags.json
   git commit -m "Add new haiku batch"
   git push
   ```

## Documentation

- [Schema](docs/SCHEMA.md)  
- [Workflow](docs/WORKFLOW.md)  
- [Scripts](docs/SCRIPTS.md)
