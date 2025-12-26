# generate_haiku_seed.ksh

## Purpose

Shell wrapper for invoking `generate_haiku_seed.py` in a portable,
project-root-relative manner.

This script exists to provide:
- Path hygiene
- Configuration selection
- Operational convenience

---

## Role in the Pipeline

```
operator
   ↓
generate_haiku_seed.ksh
   ↓
generate_haiku_seed.py
```

---

## Responsibilities

- Resolve project root relative to script location
- Select a random theme file
- Construct destination inbox filename
- Invoke Python script with correct arguments

---

## Invariants

- All paths are resolved relative to script location
- No assumptions about current working directory
- No content generation logic exists here

---

## Failure Modes

- Missing configuration files
- Empty theme directory
- Python execution failure

---

## Non-Goals

- Validation of haiku structure
- Modification of generated output
- Batch processing logic
