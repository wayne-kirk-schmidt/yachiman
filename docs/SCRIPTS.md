# Haiku Project – Scripts

## Table of Contents

- [split_inbox_file.py](#1-split_inbox_filepy)
- [build_environment.py](#2-build_environmentpy)
  - [Phase: pages](#21-phase-pages)
  - [Phase: tags](#22-phase-tags)
  - [Phase: manifest](#23-phase-manifest)
- [generate_haiku_seed.py](#3-generate_haiku_seedpy)
- [generate_haiku_seed.ksh](#4-generate_haiku_seedksh)
- [validate_haiku_setup.ksh](#5-validate_haiku_setupksh)
- [requirements.txt](#6-requirementstxt)
- [Script Invariants](#script-purposes)

---

The following scripts make up the Haiku automation pipeline.

Each script has a single responsibility.
Scripts are composable, deterministic, and one-way: no script mutates upstream artifacts.

---

## 1. split_inbox_file.py

[Detailed documentation](scripts/split_inbox_file.md)

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

### Outputs

- One or more files named:
  ```
  YYYYMMDD.inbox.txt
  ```

---

## 2. build_environment.py

[Detailed documentation](scripts/build_environment.md)

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

Convert inbox text files into per-haiku JSON and HTML artifacts.

---

### 2.2 Phase: tags

Build a global tag index from existing haiku JSON files.

---

### 2.3 Phase: manifest

Build a lightweight navigation index for all haiku pages.

---

## 3. generate_haiku_seed.py

[Detailed documentation](scripts/generate_haiku_seed.md)

### Purpose

Generate haiku seed text using an AI agent under strict structural constraints.

This script defines the boundary between non-deterministic generation
and deterministic downstream processing.

---

## 4. generate_haiku_seed.ksh

[Detailed documentation](scripts/generate_haiku_seed.ksh.md)

### Purpose

Shell wrapper for invoking `generate_haiku_seed.py` with correct
path resolution and configuration selection.

---

## 5. validate_haiku_setup.ksh

[Detailed documentation](scripts/validate_haiku_setup.ksh.md)

### Purpose

Perform post-build validation checks and enforce system invariants.

---

## 6. requirements.txt

### Purpose

Declare Python dependencies required by the Haiku project.

Dependencies include:
- Natural language processing (NLTK)
- AI agent interaction
- Supporting text and PDF utilities

---

## Script Purposes

- Each script has a single responsibility
- Scripts do not silently mutate upstream data
- All rebuilds are structurally deterministic
- Phases are explicitly selected and ordered
- JSON artifacts are treated as canonical

---
