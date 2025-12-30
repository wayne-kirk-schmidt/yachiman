#!/usr/bin/env python3
import argparse
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
import shutil
from pathlib import PurePosixPath
import re
import nltk
from nltk import word_tokenize, pos_tag

# POS tags we allow (nouns + adjectives)
NLTK_POS_ALLOW = {
    "NN", "NNS", "NNP", "NNPS",
    "JJ", "JJR", "JJS",
}

# ----------------------------
# Ensure nltk is prepared
# ----------------------------
def ensure_nltk_ready():
    """
    Ensure required NLTK resources are available.
    Self-healing, deterministic, one-time.
    """
    required = {
        "tokenizers/punkt": "punkt",
        "tokenizers/punkt_tab": "punkt_tab",
        "taggers/averaged_perceptron_tagger": "averaged_perceptron_tagger",
        "taggers/averaged_perceptron_tagger_eng": "averaged_perceptron_tagger_eng",
    }

    missing = []

    for path, pkg in required.items():
        try:
            nltk.data.find(path)
        except LookupError:
            missing.append(pkg)

    if missing:
        logger.info(f"NLTK setup: downloading {', '.join(missing)}")
        for pkg in missing:
            nltk.download(pkg, quiet=True)

logger = logging.getLogger("haiku-build")

# ----------------------------
# Word extraction helper
# ----------------------------
def get_words(text, stopwords=None, unique=False):
    """
    Extract words from text with optional stopword removal and uniqueness.
    """
    words = re.findall(r"\b\w+\b", text.lower())
    if stopwords:
        words = [w for w in words if w not in stopwords]
    if unique:
        words = sorted(set(words))
    return words

STOPWORDS = {
    "an", "a", "the", "they", "you", "we", "our",
    "is", "was", "that", "this", "these", "them"
}

# ----------------------------
# filter word by POS helper
# ----------------------------
def filter_words_by_pos(words, text):
    """
    Filter words using intrinsic NLTK POS tagging only.

    Rule:
    - Word must appear in the text
    - Word must be intrinsically a noun or adjective
    - If NLTK tags it as a verb, it is discarded
    """

    if not words or not text:
        return []

    tokens = set(word_tokenize(text.lower()))
    filtered = []

    for w in words:
        # must appear in text
        if w not in tokens:
            continue

        # intrinsic POS gate (authoritative)
        w_pos = pos_tag([w])[0][1]
        if w_pos not in NLTK_POS_ALLOW:
            continue

        filtered.append(w)

    return sorted(set(filtered))

# ----------------------------
# Existing-tag filter helper
# ----------------------------
def filter_existing_tags_nltk(tags, text=None):
    """
    Filter an existing list of tags using intrinsic NLTK POS tagging only.

    Rule:
    - Tag must appear in the text
    - Tag must be intrinsically a noun or adjective
    - If NLTK tags it as a verb, it is discarded
    """

    if not tags or not text:
        return []

    tokens = set(word_tokenize(text.lower()))
    filtered = []

    for tag in tags:
        tag_lc = tag.lower()

        # must appear in text
        if tag_lc not in tokens:
            continue

        # intrinsic POS gate (authoritative)
        tag_pos = pos_tag([tag_lc])[0][1]
        if tag_pos not in NLTK_POS_ALLOW:
            continue

        filtered.append(tag)

    return sorted(set(filtered))

# ----------------------------
# Clean helpers
# ----------------------------
def clean_pages(data_dir: Path):
    for f in data_dir.rglob("*.html"):
        if f.is_file():
            f.unlink()
    for f in data_dir.rglob("*.json"):
        if f.is_file():
            f.unlink()

def clean_tags(data_dir: Path):
    tags_file = data_dir / "tags.json"
    if tags_file.exists():
        tags_file.unlink()

def clean_manifest(data_dir: Path):
    manifest_file = data_dir / "manifest.json"
    if manifest_file.exists():
        manifest_file.unlink()

