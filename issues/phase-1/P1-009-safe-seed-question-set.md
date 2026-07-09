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

- [x] 各 CEH module に最低 3 問のオリジナル問題を作る
- [x] 問題は概念・防御・ログ分析・レポート判断を中心にする
- [x] 実攻撃手順や第三者対象の指示は含めない
- [x] 各問題に explanation と memory phrase を付ける

## Acceptance Criteria

- [x] 最低 60 問の seed set がある
- [x] すべての問題に module と difficulty が付いている
- [x] content QA checklist を通過している

## Subtasks

- [x] module ごとの問題数を決める
- [x] sample 問題を作る
- [x] review する
- [x] seed data に入れる

## Dependencies

- None

## Safety / Abuse Prevention

seed 問題は defensive reasoning、概念理解、ローカル模擬データのみ。実攻撃の再現手順は入れない。

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
