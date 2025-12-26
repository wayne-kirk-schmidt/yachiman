# Haiku Project – Scripts


## Table of Contents

- [split_inbox_file.py](#1-split_inbox_filepy)
- [build_environment.py](#2-build_environmentpy)
  - [Phase: pages](#21-phase-pages)
  - [Phase: tags](#22-phase-tags)
  - [Phase: manifest](#23-phase-manifest)
- [generate_haiku_seed.py](#3-generate_haiku_seedpy)
- [build_dictionary.py](#4-build_dictionarypy)
- [checkme.ksh](#5-checkmeksh)
- [requirements.txt](#6-requirementstxt)
- [Script Invariants](#script-invariants)

---

the following are scripts that make up the Haiku automation pipeline.

Each script has a single purpose.

Scripts are designed to be composable and deterministic

Scripts are one way: no script mutates upstream artifacts.

---

## 1. split_inbox_file.py

### Purpose

Normalize raw inbox content into dated, fixed-size inbox files.

This script operates purely on text and separators.
It does not understand haiku semantics beyond the `###` delimiter.

### Responsibilities

- Read one inbox file or a directory of inbox files
- Split content on the literal separator `###`
- Trim leading and trailing whitespace per haiku block
- Discard empty blocks
- Pack haiku blocks into daily inbox files
- Advance the date deterministically per output file

### Inputs

- `--src`  
  Source inbox file or directory

- `--dst`  
  Destination directory for generated inbox files

- `--startdate`  
  Start date for the first output file  
  Formats supported: `YYYYMMDD`, `YYYY-MM-DD`

- `--number`  
  Number of haiku entries per output day

### Outputs

- One or more files named:
  ```
  YYYYMMDD.inbox.txt
  ```

### Design Notes

- Supports dry-run mode for inspection
- Preserves internal newlines within haiku
- Does not generate metadata
- Does not archive source files

---

## 2. build_environment.py

### Purpose

Primary orchestrator for building haiku artifacts.

This script coordinates all structured build phases and enforces
phase isolation and idempotency.

### Supported Phases

- `pages`
- `tags`
- `manifest`
- `all`

Each phase can be run independently.

---

### 2.1 Phase: pages

#### Purpose

Convert inbox text files into per-haiku JSON and HTML artifacts.

#### Responsibilities

- Read `.txt` files from the inbox directory
- Split haiku entries on `###`
- Assign dates and sequence numbers
- Generate canonical haiku JSON files
- Render HTML files from templates
- Extract candidate words from haiku text
- Filter tags using intrinsic NLTK POS rules
- Archive processed inbox files

#### Outputs

- `data/YYYY/MM/DD/haiku.YYYY-MM-DD.NN.json`
- `data/YYYY/MM/DD/haiku.YYYY-MM-DD.NN.html`
- Archived inbox files under `archive/`

#### Design Notes

- JSON is the authoritative artifact
- HTML is rendered, not parsed downstream
- Tag extraction allows nouns and adjectives only
- POS filtering is intrinsic, not contextual

---

### 2.2 Phase: tags

#### Purpose

Build a global tag index from existing haiku JSON files.

#### Responsibilities

- Scan all haiku JSON files under `data/`
- Re-filter existing tags using NLTK POS rules
- Count tag usage across haiku entries
- Build reverse mappings from tag to haiku IDs

#### Outputs

- `data/tags.json`

#### Design Notes

- No new tags are inferred
- Historical tag pollution is corrected here
- Tags are rebuilt deterministically from page JSON

---

### 2.3 Phase: manifest

#### Purpose

Build a lightweight navigation index for all haiku pages.

#### Responsibilities

- Scan all haiku JSON files under `data/`
- Re-filter tags for semantic correctness
- Extract minimal metadata for navigation
- Emit a flat manifest structure

#### Outputs

- `data/manifest.json`

#### Design Notes

- Manifest does not embed haiku text
- Designed for lazy loading in client applications
- Manifest size may be sharded in future versions

---

## 3. generate_haiku_seed.py

### Purpose

Generate haiku seed text using an AI agent under strict constraints.

This script feeds the inbox pipeline but is not part of the page build phases.

### Responsibilities

- Load instruction and template files
- Compose a prompt using a `{{TEMPLATE}}` placeholder
- Call the configured AI agent
- Validate strict output structure
- Write generated haiku seeds to a file

### Validation Rules

- Exactly three haiku lines
- Final line must be literal `###`

### Design Notes

- Enforces deterministic structural output
- Supports dry-run and verbose inspection
- Uses environment variable for API key
- Output is intended for inbox ingestion

---

## 4. build_dictionary.py

### Purpose

Construct a syllable-aware word dictionary derived from haiku tags.

### Responsibilities

- Read a list of words (typically from tags)
- Normalize and deduplicate entries
- Estimate syllable counts
- Assign conservative parts of speech
- Emit a YAML dictionary file

### Outputs

- `dictionary.yaml`

### Design Notes

- Syllable estimation is intentionally simple
- POS assignment is conservative by design
- Intended for downstream haiku generation support

---

## 5. checkme.ksh

### Purpose

Perform post-build validation checks.

### Responsibilities

- Verify presence of expected output files
- Validate basic structural assumptions
- Surface obvious build failures

### Design Notes

- Intended as a guardrail, not a test suite
- Run after all build phases complete

---

## 6. requirements.txt

### Purpose

Declare Python dependencies required by the Haiku project.

### Contents

Includes libraries for:
- PDF and text ingestion
- Natural language processing (NLTK)
- AI agent interaction

### Design Notes

- Explicit dependency list
- Intended to be installed via pip

---

## Script Invariants

- Each script has a single responsibility
- Scripts do not silently mutate upstream data
- All rebuilds are deterministic
- Phases are explicitly selected and ordered
- JSON artifacts are treated as canonical

---