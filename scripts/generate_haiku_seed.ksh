#!/usr/bin/env bash
set -euo pipefail

umask 022

# --------------------------------------------------
# Resolve paths relative to this script
# --------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CONFIG_DIR="$PROJECT_ROOT/config"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
INBOX_DIR="$PROJECT_ROOT/inbox"

# --------------------------------------------------
# Timestamp
# --------------------------------------------------

date="$(date +%y%m%d)"
time="$(date +%H%M%S)"

# --------------------------------------------------
# Select random theme
# --------------------------------------------------

themes=( "$CONFIG_DIR/themes/"* )

count=${#themes[@]}
(( count == 0 )) && {
  echo "ERROR: no themes found in $CONFIG_DIR/themes" >&2
  exit 1
}

theme="${themes[RANDOM % count]}"

# --------------------------------------------------
# Files
# --------------------------------------------------

guide="$CONFIG_DIR/haiku.instructions.txt"
script="$SCRIPTS_DIR/generate_haiku_seed.py"
output="$INBOX_DIR/inbox.${date}.${time}.txt"

# --------------------------------------------------
# Execute
# --------------------------------------------------

$script \
  --instructions "${guide}" \
  --template "${theme}" \
  --agenturl openai \
  --dst "${output}" \
  --number 1 \
  --verbose

