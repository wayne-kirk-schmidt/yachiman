# generate_haiku_seed.py

## Table of Contents

- [Purpose](#purpose)
- [Role in the Pipeline](#role-in-the-pipeline)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Core Behavior](#core-behavior)
- [Validation Contract](#validation-contract)
- [Invariants](#invariants)
- [Failure Modes](#failure-modes)
- [Determinism and Non-Determinism](#determinism-and-non-determinism)
- [Non-Goals](#non-goals)

---

## Purpose

`generate_haiku_seed.py` is responsible for generating **raw haiku seed text**
using an external AI agent under strict structural constraints.

It enforces output structure and acts as the controlled gateway between
non-deterministic generation and deterministic downstream processing.

---

## Role in the Pipeline

Position in the pipeline:

```
template + instructions
   ↓
generate_haiku_seed.py
   ↓
inbox/*.txt
   ↓
split_inbox_file.py
```

This script:
- Produces candidate haiku text
- Enforces strict formatting rules
- Does not modify structured data

---

## Inputs

### Required

- `--template`
  - Path to a template preference file

- `--instructions`
  - Path to an instructions file
  - Must contain the placeholder `{{TEMPLATE}}`

- `--agenturl`
  - Identifier of the generation backend
  - Currently only `openai` is supported

- `--dst`
  - Output file or directory

### Optional

- `--number`
  - Number of haiku seeds to generate (default: 1)

- `--verbose`
  - Print composed prompts and raw agent output

- `--dryrun`
  - Do not call the agent
  - Only emit composed prompt

### Environment

- `HAIKU_PROJECT_API_KEY`
  - Required for agent execution

---

## Outputs

- One text file containing one or more haiku entries
- Entries are separated by newlines
- Each entry ends with `###`

---

## Core Behavior

- Loads instruction and template files
- Injects template content into instructions
- Calls the configured AI agent
- Validates agent output structure
- Writes validated output to destination

---

## Validation Contract

Each generated haiku **must**:

- Contain exactly three non-empty lines
- End with a literal `###` separator

Any violation causes immediate failure.

---

## Invariants

- Output structure is strictly enforced
- Invalid agent output is never written
- Downstream scripts may assume valid structure
- No inbox normalization occurs here

---

## Failure Modes

Fatal:

- Missing input files
- Missing `{{TEMPLATE}}` placeholder
- Missing API key
- Unsupported agent backend
- Invalid agent output

Tolerated:

- None

---

## Determinism and Non-Determinism

- Agent output is inherently non-deterministic
- Structural validation is deterministic
- This script defines the boundary between the two

---

## Non-Goals

- Haiku quality evaluation
- Linguistic correctness
- Syllable counting
- Tag extraction
- Inbox normalization