# ----------------------------
# Pages phase
# ----------------------------
def phase_pages(args, project_root, inbox_dir, archive_dir, assets_dir, data_dir):
    """
    Phase: build haiku HTML and JSON pages from inbox .txt files only.
    """
    
    data_dir.mkdir(parents=True, exist_ok=True)
    
    archive_dir.mkdir(parents=True, exist_ok=True)
    
    template_path = Path(args.template) if args.template else assets_dir / "haiku.template.html"
    if not template_path.exists():
        logger.error(f"Template not found: {template_path}")
        return

    template_text = template_path.read_text(encoding="utf-8")

    for inbox_file in inbox_dir.glob("*"):
        if inbox_file.suffix.lower() != ".txt":
            logger.debug(f"Skipping unsupported file: {inbox_file}")
            continue

        logger.info(f"Processing {inbox_file.name}")

        # --- Load content ---
        content = inbox_file.read_text(encoding="utf-8")

        # --- Split into haikus (by explicit ### separator) ---
        blocks = [
            block.strip().splitlines()
            for block in re.split(r'^\s*###\s*$', content, flags=re.MULTILINE)
            if block.strip()
        ]

        # --- Build pages ---
        for i, lines in enumerate(blocks, start=1):
            seq = i

            # Try to parse date from filename (expects YYYYMMDD.txt)
            stem = inbox_file.stem
            date_match = re.match(r"(\d{4})(\d{2})(\d{2})", stem)

            if args.date:
                date_str = args.date
            elif date_match:
                year, month, day = date_match.groups()
                date_str = f"{year}-{month}-{day}"
            else:
                # fallback: today
                date_str = datetime.now().strftime("%Y-%m-%d")

            title = args.title or f"{date_str}.{seq:02d}"

            rel_dir = Path(date_str.replace("-", "/"))
            out_dir = data_dir / rel_dir
            out_dir.mkdir(parents=True, exist_ok=True)

            html_path = out_dir / f"haiku.{date_str}.{seq:02d}.html"
            json_path = out_dir / f"haiku.{date_str}.{seq:02d}.json"

            # --- Extract tags (words minus stopwords) ---
            all_text = " ".join(lines)

            ### tags = get_words(all_text, stopwords=STOPWORDS, unique=True)
            ### words = get_words(all_text, stopwords=None, unique=True)

            words = get_words(all_text, stopwords=STOPWORDS, unique=True)
            tags = filter_words_by_pos(words, all_text)

            # Build JSON metadata
            json_data = {
                "id": f"{date_str.replace('-', '')}-{seq:02d}",
                "date": date_str,
                "seq": seq,
                "title": title,
                "lines": lines,
                "tags": tags,
                "path_html": str(PurePosixPath(html_path.relative_to(project_root))),
                "path_json": str(PurePosixPath(json_path.relative_to(project_root))),
                "created": datetime.now(timezone.utc).isoformat(),
            }

            # Render HTML
            line_html = "\n".join(f"<p>{line}</p>" for line in lines)
            html_out = template_text.replace("{{title}}", title)\
                                    .replace("{{date}}", date_str)\
                                    .replace("{{lines}}", line_html)\
                                    .replace("{{json}}", json.dumps(json_data, indent=2))

            html_path.write_text(html_out, encoding="utf-8")
            json_path.write_text(json.dumps(json_data, indent=2), encoding="utf-8")

            logger.debug(f"Built {html_path} and {json_path}")

        # --- Archive input file ---
        timestamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
        archive_subdir = archive_dir / timestamp
        archive_subdir.mkdir(parents=True, exist_ok=True)
        shutil.move(str(inbox_file), archive_subdir / inbox_file.name)
        logger.debug(f"Moved {inbox_file} to {archive_subdir}")

    # --- Build Current_Haiku Json file ---
    phase_current_haiku(project_root, data_dir, assets_dir)

# ----------------------------
# Tags phase
# ----------------------------
def phase_tags(args, data_dir: Path):

    data_dir.mkdir(parents=True, exist_ok=True)

    tags_json_path = data_dir / "tags.json"

    if args.mode == "clean":
        clean_tags(data_dir)
        return

    tags_map = {}

    for json_file in data_dir.rglob("*.json"):
        if json_file.name in ("tags.json", "manifest.json"):
            continue

        try:
            with json_file.open(encoding="utf-8") as f:
                data = json.load(f)

            raw_tags = data.get("tags", [])
            text = " ".join(data.get("lines", []))

            filtered_tags = filter_existing_tags_nltk(raw_tags, text)

            for tag in filtered_tags:
                tags_map.setdefault(tag, []).append(data["id"])

            if args.verbose:
                logger.debug(
                    f"{data['id']}: tags {len(raw_tags)} → {len(filtered_tags)}"
                )

        except Exception as e:
            logger.error(f"Failed to process {json_file}: {e}")

    tags_data = {"tags": []}
    for tag, files in tags_map.items():
        tags_data["tags"].append({
            "tag": tag,
            "count": len(files),
            "files": files,
        })

    tags_json_path.write_text(
        json.dumps(tags_data, indent=2),
        encoding="utf-8"
    )

    logger.info(f"Built {tags_json_path}")

