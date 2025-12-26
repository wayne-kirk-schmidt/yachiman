#!/usr/bin/env bash
set -euo pipefail
umask 022

# --------------------------------------------------
# Resolve paths relative to this script
# --------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$PROJECT_ROOT/data"

fail() { echo "### ERROR:: $*" >&2; exit 1; }
ok()   { echo "### OK:: $*"; }

echo
echo "### === Haiku Build Checks === ###"
echo

echo "### === Checking tags.json"

[ -f "$DATA_DIR/tags.json" ] || fail "Missing $DATA_DIR/tags.json"

ok "$DATA_DIR/tags.json"

echo

echo "### === Checking manifest.json"

[ -f "$DATA_DIR/manifest.json" ] || fail "Missing $DATA_DIR/manifest.json"

ok "$DATA_DIR/manifest.json"

echo

HAIKU_JSON_COUNT=$(find "$DATA_DIR" -type f -name 'haiku.*.json' | wc -l | tr -d ' ')
MANIFEST_COUNT=$(jq '.items | length' "$DATA_DIR/manifest.json")

echo "### === Checking manifest and datafile count"

[ "$HAIKU_JSON_COUNT" -eq "$MANIFEST_COUNT" ] || fail "manifest and datafile count differ"

ok "manifest and datafile count match"

echo

TAG_COUNT=$(jq '.tags | length' "$DATA_DIR/tags.json")
EMPTY_TAGS=$(jq '[.tags[] | select(.tag == "" or .tag == null)] | length' "$DATA_DIR/tags.json")

echo "### === Checking empty tags"

[ "$EMPTY_TAGS" -eq 0 ] || fail "empty tags found"

ok "no empty tags"

echo

echo "### === Checking anomalies"

ANOMALIES=$(
  {
    jq -r '.items[].tags[]?' "$DATA_DIR/manifest.json"
    jq -r '.tags[].tag' "$DATA_DIR/tags.json"
  } | sort | uniq -c | awk '$1 == 1' | wc -l | tr -d ' '
)

[ "$ANOMALIES" -eq 0 ] || fail "anomalies found"

ok "no anomalies"

echo

printf "### DATA:: datafile file count: %s\n" "$HAIKU_JSON_COUNT"
printf "### DATA:: manifest file count: %s\n" "$MANIFEST_COUNT"
printf "### DATA:: distinct tag  count: %s\n" "$TAG_COUNT"

