---
title: "[P5-009] Team / Peer Review Mode の設計を作る"
labels: "phase:5,type:design,type:feature,area:content,priority:P2"
milestone: "Phase 5 - CEH Plus Practical Track"
phase: "5"
priority: "priority:P2"
estimate: "2d"
---

# [P5-009] Team / Peer Review Mode の設計を作る

## Summary

将来、問題・レポート・lab writeup を他者レビューできるようにする設計を用意する。

## User Story

学習者として、自分のレポートや考え方を安全にレビューしてもらいたい。

## Requirements

- [x] MVP では実装せず、data model と UX だけ定義する
- [x] comment, suggestion, approval, safety flag を設計する
- [x] private data masking を前提にする
- [x] review rubric を作る

## Acceptance Criteria

- [x] docs/PEER_REVIEW_DESIGN.md がある
- [x] review comment schema がある
- [x] privacy / safety guardrails がある

## Subtasks

- [x] use cases を書く
- [x] comment schema を作る
- [x] review rubric を作る
- [x] privacy rules を作る

## Dependencies

- None

## Safety / Abuse Prevention

他者と共有する前提の機能は、実ターゲット情報や秘密情報を含まない public-safe content のみに限定する。

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

- Design only: `docs/PEER_REVIEW_DESIGN.md` (EN/JA) defines use cases, roles, data model, rubric, UX
  flows, and privacy/safety guardrails; `docs/schemas/peer-review-comment.schema.json` and
  `docs/schemas/peer-review-package.schema.json` define the comment and package schemas, with examples
  validated in unit tests.
