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

- [ ] MVP では実装せず、data model と UX だけ定義する
- [ ] comment, suggestion, approval, safety flag を設計する
- [ ] private data masking を前提にする
- [ ] review rubric を作る

## Acceptance Criteria

- [ ] docs/PEER_REVIEW_DESIGN.md がある
- [ ] review comment schema がある
- [ ] privacy / safety guardrails がある

## Subtasks

- [ ] use cases を書く
- [ ] comment schema を作る
- [ ] review rubric を作る
- [ ] privacy rules を作る

## Dependencies

- None

## Safety / Abuse Prevention

他者と共有する前提の機能は、実ターゲット情報や秘密情報を含まない public-safe content のみに限定する。

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
