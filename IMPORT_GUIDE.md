# Import Guide

この zip の Issue は Markdown としてそのまま GitHub Issue に貼れます。
一括投入したい場合は、GitHub CLI を使う helper script も入れています。

## 1. Dry run

```bash
python scripts/create_labels.py --repo OWNER/REPO
python scripts/import_issues.py --repo OWNER/REPO
```

## 2. Execute

```bash
python scripts/create_labels.py --repo OWNER/REPO --execute
python scripts/import_issues.py --repo OWNER/REPO --execute
```

## Notes

- Milestones は GitHub UI で先に作るのが簡単です。
- `metadata/milestones.json` を見ながら Phase 0〜6 の milestones を作ってください。
- Project board は `metadata/project_board.md` の column/view を使ってください。
