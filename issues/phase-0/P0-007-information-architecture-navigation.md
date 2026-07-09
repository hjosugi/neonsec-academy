---
title: "[P0-007] 情報設計とナビゲーションを設計する"
labels: "phase:0,type:design,area:design,area:question-bank,priority:P0"
milestone: "Phase 0 - Foundation"
phase: "0"
priority: "priority:P0"
estimate: "1d"
---

# [P0-007] 情報設計とナビゲーションを設計する

## Summary

問題・復習・試験・lab・レポートへ迷わず移動できる構成を決める。

## User Story

ユーザーとして、今日やるべき復習、弱点、模擬試験、実践課題へすぐ行けるようにしたい。

## Requirements

- [x] Global nav: Dashboard, Question Bank, Review, Exam, Labs, Reports, Analytics, Settings
- [x] Cyberpunk map は補助ナビにし、主要操作は productivity nav で行う
- [x] Command palette から主要操作に移動できる設計にする
- [x] mobile / desktop の priority を決める

## Acceptance Criteria

- [x] docs/INFORMATION_ARCHITECTURE.md が存在する
- [x] 主要画面の目的・入口・出口が書かれている
- [x] deep link 設計がある

## Subtasks

- [x] site map を作る
- [x] primary flows を書く
- [x] empty state を決める
- [x] shortcut の候補を決める

## Dependencies

- None

## Safety / Abuse Prevention

この Issue は許可済み教材・ローカルデータ・模擬データのみを対象にする。実システム、第三者サービス、実アカウント、実認証情報を扱わない。

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

- Screen contracts, deep links, empty states, and shortcuts are documented in `docs/INFORMATION_ARCHITECTURE.md`.