# ----------------------------
# Current Haiku
# ----------------------------
def phase_current_haiku(project_root: Path, data_dir: Path, assets_dir: Path):
    """
    Build assets/current_haiku.json from existing haiku JSON files.
    Triggered by phase_pages only.
    """

    haiku_entries = []

    for json_file in data_dir.rglob("haiku.*.json"):
        try:
            with json_file.open(encoding="utf-8") as f:
                data = json.load(f)

            haiku_entries.append(data)

        except Exception as e:
            logger.error(f"Failed to read {json_file}: {e}")

    if not haiku_entries:
        logger.warning("No haiku entries found; skipping current_haiku.json")
        return

    # total count
    current_count = len(haiku_entries)

    # determine most recent by (date, seq)
    latest = max(
        haiku_entries,
        key=lambda h: (h.get("date", ""), int(h.get("seq", 0)))
    )

    out = {
        "current_count": current_count,
        "current_haiku": {
            "path_html": latest["path_html"]
        }
    }

    out_path = assets_dir / "current_haiku.json"
    out_path.write_text(json.dumps(out, indent=2), encoding="utf-8")

    logger.info(f"Built {out_path}")

# ----------------------------
# Manifest phase
# ----------------------------
def phase_manifest(args, project_root: Path, data_dir: Path, assets_dir: Path):
    """
    Phase: build manifest.json from existing haiku JSON files in data_dir.
    Does not modify haiku HTML or haiku JSON files.
    Applies NLTK POS-based filtering (nouns + adjectives) to existing tags only.
    """

    data_dir.mkdir(parents=True, exist_ok=True)

    manifest_path = data_dir / "manifest.json"

    if args.mode == "clean":
        if manifest_path.exists():
            manifest_path.unlink()
            logger.info(f"Removed {manifest_path}")
        return

    manifest = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "items": [],
    }

    for json_file in data_dir.rglob("*.json"):
        if json_file.name in ("manifest.json", "tags.json"):
            continue

        try:
            with json_file.open(encoding="utf-8") as f:
                entry = json.load(f)

            raw_tags = entry.get("tags", [])
            text = " ".join(entry.get("lines", []))
            filtered_tags = filter_existing_tags_nltk(raw_tags, text)

            item = {
                "id": entry.get("id"),
                "title": entry.get("title", ""),
                "path_html": str(Path(entry["path_html"]).as_posix()),
                "path_json": str(Path(entry["path_json"]).as_posix()),
                "tags": filtered_tags,
            }

            manifest["items"].append(item)

            if args.verbose:
                logger.debug(
                    f"{entry.get('id')}: manifest tags "
                    f"{len(raw_tags)} → {len(filtered_tags)}"
                )

        except Exception as e:
            logger.error(f"Failed to process {json_file}: {e}")

    manifest_path.write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8"
    )

    logger.info(f"Built {manifest_path}")

# ----------------------------
# Main
# ----------------------------
def main():

    parser = argparse.ArgumentParser(description="Build haiku HTML and JSON files.")

    parser.add_argument("--title", help="Optional title override for haiku")

    parser.add_argument("--date", help="Date in YYYY-MM-DD (default: today)")

    parser.add_argument("--template", help="Path to haiku.template.html")

    parser.add_argument("--phase", choices=["all", "pages", "manifest", "tags"],
                        default="all", help="Which phase(s) to run")

    parser.add_argument("--verbose", type=int, default=0,
                        help="Verbosity (0=info, 1=debug)")

    parser.add_argument("--mode", choices=["create", "rebuild", "clean"],
                        default="create",
                        help="Mode of operation: create (default), rebuild (overwrite), clean (remove generated data)")

    args = parser.parse_args()

    # logging setup
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO,
                        format="%(levelname)s: %(message)s")

    # ensure nltk resources are present (one-time, self-healing)
    ensure_nltk_ready()

    # resolve dirs
    project_root = Path(__file__).resolve().parent.parent
    inbox_dir = project_root / "inbox"
    archive_dir = project_root / "archive"
    data_dir = project_root / "data"
    assets_dir = project_root / "assets"

    logger.info(f"Project root: {project_root}")
    logger.info(f"Inbox:   {inbox_dir}")
    logger.info(f"Archive: {archive_dir}")
    logger.info(f"Data:    {data_dir}")
    logger.info(f"Assets:  {assets_dir}")

    if args.phase in ("all", "pages"):
        phase_pages(args, project_root, inbox_dir, archive_dir, assets_dir, data_dir)

    if args.phase in ("all", "tags"):
        phase_tags(args, data_dir)

    if args.phase in ("all", "manifest"):
        phase_manifest(args, project_root, data_dir, assets_dir)

if __name__ == "__main__":
    main()
