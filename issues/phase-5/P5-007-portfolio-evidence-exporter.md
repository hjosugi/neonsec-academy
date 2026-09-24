---
title: "[P5-007] Portfolio Evidence Exporter を作る"
labels: "phase:5,type:feature,area:analytics,area:content,priority:P1"
milestone: "Phase 5 - CEH Plus Practical Track"
phase: "5"
priority: "priority:P1"
estimate: "3d"
---

# [P5-007] Portfolio Evidence Exporter を作る

## Summary

CEH 合格後の実践力を示すため、安全に公開可能な学習成果を出力する。

## User Story

ユーザーとして、実データを含めずに、学習成果やレポート能力をポートフォリオ化したい。

## Requirements

- [x] export 対象: mock exam stats, lab reports, sanitized findings, reflection notes
- [x] 秘密情報や実ターゲット情報を自動で除外する warning を出す
- [x] public-safe mode を用意する
- [x] Markdown portfolio を生成する

## Acceptance Criteria

- [x] public-safe portfolio を export できる
- [x] sensitive placeholder check が動く
- [x] export 前に privacy checklist が出る

## Subtasks

- [x] export schema を作る
- [x] sanitization checklist を作る
- [x] Markdown generator を作る
- [x] preview UI を作る

## Dependencies

- None

## Safety / Abuse Prevention

実ターゲット名、実 IP、credential、個人情報、非公開情報を export しない。public-safe mode を default にする。

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

- `/portfolio` exports mock exam stats, practical results, track progress, lab reports, sanitized
  findings, and reflection notes as Markdown with public-safe mode on by default, a sensitive
  placeholder check that blocks unsafe output, and a mandatory privacy checklist. Verified with unit,
  type, content, safety, audit, and build checks.
