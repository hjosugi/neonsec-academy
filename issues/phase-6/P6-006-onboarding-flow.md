---
title: "[P6-006] Onboarding Flow を作る"
labels: "phase:6,type:feature,type:design,area:design,priority:P0"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P0"
estimate: "3d"
---

# [P6-006] Onboarding Flow を作る

## Summary

初回ユーザーが 5 分以内に問題管理と復習管理を理解できるようにする。

## User Story

初回ユーザーとして、何から始めるべきかすぐ分かりたい。

## Requirements

- [x] goal selection: CEH exam, CEH Practical, CEH+, all を選べる
- [x] daily review size と target date を設定できる
- [x] seed questions を入れるか選べる
- [x] safety policy を確認する step を入れる

## Acceptance Criteria

- [x] 初回起動時に onboarding が出る
- [x] 完了後に dashboard が personalized される
- [x] safety acknowledgement が保存される

## Subtasks

- [x] onboarding steps を作る
- [x] settings save を作る
- [x] seed import option を作る
- [x] dashboard 反映を作る

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
