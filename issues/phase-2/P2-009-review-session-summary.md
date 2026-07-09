---
title: "[P2-009] Review Session Summary を作る"
labels: "phase:2,type:feature,area:review,area:analytics,priority:P0"
milestone: "Phase 2 - Review System"
phase: "2"
priority: "priority:P0"
estimate: "2d"
---

# [P2-009] Review Session Summary を作る

## Summary

復習終了後に成果・ミス・次の行動を 1 画面で確認できるようにする。

## User Story

ユーザーとして、今日の復習で何が改善し、次に何をすべきかを知りたい。

## Requirements

- [ ] session accuracy, time spent, new mistakes, mastered items を表示する
- [ ] weak modules と next drill CTA を出す
- [ ] mistake notebook 未記入項目を出す
- [ ] summary を後から見返せるように保存する

## Acceptance Criteria

- [x] review 完了後に summary が出る
- [ ] next action が 1〜3 個表示される
- [ ] 過去 session summary を一覧できる

## Subtasks

- [x] summary data を作る
- [x] summary UI を作る
- [ ] history を作る
- [ ] next action logic を作る

## Dependencies

- None

## Safety / Abuse Prevention

この Issue は許可済み教材・ローカルデータ・模擬データのみを対象にする。実システム、第三者サービス、実アカウント、実認証情報を扱わない。

## Test Plan

- [ ] 主要な happy path が手動で再現できる
- [ ] 入力エラー時に安全に失敗する
- [ ] 永続化されたデータが再読み込み後も一致する

## Definition of Done

- [ ] Acceptance Criteria がすべて満たされている
- [ ] 必要な docs / schema / sample data が更新されている
- [ ] Safety / Abuse Prevention が確認されている
- [ ] Review Queue / Analytics への影響が確認されている
- [ ] Cyberpunk UI が可読性を邪魔していない

## Notes

- None
