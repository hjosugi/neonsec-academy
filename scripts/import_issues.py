#!/usr/bin/env python3
"""
Create GitHub issues from issues/phase-*/*.md.

Dry-run by default (prints the gh commands). Use --execute to actually create them.
Requires GitHub CLI authentication and that labels + milestones already exist
(see create_labels.py and create_milestones.py).
"""
from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ISSUES = sorted((ROOT / "issues").glob("phase-*/*.md"))


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---\n"):
        return {}, text
    _, fm, body = text.split("---\n", 2)
    meta: dict[str, str] = {}
    for line in fm.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip().strip('"')
    return meta, body.strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true", help="Actually create issues")
    parser.add_argument("--repo", default=None, help="OWNER/REPO. Optional if inside the repo")
    args = parser.parse_args()

    created, failed = 0, 0
    for path in ISSUES:
        text = path.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(text)
        title = meta.get("title", path.stem)
        labels = [l.strip() for l in meta.get("labels", "").split(",") if l.strip()]
        milestone = meta.get("milestone", "")

        # Write the body (without YAML frontmatter) to a temp file.
        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as tf:
            tf.write(body + "\n")
            body_file = tf.name

        cmd = ["gh", "issue", "create", "--title", title, "--body-file", body_file]
        for label in labels:
            cmd += ["--label", label]
        if milestone:
            cmd += ["--milestone", milestone]
        if args.repo:
            cmd += ["--repo", args.repo]

        print(f"[{'create' if args.execute else 'dry-run'}] {title}")
        if args.execute:
            try:
                subprocess.run(cmd, check=True, capture_output=True, text=True)
                created += 1
            except subprocess.CalledProcessError as e:
                failed += 1
                print(f"  ! failed: {e.stderr.strip().splitlines()[-1] if e.stderr else e}")
        Path(body_file).unlink(missing_ok=True)

    if args.execute:
        print(f"\nDone. Created {created}, failed {failed}.")
    else:
        print(f"\n{len(ISSUES)} issues would be created. Re-run with --execute.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
