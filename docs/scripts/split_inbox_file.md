# split_inbox_file.py

## Table of Contents

- [Purpose](#purpose)
- [Role in the Pipeline](#role-in-the-pipeline)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Core Behavior](#core-behavior)
- [Invariants](#invariants)
- [Failure Modes](#failure-modes)
- [Rebuild and Idempotency Semantics](#rebuild-and-idempotency-semantics)
- [Non-Goals](#non-goals)

---

## Purpose

`split_inbox_file.py` is responsible for **normalizing raw haiku inbox content**
into deterministic, date-partitioned inbox files.

It converts loosely structured haiku input into predictable, bounded batches
that can be safely consumed by downstream build phases.

This script does **not** interpret haiku semantics beyond separator handling.

---

## Role in the Pipeline

Position in the pipeline:

```
raw inbox text (.txt)
   ↓
split_inbox_file.py
   ↓
YYYYMMDD.inbox.txt
   ↓
build_environment.py (pages)
```

This script:
- Operates strictly on text files
- Defines intake boundaries for downstream processing
- Ensures consistent daily batching semantics

---

## Inputs

### Required Inputs

- `--src`
  - Path to a single inbox file **or**
  - Path to a directory containing inbox files
  - Files must be UTF-8 encoded text

- `--dst`
  - Destination directory for generated inbox files

- `--startdate`
  - Logical start date for the first output file
  - Accepted formats:
    - `YYYYMMDD`
    - `YYYY-MM-DD`

- `--number`
  - Number of haiku entries per output file (per day)

### Optional Flags

- `--dry-run`
  - Perform all parsing and counting
  - Do not write output files

- `--verbose`
  - Enable debug-level logging

---

## Outputs

- One or more inbox files named:

```
YYYYMMDD.inbox.txt
```

Each output file:
- Contains up to `--number` haiku entries
- Preserves original haiku text and line breaks
- Uses `###` as the separator between entries

---

## Core Behavior

The script enforces the following behavior:

- Split input text on the literal separator `###`
- Trim leading and trailing whitespace per haiku block
- Preserve internal newlines within a block
- Drop empty or whitespace-only blocks
- Pack haiku blocks sequentially into daily files
- Advance the output date after each batch

When multiple source files are provided:
- Files are processed in sorted filename order
- All haiku blocks are combined into a single stream

---

## Invariants

After successful execution:

- All output files follow a deterministic naming scheme
- No haiku content is altered beyond whitespace trimming
- Separator semantics are preserved
- Output ordering is stable and reproducible
- Destination directories are created if missing

---

## Failure Modes

Fatal failures:

- Invalid source path
- Invalid `--startdate` format
- Unreadable input files
- Invalid CLI arguments

Tolerated behavior:

- Empty source files result in zero output files
- Dry-run mode suppresses file writes without error

---

## Rebuild and Idempotency Semantics

- Safe to rerun against the same input
- Will overwrite existing output files with identical names
- Does not archive or delete source files
- Deterministic given identical inputs and arguments

This script does not attempt incremental or resume semantics.

---

## Non-Goals

- Haiku validation (5/7/5 structure)
- Linguistic or semantic analysis
- Tag extraction
- Metadata generation
- Archiving or lifecycle management

All such responsibilities belong to downstream scripts.
