---
title: "[P6-002] City Map Navigation Overlay を作る"
labels: "phase:6,type:design,type:feature,area:design,area:analytics,priority:P1"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P1"
estimate: "4d"
---

# [P6-002] City Map Navigation Overlay を作る

## Summary

CEH module と CEH+ track を cyberpunk city map として見せる補助 UI を作る。

## User Story

ユーザーとして、20 module の進捗を cyberpunk city map で楽しく把握したい。

## Requirements

- [x] district は CEH module group と CEH+ track に対応する
- [x] map は progress visualization であり、主要ナビの代替にしない
- [x] district status: locked, weak, due, ready, mastered を表示する
- [x] クリックで module drill / review queue に移動する

## Acceptance Criteria

- [x] map から弱点 module に移動できる
- [x] due review が district glow で分かる
- [x] map を非表示にできる

## Subtasks

- [x] district mapping を作る
- [x] map layout を作る
- [x] status visualization を作る
- [x] drill link を作る

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
