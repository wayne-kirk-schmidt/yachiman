# Haiku Project Automation (v9)

This repository manages automated processing of haiku from raw sources into web-ready pages.

## Workflow Process

- Input: drop `.pdf` or `.txt` files in `inbox/`  
- Processing: run scripts to generate per-haiku `.json` + `.html`  
- Enrichment: add tags, build manifests  
- Output: ready-to-serve static website under `data/`

## Workflow Steps

1. Install dependencies:  
   ```bash
   pip install -r requirements.txt
   ```

2. Drop input files into `inbox/`.

3. Split the inbox files into appropriate source files
   ```bash
   python3 ./scripts/split_inbox_file.py --src ./inbox/<yyyymm.inbox.txt --dst ./inbox --startdate <yyyymmdd> --number 3 --verbose
   ```
4. Build out the pages
   ```bash
   python3 ./scripts/build_environment.py --phase pages --verbose 9
   ```
4. Build out the tags
   ```bash
   python3 ./scripts/build_environment.py --phase tags --verbose 9
   ```
5. Build out the manifest
   ```bash
   python3 ./scripts/build_environment.py --phase manifest --verbose 9
   ```
6. Validate the results of the build
   ```bash
   bash ./scripts/checkme.ksh
   ```
