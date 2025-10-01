# Automation Scripts (v9)

## build_pages.py

Purpose:  
Convert input files (`.pdf`, `.txt`) into haiku `.json` and `.html`.

CLI Options:  
- `--help`        Show usage.  
- `--verbose`     Verbosity (0=quiet, 1=verbose).  
- `--input`       Input dir (default: `inbox`).  
- `--output`      Output dir (default: `data`).  
- `--template`    Template dir (default: `assets`).  
- `--mode`        append (default) or rebuild.  
- `--limit`       Stop after N haiku (default: no limit).  

Outputs:  
- `data/YYYY/MM/DD/haiku.YYYY.MM.DD.SEQ.json`  
- `data/YYYY/MM/DD/haiku.YYYY.MM.DD.SEQ.html`  

## build_tags.py

Purpose:  
- Read all haiku `.json` files.  
- Extract nouns, add/update `tags` in each haiku JSON.  
- Write aggregate `tags.json`.  

## build_manifest.py

Purpose:  
- Read all haiku `.json` files.  
- Build `manifest.json` for indexing and explorer.  

## driver.py (optional wrapper)

Purpose:  
- Orchestrates the full workflow:
  1. Moves inbox to archive batch.  
  2. Runs `build_pages.py` on the batch.  
  3. Runs `build_tags.py` and `build_manifest.py`.  
  4. Optionally commits results to Git.
