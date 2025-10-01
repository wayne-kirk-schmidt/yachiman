# Haiku JSON Schema (v9)

Each haiku is stored as a JSON file at:

```
data/YYYY/MM/DD/haiku.YYYY.MM.DD.SEQ.json
```

## Fields

| Field       | Type       | Required | Description |
|-------------|-----------|----------|-------------|
| `id`        | string    | ✅ | Unique identifier = `YYYYMMDD-SEQ` (e.g. `20250927-01`). |
| `date`      | string    | ✅ | Date in ISO format `YYYY-MM-DD`. |
| `seq`       | integer   | ✅ | Sequence number for that date (1-based). |
| `title`     | string    | ✅ | Title of haiku. Either explicit from input (`TITLE:`) or fallback = `date.seq`. |
| `lines`     | [string]  | ✅ | Array of haiku lines (typically 3, but flexible). |
| `tags`      | [string]  | ⬜ Optional | Enriched later by `build_tags.py` (nouns only). |
| `path_html` | string    | ✅ | Relative path to the rendered HTML file (e.g. `/data/2025/09/27/haiku.2025.09.27.01.html`). |
| `path_json` | string    | ✅ | Relative path to this JSON file. |
| `created`   | string    | ✅ | Timestamp of creation (ISO `YYYY-MM-DDTHH:MM:SSZ`). |
| `updated`   | string    | ⬜ Optional | Last update timestamp (set by enrichers like `build_tags.py`). |

## Example JSON

```json
{
  "id": "20250927-01",
  "date": "2025-09-27",
  "seq": 1,
  "title": "Autumn Evening",
  "lines": [
    "Crickets in the grass",
    "The moon rises silently",
    "Shadows lengthen slow"
  ],
  "tags": ["autumn", "moon", "shadows"],
  "path_html": "/data/2025/09/27/haiku.2025.09.27.01.html",
  "path_json": "/data/2025/09/27/haiku.2025.09.27.01.json",
  "created": "2025-09-27T16:25:30Z",
  "updated": "2025-09-27T16:28:04Z"
}
```

## Aggregates

### manifest.json

```json
[
  {
    "id": "20250927-01",
    "date": "2025-09-27",
    "seq": 1,
    "title": "Autumn Evening",
    "path_html": "/data/2025/09/27/haiku.2025.09.27.01.html",
    "path_json": "/data/2025/09/27/haiku.2025.09.27.01.json"
  }
]
```

### tags.json

```json
{
  "tags": ["autumn", "moon", "shadows"],
  "tag_index": {
    "autumn": ["20250927-01"],
    "moon": ["20250927-01"],
    "shadows": ["20250927-01"]
  }
}
```

## Notes

- Per-haiku JSONs are immutable records (append-only).
- Aggregates (`manifest.json`, `tags.json`) are always rebuildable.
- Future enrichments can be added as new fields without breaking existing data.
