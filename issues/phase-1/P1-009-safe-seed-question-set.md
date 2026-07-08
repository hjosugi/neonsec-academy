---
title: "[P1-009] 安全な seed question set を作る"
labels: "phase:1,type:content,area:content,area:question-bank,priority:P0"
milestone: "Phase 1 - Question Bank MVP"
phase: "1"
priority: "priority:P0"
estimate: "3d"
---

# [P1-009] 安全な seed question set を作る

## Summary

CEH 20 module を広くカバーする、安全なオリジナル問題の初期セットを用意する。

## User Story

初回ユーザーとして、空の状態ではなく、すぐ復習体験を試せる問題が欲しい。

## Requirements

- [ ] 各 CEH module に最低 3 問のオリジナル問題を作る
- [ ] 問題は概念・防御・ログ分析・レポート判断を中心にする
- [ ] 実攻撃手順や第三者対象の指示は含めない
- [ ] 各問題に explanation と memory phrase を付ける

## Acceptance Criteria

- [ ] 最低 60 問の seed set がある
- [ ] すべての問題に module と difficulty が付いている
- [ ] content QA checklist を通過している

## Subtasks

- [ ] module ごとの問題数を決める
- [ ] sample 問題を作る
- [ ] review する
- [ ] seed data に入れる

## Dependencies

- None

## Safety / Abuse Prevention

seed 問題は defensive reasoning、概念理解、ローカル模擬データのみ。実攻撃の再現手順は入れない。

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
