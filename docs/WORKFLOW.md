# Haiku Automation Workflow (v9)

## Directories

- `inbox/`  
  Drop raw `.pdf` or `.txt` files here for processing.

- `archive/`  
  After each run, all files from `inbox/` are moved into a timestamped folder:  
  ```
  archive/YYYY-MM-DD-HHMMSS/
  ```

- `data/`  
  Generated haiku pages and JSON metadata live here:  
  ```
  data/YYYY/MM/DD/haiku.YYYY.MM.DD.SEQ.html
  data/YYYY/MM/DD/haiku.YYYY.MM.DD.SEQ.json
  ```

- `docs/`  
  Documentation (schema, workflow, usage).

- `assets/`  
  Shared template and static resources:
  - `haiku.template.html`
  - `haiku.css`
  - `haiku-page.js`

## Workflow Steps

1. Drop files in inbox  
2. Run automation (`build_pages.py`, `build_tags.py`, `build_manifest.py`)  
3. Archive sources into `archive/YYYY-MM-DD-HHMMSS/`  
4. Commit changes to Git  

## Modes

- Append (default): process new files in inbox.  
- Rebuild: clear `data/`, rebuild from all archived batches.
