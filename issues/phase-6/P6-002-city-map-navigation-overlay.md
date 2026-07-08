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

- [ ] district は CEH module group と CEH+ track に対応する
- [ ] map は progress visualization であり、主要ナビの代替にしない
- [ ] district status: locked, weak, due, ready, mastered を表示する
- [ ] クリックで module drill / review queue に移動する

## Acceptance Criteria

- [ ] map から弱点 module に移動できる
- [ ] due review が district glow で分かる
- [ ] map を非表示にできる

## Subtasks

- [ ] district mapping を作る
- [ ] map layout を作る
- [ ] status visualization を作る
- [ ] drill link を作る

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
