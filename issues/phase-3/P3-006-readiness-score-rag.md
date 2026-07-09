---
title: "[P3-006] Readiness Score を Red / Amber / Green で表示する"
labels: "phase:3,type:feature,area:analytics,area:exam,priority:P1"
milestone: "Phase 3 - CEH Exam Mode"
phase: "3"
priority: "priority:P1"
estimate: "2d"
---

# [P3-006] Readiness Score を Red / Amber / Green で表示する

## Summary

模試・復習・coverage を総合して受験準備度を見える化する。

## User Story

受験者として、今受けるべきか、まだ復習すべきかを判断したい。

## Requirements

- [x] score, consistency, coverage, due backlog, weak modules から readiness を計算する
- [x] Green は複数回 mock exam の安定性を条件にする
- [x] 数値の根拠を説明する
- [x] 過度な断定は避け、decision support として表示する

## Acceptance Criteria

- [x] readiness が dashboard に表示される
- [x] 根拠の breakdown が見える
- [x] Green 条件を満たすまで next action が出る

## Subtasks

- [x] formula を設計する
- [x] status UI を作る
- [x] breakdown を作る
- [x] threshold settings を作る

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

- None
