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

- [x] Executive summary, scope, methodology, findings, remediation, appendix を持つ
- [x] finding から report section を生成できる
- [x] Markdown export を提供する
- [x] report quality checklist を表示する

## Acceptance Criteria

- [x] lab result から report を作成できる
- [x] finding が report に反映される
- [x] Markdown export ができる
- [x] quality checklist がすべて確認できる

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

- Reports now have executive summary, scope, methodology, findings, remediation plan, and appendix
  sections, generated drafts from findings, a visible quality checklist, a safety warning with detected
  real-target/credential values, and Markdown export of every section. Lab results seed complete
  reports. Verified with unit, type, content, safety, and build checks.
