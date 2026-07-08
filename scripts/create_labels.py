#!/usr/bin/env python3
"""
Dry-run by default. Use --execute to create/update GitHub labels with gh CLI.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LABELS = json.loads((ROOT / "metadata" / "labels.json").read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--repo", default=None)
    args = parser.parse_args()

    for label in LABELS:
        cmd = [
            "gh", "label", "create", label["name"],
            "--color", label["color"],
            "--description", label["description"],
            "--force",
        ]
        if args.repo:
            cmd += ["--repo", args.repo]
        print(" ".join(cmd))
        if args.execute:
            subprocess.run(cmd, check=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
