#!/usr/bin/env python3
# -*- coding: utf-8 -*-
### ================================================================
"""
build_dictionary — Haiku Dictionary Builder

Implementation:
    build_dictionary.py [options]

This script ingests a list of words derived from haiku tags,
annotates them with syllable counts and parts of speech,
and emits a dictionary.yaml suitable for haiku generation.

Behavior:
    - Normalize words
    - Deduplicate
    - Annotate with syllables and POS
    - Emit YAML dictionary

Example Usage:
    build_dictionary.py \
        --src haiku.words.txt \
        --dst dictionary.yaml \
        --number 500 \
        --dry-run \
        --verbose

"""
### ================================================================

import sys
sys.dont_write_bytecode = True
import argparse
import logging
from pathlib import Path
from typing import List, Dict
import yaml
import re


ALLOWED_POS = {
    "common_noun",
    "proper_noun",
    "verb",
    "adjective",
    "adverb",
    "preposition",
    "determiner",
    "pronoun",
    "conjunction",
}


def estimate_syllables(word: str) -> int:
    """
    Very simple syllable estimator.
    Dictionary overrides can be added later.
    """
    word = word.lower()
    vowels = "aeiouy"
    count = 0
    prev = False

    for ch in word:
        is_vowel = ch in vowels
        if is_vowel and not prev:
            count += 1
        prev = is_vowel

    if word.endswith("e") and count > 1:
        count -= 1

    return max(1, count)


def guess_pos(word: str) -> str:
    """
    Naive POS guesser.
    This is intentionally conservative.
    """
    if word in {"the", "a", "an", "this", "that"}:
        return "determiner"
    if word.endswith("ly"):
        return "adverb"
    if word.endswith("ing") or word.endswith("ed"):
        return "verb"
    return "common_noun"


def read_words(src: Path) -> List[str]:
    words: List[str] = []
    for line in src.read_text(encoding="utf-8").splitlines():
        w = line.strip().lower()
        if w and re.match(r"^[a-z]+$", w):
            words.append(w)
    return sorted(set(words))


def build_dictionary(words: List[str]) -> List[Dict]:
    entries: List[Dict] = []

    for word in words:
        entry = {
            "entry": word,
            "syllables": estimate_syllables(word),
            "pos": guess_pos(word),
        }
        entries.append(entry)

    return entries


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build dictionary.yaml from haiku word list"
    )

    parser.add_argument("--src", required=True, type=Path)
    parser.add_argument("--dst", required=True, type=Path)
    parser.add_argument("--number", type=int)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--verbose", action="store_true")

    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s: %(message)s",
    )

    words = read_words(args.src)

    if args.number:
        words = words[: args.number]

    logging.info("Words selected: %d", len(words))

    dictionary = {
        "version": 1.0,
        "language": "en",
        "syllable_authority": "dictionary",
        "dictionary": build_dictionary(words),
    }

    if args.dry_run:
        logging.info("Dry run enabled — no file written")
        logging.debug(dictionary)
        return

    args.dst.write_text(
        yaml.safe_dump(dictionary, sort_keys=False),
        encoding="utf-8",
    )

    logging.info("Dictionary written to %s", args.dst)


if __name__ == "__main__":
    main()
