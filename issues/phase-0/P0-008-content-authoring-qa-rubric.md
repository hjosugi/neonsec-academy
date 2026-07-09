---
title: "[P0-008] Content authoring guideline と QA rubric を作る"
labels: "phase:0,type:content,type:quality,area:content,priority:P1"
milestone: "Phase 0 - Foundation"
phase: "0"
priority: "priority:P1"
estimate: "1d"
---

# [P0-008] Content authoring guideline と QA rubric を作る

## Summary

CEH 問題と CEH+ 実践課題を安全・一貫・復習しやすく作るための基準を作る。

## User Story

問題作成者として、よい問題、悪い問題、危険な問題を判断できる基準が欲しい。

## Requirements

- [x] 1 問 1 concept を原則にする
- [x] 解説は answer, why, trap, memory phrase を含める
- [x] 実践課題は objective, dataset, expected evidence, remediation を含める
- [x] 危険な手順は概念・検知・防御・ローカル教材に変換する

## Acceptance Criteria

- [x] docs/CONTENT_GUIDE.md が存在する
- [x] question review checklist がある
- [x] lab content safety checklist がある

## Subtasks

- [x] question template を作る
- [x] explanation template を作る
- [x] lab template を作る
- [x] review rubric を作る

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
