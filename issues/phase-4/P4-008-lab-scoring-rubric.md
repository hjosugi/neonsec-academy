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

- [ ] score components: flag, evidence, explanation, remediation, safety
- [ ] hint 使用や scope warning を scoring に反映する
- [ ] rubric は challenge type ごとに設定できる
- [ ] score breakdown を lab summary に表示する

## Acceptance Criteria

- [ ] challenge ごとに score breakdown が出る
- [ ] report 提出の有無が score に反映される
- [ ] safety acknowledgement が score 条件になる

## Subtasks

- [ ] rubric schema を作る
- [ ] scoring logic を作る
- [ ] summary UI を作る
- [ ] settings を作る

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
