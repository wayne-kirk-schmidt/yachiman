#!/usr/bin/env python3
# -*- coding: utf-8 -*-
### ================================================================
"""
split_inbox_file — Haiku Inbox Splitter

Implementation:
    split_inbox_file.py [options]

This script ingests one or more haiku inbox files, splits entries on
canonical separators, and emits dated daily inbox files.

Behavior:
    - Split on "###"
    - Trim leading/trailing whitespace per haiku
    - Preserve internal newlines
    - Drop empty blocks
    - Pack entries into daily files
    - Advance date per bucket
    - Optional dry-run mode

Example Usage:
    split_inbox_file.py \
        --src inbox/inbox.202512.txt \
        --dst /tmp \
        --startdate 20171201 \
        --number 3

    split_inbox_file.py \
        --src inbox/ \
        --dst /tmp \
        --startdate 2017-12-01 \
        --number 3 \
        --dry-run \
        --verbose

Style:
    Google Python Style Guide:
    http://google.github.io/styleguide/pyguide.html

    @name           split_inbox_file
    @version        1.0.0
    @author-name    Wayne Schmidt
    @author-email   wayne.kirk.schmidt@gmail.com
    @license-name   GNU GPL
    @license-url    http://www.gnu.org/licenses/gpl.html

"""
### ================================================================

import sys
import argparse
import logging
import datetime
from pathlib import Path
from typing import List
sys.dont_write_bytecode = True


SEPARATOR = "###"


def parse_startdate(value: str) -> datetime.date:
    """
    Parse start date.
    Accepts:
      - yyyymmdd
      - yyyy-mm-dd
    Normalizes to datetime.date
    """
    try:
        if "-" in value:
            return datetime.datetime.strptime(value, "%Y-%m-%d").date()
        return datetime.datetime.strptime(value, "%Y%m%d").date()
    except ValueError as exc:
        raise argparse.ArgumentTypeError(
            f"Invalid startdate format: {value}"
        ) from exc


def collect_source_files(src: Path) -> List[Path]:
    """
    Return a sorted list of source files.
    """
    if src.is_file():
        return [src]

    if src.is_dir():
        files = [p for p in src.iterdir() if p.is_file()]
        return sorted(files, key=lambda p: p.name)

    raise SystemExit(f"Invalid source path: {src}")


def split_haiku_blocks(text: str) -> List[str]:
    """
    Split text into haiku blocks using ### as separator.

    Rules:
    - split on ###
    - strip leading/trailing whitespace per block
    - preserve internal newlines
    - drop empty blocks
    """
    blocks: List[str] = []

    for raw in text.split(SEPARATOR):
        block = raw.strip()
        if block:
            blocks.append(block)

    return blocks


def write_daily_files(
    blocks: List[str],
    dst: Path,
    start_date: datetime.date,
    per_day: int,
    dry_run: bool,
) -> None:
    """
    Pack haiku blocks into daily inbox files and write them,
    unless dry_run is enabled.
    """
    current_date = start_date
    index = 0
    total = len(blocks)

    while index < total:
        day_blocks = blocks[index : index + per_day]

        filename = f"{current_date.strftime('%Y%m%d')}.inbox.txt"
        output_path = dst / filename

        if dry_run:
            logging.info(
                "Would write %s (%d entries)",
                output_path.name,
                len(day_blocks),
            )
        else:
            content = "\n###\n".join(day_blocks)
            logging.info(
                "Writing %s (%d entries)",
                output_path.name,
                len(day_blocks),
            )
            output_path.write_text(content, encoding="utf-8")

        index += per_day
        current_date += datetime.timedelta(days=1)


def split_haikus(
    src: Path,
    dst: Path,
    start_date: datetime.date,
    per_day: int,
    dry_run: bool,
) -> None:
    logging.info("Source: %s", src)
    logging.info("Destination: %s", dst)
    logging.info("Start date: %s", start_date.strftime("%Y%m%d"))
    logging.info("Entries per day: %d", per_day)
    logging.info("Dry run: %s", dry_run)

    files = collect_source_files(src)
    logging.info("Files discovered: %d", len(files))

    all_blocks: List[str] = []

    for path in files:
        logging.debug("Reading file: %s", path)
        text = path.read_text(encoding="utf-8")
        blocks = split_haiku_blocks(text)
        logging.info(
            "Haikus found in %s: %d",
            path.name,
            len(blocks),
        )
        all_blocks.extend(blocks)

    logging.info("Total haikus collected: %d", len(all_blocks))

    if not dry_run:
        dst.mkdir(parents=True, exist_ok=True)

    write_daily_files(
        blocks=all_blocks,
        dst=dst,
        start_date=start_date,
        per_day=per_day,
        dry_run=dry_run,
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Split inbox haiku files into dated inbox files"
    )

    parser.add_argument(
        "--src",
        required=True,
        type=Path,
        help="Inbox file or directory",
    )

    parser.add_argument(
        "--dst",
        required=True,
        type=Path,
        help="Destination directory for output files",
    )

    parser.add_argument(
        "--startdate",
        required=True,
        type=parse_startdate,
        help="Start date (yyyymmdd or yyyy-mm-dd)",
    )

    parser.add_argument(
        "--number",
        required=True,
        type=int,
        help="Number of entries per day file",
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be written without writing files",
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging",
    )

    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s: %(message)s",
    )

    split_haikus(
        src=args.src,
        dst=args.dst,
        start_date=args.startdate,
        per_day=args.number,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()

