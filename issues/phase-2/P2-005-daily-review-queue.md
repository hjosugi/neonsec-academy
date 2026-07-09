---
title: "[P2-005] Daily Review Queue を作る"
labels: "phase:2,type:feature,area:review,area:design,priority:P0"
milestone: "Phase 2 - Review System"
phase: "2"
priority: "priority:P0"
estimate: "2d"
---

# [P2-005] Daily Review Queue を作る

## Summary

今日の復習だけに集中できる画面を作る。

## User Story

ユーザーとして、アプリを開いたら今日の復習をすぐ始めたい。

## Requirements

- [x] due items を priority 順に並べる
- [x] session size を選べる
- [x] review progress bar を表示する
- [x] 途中終了しても session state を保存する

## Acceptance Criteria

- [x] Start Review から due 問題が始まる
- [x] session 終了時に summary が出る
- [x] 途中終了後に再開できる

## Subtasks

- [x] queue query を作る
- [x] session state を作る
- [x] review runner UI を作る
- [x] summary に接続する

## Dependencies

- None

## Safety / Abuse Prevention

この Issue は許可済み教材・ローカルデータ・模擬データのみを対象にする。実システム、第三者サービス、実アカウント、実認証情報を扱わない。

## Test Plan

- [x] 主要な happy path が手動で再現できる
- [x] 入力エラー時に安全に失敗する
- [x] 永続化されたデータが再読み込み後も一致する

## Definition of Done

- [x] Acceptance Criteria がすべて満たされている
- [x] 必要な docs / schema / sample data が更新されている
- [x] Safety / Abuse Prevention が確認されている
- [x] Review Queue / Analytics への影響が確認されている
- [x] Cyberpunk UI が可読性を邪魔していない

## Notes

- None
