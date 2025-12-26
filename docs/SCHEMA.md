# Haiku Project – Data Schema


## Table of Contents

- [Inbox Schema (Raw Input)](#1-inbox-schema-raw-input)
- [Page Schema (Per-Haiku JSON)](#2-page-schema-per-haiku-json)
- [Tags Schema (Global Tag Index)](#3-tags-schema-global-tag-index)
- [Manifest Schema (Navigation Index)](#4-manifest-schema-navigation-index)
- [Schema Invariants](#5-schema-invariants)

---

This document defines data schemas used in the Haiku pipeline.

The Haiku pipeline is multi-step content pipeline.

Each schema represents a stable contract between phases.

No downstream phase mutates upstream data.

---

## 1. Inbox Schema (Raw Input)

### Purpose

The inbox is the authoritative source of raw haiku content.
It contains unstructured text only and carries no metadata.

### Format

- File type: `.txt`
- Encoding: UTF-8
- Content consists of multiple haiku entries
- Each haiku entry is separated by a literal delimiter line:

```
###
```

### Haiku Rules (Implicit)

Each haiku must consist of:
- Exactly 3 lines of text
- Followed by a separator line `###`

Validation of structure occurs downstream, not at the inbox level.

### Example

```
Warm air moves softly
Heat presses down on the land
Shadows stretch at dusk
###
```

### Design Notes

- Inbox files may contain multiple haiku
- Inbox files may be date-oriented but are not required to be one-haiku-per-file
- Inbox files are archived after successful processing
- Inbox content is immutable once archived

---

## 2. Page Schema (Per-Haiku JSON)

Each haiku is materialized into two artifacts:
- A JSON file (authoritative)
- A corresponding HTML file (rendered output)

The JSON file is the source of truth for all downstream processing.

### JSON Schema

```json
{
  "id": "20190808-01",
  "date": "2019-08-08",
  "seq": 1,
  "title": "2019-08-08.01",
  "lines": [
    "Warm air moves softly",
    "Heat presses down on the land",
    "Shadows stretch at dusk"
  ],
  "tags": [
    "air",
    "dusk",
    "heat",
    "land",
    "shadows"
  ],
  "path_html": "data/2019/08/08/haiku.2019-08-08.01.html",
  "path_json": "data/2019/08/08/haiku.2019-08-08.01.json",
  "created": "2025-12-26T03:26:42.241984+00:00"
}
```

### Field Definitions

- `id`
  Stable identifier derived from date and sequence number.
  Format: `YYYYMMDD-NN`

- `date`
  ISO-8601 date string representing the haiku’s logical date

- `seq`
  Sequence number within the given date

- `title`
  Human-readable title, typically `{date}.{seq}`

- `lines`
  Array of exactly three strings
  Preserves original line text and order

- `tags`
  List of semantic tags derived from the haiku text
  Tags are filtered using intrinsic part-of-speech rules:
  - Nouns and adjectives only
  - Verbs and other parts of speech are excluded

- `path_html`
  POSIX-style relative path to the rendered HTML file

- `path_json`
  POSIX-style relative path to this JSON file

- `created`
  UTC timestamp indicating when this haiku artifact was generated

### Design Notes

- Tags are semantic signals, not stylistic artifacts
- JSON files are never regenerated implicitly
- HTML files are rendered from JSON, not parsed later
- Paths are stored to enable static site routing and lazy loading

---

## 3. Tags Schema (Global Tag Index)

### Purpose

The tags schema provides a global index of all tags across all haiku pages.

It enables:
- Tag frequency analysis
- Reverse lookup from tag to haiku IDs
- Lightweight client-side filtering

### File Location

```
data/tags.json
```

### JSON Schema

```json
{
  "tags": [
    {
      "tag": "dusk",
      "count": 12,
      "files": [
        "20190808-01",
        "20191002-03"
      ]
    }
  ]
}
```

### Field Definitions

- `tag`
  The normalized tag string

- `count`
  Number of haiku entries associated with this tag

- `files`
  List of haiku IDs containing this tag

### Design Notes

- Tags are rebuilt exclusively from page JSON files
- Existing tags are re-filtered using intrinsic POS rules
- No new tags are inferred during this phase
- Historical tag pollution is explicitly corrected during rebuilds

---

## 4. Manifest Schema (Navigation Index)

### Purpose

The manifest provides a lightweight index of all haiku entries for:
- Client-side navigation
- Lazy loading of content
- Tag-based filtering

It intentionally avoids embedding full content.

### File Location

```
data/manifest.json
```

### JSON Schema

```json
{
  "generated": "2025-12-26T04:01:00Z",
  "items": [
    {
      "id": "20190808-01",
      "title": "2019-08-08.01",
      "path_html": "data/2019/08/08/haiku.2019-08-08.01.html",
      "path_json": "data/2019/08/08/haiku.2019-08-08.01.json",
      "tags": [
        "air",
        "dusk",
        "heat"
      ]
    }
  ]
}
```

### Design Notes

- Manifest is regenerated from existing page JSON only
- Tags are re-filtered to ensure semantic correctness
- Manifest does not duplicate haiku text
- Manifest size is expected to grow and may be sharded in future versions

---

## 5. Schema Invariants

- Inbox data is immutable once archived
- JSON is the canonical data representation
- HTML is a rendered artifact, not a source
- Tags are nouns/adjectives only
- All rebuilds are deterministic and idempotent
- No phase mutates upstream artifacts