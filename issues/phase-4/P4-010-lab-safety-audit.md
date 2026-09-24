---
title: "[P4-010] Lab Safety Audit を自動化する"
labels: "phase:4,type:security,type:quality,area:safety,area:lab,priority:P0"
milestone: "Phase 4 - Safe Practical Labs"
phase: "4"
priority: "priority:P0"
estimate: "2d"
---

# [P4-010] Lab Safety Audit を自動化する

## Summary

lab content が安全基準に反していないかを publish 前に検査する。

## User Story

プロジェクト管理者として、危険な lab が混入する前に検出したい。

## Requirements

- [x] forbidden target type, public IP, real domain, credential field, live malware reference を検出する
- [x] unsafe category は safe alternative に変換する提案を出す
- [x] audit result を lab metadata に保存する
- [x] manual override は安全レビュー note 必須にする

## Acceptance Criteria

- [x] unsafe sample lab が publish で拒否される
- [x] audit report が表示される
- [x] safe sample lab は publish できる

## Subtasks

- [x] safety rules を作る
- [x] audit runner を作る
- [x] publish gate を作る
- [x] audit report UI を作る

## Dependencies

- None

## Safety / Abuse Prevention

この Issue は安全ゲートそのもの。検出回避を助ける情報ではなく、コンテンツレビューと誤用防止に限定する。

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

- `lib/labSafetyAudit.ts` audits labs with ten rules and safe-alternative suggestions; results are
  stored as `safetyAudit` lab metadata, overrides need reviewer + note + accepted rules, and
  `npm run audit:labs` gates CI (safe sample publishes, unsafe sample is rejected). The `/labs/audit`
  screen shows the report and audits drafts. Verified with unit, type, content, safety, audit, and
  build checks.
