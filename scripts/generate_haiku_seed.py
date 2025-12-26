#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import os
from pathlib import Path
from typing import List

from openai import OpenAI


# =================================================
# File loading
# =================================================

def load_text(path: Path, label: str) -> str:
    if not path.exists():
        raise SystemExit(f"ERROR: {label} file not found: {path}")
    return path.read_text(encoding="utf-8")


def compose_prompt(instructions_text: str, template_text: str) -> str:
    if "{{TEMPLATE}}" not in instructions_text:
        raise SystemExit(
            "ERROR: INSTRUCTIONS file does not contain {{TEMPLATE}} placeholder"
        )
    return instructions_text.replace("{{TEMPLATE}}", template_text)


# =================================================
# Validation
# =================================================

def validate_seed(text: str) -> None:
    lines = [myline.rstrip() for myline in text.strip().splitlines() if myline.strip()]
    if len(lines) != 4:
        raise ValueError("Invalid output: expected exactly 3 haiku lines + ###")
    if lines[-1] != "###":
        raise ValueError("Invalid output: final line must be ###")


# =================================================
# Agent call
# =================================================

def call_agent(agenturl: str, api_key: str, prompt: str) -> str:
    if agenturl.lower() != "openai":
        raise SystemExit(f"ERROR: unsupported agenturl '{agenturl}'")

    client = OpenAI(api_key=api_key)

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
        temperature=0.6,
    )

    if not response.output_text or not response.output_text.strip():
        raise RuntimeError("OpenAI returned empty output")

    return response.output_text.strip()


# =================================================
# CLI
# =================================================

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate haiku seeds using template preferences and instruction rules"
    )

    parser.add_argument("--template", required=True, type=Path)
    parser.add_argument("--instructions", required=True, type=Path)
    parser.add_argument("--agenturl", required=True)
    parser.add_argument("--dst", required=True, type=Path)
    parser.add_argument("--number", type=int, default=1)
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--dryrun", action="store_true")

    args = parser.parse_args()

    template_text = load_text(args.template, "TEMPLATE")
    instructions_text = load_text(args.instructions, "INSTRUCTIONS")

    prompt = compose_prompt(instructions_text, template_text)

    if args.verbose or args.dryrun:
        print("=== COMPOSED PROMPT ===")
        print(prompt)
        print("======================")

    if args.dryrun:
        return

    api_key = os.getenv("HAIKU_PROJECT_API_KEY")
    if not api_key:
        raise SystemExit("ERROR: HAIKU_PROJECT_API_KEY is not set")

    outputs: List[str] = []

    for i in range(args.number):
        if args.verbose:
            print(f"[call {i + 1}/{args.number}] invoking agent")

        seed = call_agent(
            agenturl=args.agenturl,
            api_key=api_key,
            prompt=prompt,
        )

        if args.verbose:
            print("=== RAW AGENT OUTPUT ===")
            print(seed)
            print("========================")

        validate_seed(seed)
        outputs.append(seed)

    out_file = args.dst
    if out_file.is_dir():
        out_file = out_file / "haiku_seeds.txt"

    out_file.write_text("\n".join(outputs) + "\n", encoding="utf-8")

    if args.verbose:
        print(f"Wrote {args.number} seed(s) to {out_file}")


if __name__ == "__main__":
    main()

