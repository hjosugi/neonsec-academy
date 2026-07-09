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

- [ ] authz, input validation, secrets handling, error handling, dependency risk の課題を作る
- [x] 小さな toy code snippet を使う
- [ ] 各課題で vulnerable line, impact, fix を提出する
- [ ] 安全な修正例と unit-test idea を解説に含める

## Acceptance Criteria

- [ ] 最低 10 個の code review challenge 仕様がある
- [x] 各 challenge に fix explanation がある
- [ ] finding と report に連携できる

## Subtasks

- [ ] snippet template を作る
- [x] challenge samples を作る
- [ ] review form を作る
- [ ] report 連携を作る

## Dependencies

- None

## Safety / Abuse Prevention

toy code の静的レビューに限定する。実サービスへの検査、payload 実行、credential 取得は扱わない。

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
