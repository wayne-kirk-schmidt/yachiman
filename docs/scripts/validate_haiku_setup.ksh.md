# validate_haiku_setup.ksh

## Purpose

Perform post-build validation checks on generated Haiku artifacts.

This script enforces **system invariants** after build completion.

---

## Role in the Pipeline

```
build_environment.py
   ↓
validate_haiku_setup.ksh
```

---

## Checks Performed

- Presence of `data/tags.json`
- Presence of `data/manifest.json`
- Manifest item count matches haiku JSON files
- No empty or null tags
- No tag anomalies between manifest and tag index

---

## Invariants

After successful execution:

- Core data artifacts exist
- Index consistency is guaranteed
- Tag integrity is preserved

---

## Failure Modes

- Missing required files
- Count mismatches
- Empty or orphaned tags

All failures are fatal.

---

## Non-Goals

- Data repair
- Incremental correction
- Performance optimization
