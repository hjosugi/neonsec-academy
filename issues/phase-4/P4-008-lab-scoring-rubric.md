---
title: "[P4-008] Lab Scoring Rubric を実装する"
labels: "phase:4,type:feature,area:lab,area:analytics,priority:P1"
milestone: "Phase 4 - Safe Practical Labs"
phase: "4"
priority: "priority:P1"
estimate: "2d"
---

# [P4-008] Lab Scoring Rubric を実装する

## Summary

flag 正解だけでなく、evidence と remediation も評価できるようにする。

## User Story

受験者として、実践課題でどの skill が足りないかを知りたい。

## Requirements

- [x] score components: flag, evidence, explanation, remediation, safety
- [x] hint 使用や scope warning を scoring に反映する
- [x] rubric は challenge type ごとに設定できる
- [x] score breakdown を lab summary に表示する

## Acceptance Criteria

- [x] challenge ごとに score breakdown が出る
- [x] report 提出の有無が score に反映される
- [x] safety acknowledgement が score 条件になる

## Subtasks

- [x] rubric schema を作る
- [x] scoring logic を作る
- [x] summary UI を作る
- [x] settings を作る

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
