#!/usr/bin/env python3
"""
Create GitHub milestones from metadata/milestones.json.

Dry-run by default. Use --execute to create them via the GitHub API.
Requires GitHub CLI authentication.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MILESTONES = json.loads((ROOT / "metadata" / "milestones.json").read_text(encoding="utf-8"))


def repo_slug(explicit: str | None) -> str:
    if explicit:
        return explicit
    out = subprocess.run(
        ["gh", "repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"],
        capture_output=True, text=True, check=True,
    )
    return out.stdout.strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--repo", default=None, help="OWNER/REPO")
    args = parser.parse_args()

    for m in MILESTONES:
        title = m["title"]
        desc = m.get("description", "")
        print(f"[{'create' if args.execute else 'dry-run'}] milestone: {title}")
        if args.execute:
            slug = repo_slug(args.repo)
            cmd = [
                "gh", "api", "--method", "POST", f"repos/{slug}/milestones",
                "-f", f"title={title}", "-f", f"description={desc}",
            ]
            try:
                subprocess.run(cmd, check=True, capture_output=True, text=True)
            except subprocess.CalledProcessError as e:
                msg = e.stderr.strip().splitlines()[-1] if e.stderr else str(e)
                print(f"  ! {msg}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
