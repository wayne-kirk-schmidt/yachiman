#!/usr/bin/env bash

set -euo pipefail
umask 022

DATA_DIR="data"

echo ""
echo "### === Haiku Build Checks === ###"
echo ""

echo "### === Checking tags.json"

RESULT="### OK: $DATA_DIR/tags.json"
[[ -f "$DATA_DIR/tags.json" ]] || ( RESULT="### ERROR:: Missing $DATA_DIR/tags.json"; echo $RESULT; exit 1 )
echo ${RESULT}

echo ""

echo "### === Checking manifest.json"
RESULT="### OK: $DATA_DIR/manifest.json"
[[ -f "$DATA_DIR/manifest.json" ]] || ( RESULT="### ERROR:: Missing $DATA_DIR/manifest.json"; echo $RESULT; exit 1 )
echo ${RESULT}

echo ""

HAIKU_JSON_COUNT=$(ls ./${DATA_DIR}/*/*/*/haiku.*.json | wc -w)
MANIFEST_COUNT=$(jq '.items | length' "$DATA_DIR/manifest.json")

echo "### === Checking manifest and datafile count"
RESULT="### OK: manifest and datafile count match"
[[ "$HAIKU_JSON_COUNT" -eq "$MANIFEST_COUNT" ]] || \
( RESULT="### ERROR:: manifest and tag count differ"; echo $RESULT; exit 1)
echo ${RESULT}

echo ""

TAG_COUNT=$(jq '.tags | length' "$DATA_DIR/tags.json")

EMPTY_TAGS=$(jq '[.tags[] | select(.tag == "" or .tag == null)] | length' "$DATA_DIR/tags.json")

echo "### === Checking empty tags"

RESULT="### OK: no empty tags"
[[ "$EMPTY_TAGS" -eq 0 ]] || \
( RESULT="### ERROR:: empty tags found"; echo $RESULT; exit 1)
echo ${RESULT}

echo ""

echo "### === Checking anomalies"
ANOMALIES=$(
  (
    jq -r '.items[].tags[]?' "$DATA_DIR/manifest.json" | sort -u
    jq -r '.tags[].tag' "$DATA_DIR/tags.json" | sort -u
  ) | sort | uniq -c | awk '$1 == 1 {print}' | wc -l 
)

RESULT="### OK: no anomalies"
[[ "$ANOMALIES" -eq 0 ]] || \
( RESULT="### ERROR:: anomaliesfound"; echo $RESULT; exit 1)
echo ${RESULT}

echo ""

printf "### DATA:: datafile file count: %s\n" $HAIKU_JSON_COUNT
printf "### DATA:: manifest file count: %s\n" $MANIFEST_COUNT
printf "### DATA:: distinct tag  count: %s\n" $TAG_COUNT
