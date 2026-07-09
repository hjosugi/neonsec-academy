---
title: "[P2-008] Bookmark / Pin / Retry Later を実装する"
labels: "phase:2,type:feature,area:question-bank,area:review,priority:P1"
milestone: "Phase 2 - Review System"
phase: "2"
priority: "priority:P1"
estimate: "1d"
---

# [P2-008] Bookmark / Pin / Retry Later を実装する

## Summary

重要問題や後で見直したい問題を手動で管理できるようにする。

## User Story

ユーザーとして、試験直前に見たい問題を自分でまとめたい。

## Requirements

- [x] question を bookmark できる
- [ ] pin note を付けられる
- [ ] retry later を押すと review queue に入る
- [x] bookmarked view を作る

## Acceptance Criteria

- [x] bookmark した問題だけ一覧できる
- [ ] retry later が due queue に反映される
- [ ] pin note が question detail に表示される

## Subtasks

- [x] bookmark schema を作る
- [x] button を追加する
- [x] list view を作る
- [ ] queue 連携を作る

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
