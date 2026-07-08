---
title: "[P6-004] Command Palette / Terminal Launcher を作る"
labels: "phase:6,type:feature,type:design,area:design,priority:P1"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P1"
estimate: "3d"
---

# [P6-004] Command Palette / Terminal Launcher を作る

## Summary

cyberpunk terminal 感を残しつつ、画面移動と操作を高速化する。

## User Story

ユーザーとして、keyboard で review, mock exam, weak drill, question search へ即移動したい。

## Requirements

- [ ] commands: start review, search question, start mock, weak drill, open lab, export report
- [ ] command は自然な短い alias を持つ
- [ ] 実 OS command は実行しない
- [ ] 結果 preview と keyboard navigation を実装する

## Acceptance Criteria

- [ ] command palette から主要操作に移動できる
- [ ] unknown command は安全に no-op になる
- [ ] OS command injection の余地がない

## Subtasks

- [ ] command registry を作る
- [ ] palette UI を作る
- [ ] keyboard 操作を作る
- [ ] security test を行う

## Dependencies

- None

## Safety / Abuse Prevention

Terminal 風 UI だが、実 shell command は実行しない。アプリ内 command registry に登録された安全な action だけを実行する。

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
