# Review System Design

## Goal

ユーザーが毎日迷わず復習できるようにする。

## Review Priority

1. Due today
2. Incorrect recently
3. Low confidence even if correct
4. Weak CEH module
5. Bookmarked / pinned

## Session Types

| Session | Size | Purpose |
|---|---:|---|
| Daily Review | 10-30 | Due items |
| Weak Drill | 10-30 | Weak module |
| Final Sprint | 50 | Exam prep |
| Mistake Review | variable | Wrong answers only |

## Mistake Notebook Fields

- Why I was wrong
- Correct reasoning
- Trap pattern
- Memory phrase
- Next action

## Readiness Factors

- Latest mock score
- 3-mock consistency
- CEH module coverage
- Due review backlog
- Weak module count
- Practical challenge score

## Final Gate Checklist

試験予約前の最終判定として、`/final-gate` は次の条件をまとめて評価する。

- 直近 mock exam が設定回数ぶん連続して目標点以上
- due review backlog が設定上限以内
- weak module 数が設定上限以内
- CEH 20 module に問題が存在し、少なくとも 1 問は回答済み

Fail の場合は各 check に next action を出し、結果は Markdown checklist として export できる。
