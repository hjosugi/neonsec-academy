---
title: "[P4-009] CEH Practical-style 20 Challenge Simulator を作る"
labels: "phase:4,type:feature,type:content,area:lab,area:exam,priority:P0"
milestone: "Phase 4 - Safe Practical Labs"
phase: "4"
priority: "priority:P0"
estimate: "5d"
---

# [P4-009] CEH Practical-style 20 Challenge Simulator を作る

## Summary

CEH Practical の形式を意識した 20 問構成の安全な総合演習を作る。

## User Story

CEH Practical を目指すユーザーとして、時間制限つきで 20 challenge を通す練習をしたい。

## Requirements

- [x] 20 challenge session を作成できる
- [x] challenge は dataset analysis, config review, report prompt, concept lab を組み合わせる
- [x] timer と progress を表示する
- [x] session 後に practical readiness report を出す

## Acceptance Criteria

- [x] 20 challenge session を開始・終了できる
- [x] 結果が module / skill ごとに集計される
- [x] wrong / weak challenges が review queue に入る

## Subtasks

- [x] session model を作る
- [x] 20 challenge generator を作る
- [x] timer UI を作る
- [x] readiness report を作る

## Dependencies

- None

## Safety / Abuse Prevention

CEH Practical 風の形式だけを模倣し、実ネットワーク侵入や live exploit を要求しない。すべて許可済み local/synthetic dataset で完結する。

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

- Practical Sim builds seeded 20-challenge sessions from 32 synthetic practical challenges (dataset
  analysis, config review, concept lab, report prompt) with a timer, progress navigator, and a
  readiness report by type, module, and skill. Wrong and unsure challenges are scheduled into the
  Review Queue. Verified with unit, type, content, safety, and build checks.
