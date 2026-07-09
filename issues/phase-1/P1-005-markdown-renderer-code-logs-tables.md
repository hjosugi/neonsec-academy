---
title: "[P1-005] Markdown renderer を作り、コード・ログ・表を読みやすく表示する"
labels: "phase:1,type:feature,area:question-bank,area:design,priority:P1"
milestone: "Phase 1 - Question Bank MVP"
phase: "1"
priority: "priority:P1"
estimate: "2d"
---

# [P1-005] Markdown renderer を作り、コード・ログ・表を読みやすく表示する

## Summary

問題文・解説・lab note に Markdown を使い、技術問題を読みやすくする。

## User Story

問題作成者として、ログ、HTTP header、設定ファイル、表を問題文に入れたい。

## Requirements

- [ ] code block, inline code, table, callout を表示する
- [x] 危険な HTML は無効化する
- [x] Cyberpunk theme でも長文が読みやすい line height にする
- [ ] copy button は code block のみに置く

## Acceptance Criteria

- [ ] sample log problem が崩れず表示される
- [x] script tag などの危険な HTML が実行されない
- [x] dark theme で contrast が十分にある

## Subtasks

- [x] renderer 方針を決める
- [x] sanitization を入れる
- [ ] code block style を作る
- [ ] sample を追加する

## Dependencies

- None

## Safety / Abuse Prevention

ユーザー入力 Markdown は信頼しない。HTML 実行、外部 script、tracking pixel、remote image の扱いを制限する。

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
