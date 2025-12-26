# build_environment.py

## Table of Contents

- [Purpose](#purpose)
- [Role in the Pipeline](#role-in-the-pipeline)
- [Supported Phases](#supported-phases)
  - [pages](#phase-pages)
  - [tags](#phase-tags)
  - [manifest](#phase-manifest)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Invariants](#invariants)
- [Failure Modes](#failure-modes)
- [Rebuild and Idempotency Semantics](#rebuild-and-idempotency-semantics)
- [Non-Goals](#non-goals)

---

## Purpose

`build_environment.py` is the primary build orchestrator for the Haiku project.

Its responsibility is to transform normalized inbox input into structured,
queryable, and web-ready artifacts while enforcing strict phase isolation.
It is the authoritative source of truth for how haiku data is materialized,
indexed, and validated.

This script does not generate haiku content. It only processes existing input.

---

## Role in the Pipeline

Position in the pipeline:

```
inbox (.txt)
   ↓
build_environment.py (pages)
   ↓
data/YYYY/MM/DD/*.json + *.html
   ↓
build_environment.py (tags)
   ↓
data/tags.json
   ↓
build_environment.py (manifest)
   ↓
data/manifest.json
```

This script:
- Consumes inbox text files
- Produces canonical JSON and HTML artifacts
- Builds derived global indices
- Never mutates upstream sources except for archiving inbox files

---

## Supported Phases

The script supports explicit phases selected via `--phase`.

Each phase is independently runnable and deterministic.

### Phase: pages

#### Responsibilities

- Read `.txt` files from the inbox directory
- Split haiku entries on the literal `###` separator
- Assign dates and per-day sequence numbers
- Generate canonical per-haiku JSON files
- Render HTML files using a template
- Extract candidate tags from haiku text
- Filter tags using intrinsic NLTK POS rules
- Archive processed inbox files

#### Outputs

- `data/YYYY/MM/DD/haiku.YYYY-MM-DD.NN.json`
- `data/YYYY/MM/DD/haiku.YYYY-MM-DD.NN.html`
- Archived inbox files under `archive/`

#### Notes

- JSON is the authoritative artifact
- HTML is derived and never parsed downstream
- Tag extraction allows nouns and adjectives only

---

### Phase: tags

#### Responsibilities

- Scan all haiku JSON files under `data/`
- Re-filter existing tags using NLTK POS rules
- Count tag usage across all haiku entries
- Build reverse mappings from tag to haiku IDs

#### Outputs

- `data/tags.json`

#### Notes

- No new tags are inferred
- Historical tag pollution is corrected here
- This phase does not modify page artifacts

---

### Phase: manifest

#### Responsibilities

- Scan all haiku JSON files under `data/`
- Re-filter tags for semantic correctness
- Extract minimal metadata for navigation
- Build a flat manifest structure

#### Outputs

- `data/manifest.json`

#### Notes

- Manifest does not embed haiku text
- Designed for lazy loading in client applications

---

## Inputs

- Inbox directory: `inbox/`
- Optional HTML template via `--template`
- Optional date override via `--date`
- Optional title override via `--title`

Dependencies:
- Python standard library
- NLTK (with auto-download of required resources)

---

## Outputs

- Structured data under `data/`
- Archived inbox files under `archive/`
- Global index files (`tags.json`, `manifest.json`)

All paths are derived relative to the project root.

---

## Invariants

- Inbox content is immutable once archived
- JSON is the canonical representation
- HTML is a rendered artifact only
- Tags are nouns and adjectives only
- Downstream phases never modify upstream artifacts
- Rebuilds are structurally deterministic

---

## Failure Modes

Fatal:
- Missing template file
- Invalid CLI arguments
- Missing required NLTK resources (after attempted auto-heal)

Tolerated:
- Individual JSON file read errors during tags or manifest phase
- Tag filtering mismatches

---

## Rebuild and Idempotency Semantics

- Phases may be run independently
- `tags` and `manifest` are safe to rebuild at any time
- `pages` consumes inbox files and archives them
- Timestamp fields prevent byte-for-byte reproducibility but preserve structure

---

## Non-Goals

- Haiku generation
- Linguistic correctness beyond POS filtering
- UI rendering logic
- Network-based indexing or search
