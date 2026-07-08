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

- [ ] due items を priority 順に並べる
- [ ] session size を選べる
- [ ] review progress bar を表示する
- [ ] 途中終了しても session state を保存する

## Acceptance Criteria

- [ ] Start Review から due 問題が始まる
- [ ] session 終了時に summary が出る
- [ ] 途中終了後に再開できる

## Subtasks

- [ ] queue query を作る
- [ ] session state を作る
- [ ] review runner UI を作る
- [ ] summary に接続する

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
