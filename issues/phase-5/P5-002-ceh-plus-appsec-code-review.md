---
title: "[P5-002] CEH+ AppSec Code Review Challenge Track を作る"
labels: "phase:5,type:content,area:lab,area:content,priority:P0"
milestone: "Phase 5 - CEH Plus Practical Track"
phase: "5"
priority: "priority:P0"
estimate: "4d"
---

# [P5-002] CEH+ AppSec Code Review Challenge Track を作る

## Summary

攻撃実行ではなく、コードレビューと修正提案で Web/AppSec 実践力を伸ばす。

## User Story

実践者として、脆弱性の原因をコードから読み、修正案を書けるようになりたい。

## Requirements

- [x] authz, input validation, secrets handling, error handling, dependency risk の課題を作る
- [x] 小さな toy code snippet を使う
- [x] 各課題で vulnerable line, impact, fix を提出する
- [x] 安全な修正例と unit-test idea を解説に含める

## Acceptance Criteria

- [x] 最低 10 個の code review challenge 仕様がある
- [x] 各 challenge に fix explanation がある
- [x] finding と report に連携できる

## Subtasks

- [x] snippet template を作る
- [x] challenge samples を作る
- [x] review form を作る
- [x] report 連携を作る

## Dependencies

- None

## Safety / Abuse Prevention

toy code の静的レビューに限定する。実サービスへの検査、payload 実行、credential 取得は扱わない。

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

- `/tracks/appsec` ships 10 toy-snippet code review challenges across authz, input validation,
  secrets handling, error handling, and dependency risk. Learners submit the vulnerable line(s),
  classification, impact, and fix; results show the explanation, safe fix, and unit-test idea, and
  can become Triage or report findings. Misses enter the Review Queue. Verified with unit, type,
  content, safety, audit, and build checks.
