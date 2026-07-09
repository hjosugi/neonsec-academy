---
title: "[P4-007] Report Builder を実装する"
labels: "phase:4,type:feature,area:lab,area:content,priority:P0"
milestone: "Phase 4 - Safe Practical Labs"
phase: "4"
priority: "priority:P0"
estimate: "3d"
---

# [P4-007] Report Builder を実装する

## Summary

Finding, impact, evidence, remediation をまとめた実務寄り report を作れるようにする。

## User Story

実践者として、技術的な答えだけでなく、相手に伝わるレポートを書く練習をしたい。

## Requirements

- [ ] Executive summary, scope, methodology, findings, remediation, appendix を持つ
- [x] finding から report section を生成できる
- [x] Markdown export を提供する
- [ ] report quality checklist を表示する

## Acceptance Criteria

- [x] lab result から report を作成できる
- [x] finding が report に反映される
- [x] Markdown export ができる
- [ ] quality checklist がすべて確認できる

## Subtasks

- [x] report schema を作る
- [x] editor UI を作る
- [x] finding import を作る
- [x] Markdown export を作る

## Dependencies

- None

## Safety / Abuse Prevention

report に実ターゲット名、実 IP、実 credential、第三者データを含めない warning を表示する。

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
