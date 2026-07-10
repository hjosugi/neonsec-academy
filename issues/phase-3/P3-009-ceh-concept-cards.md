---
title: "[P3-009] CEH Concept Cards を作る"
labels: "phase:3,type:content,area:content,area:review,priority:P1"
milestone: "Phase 3 - CEH Exam Mode"
phase: "3"
priority: "priority:P1"
estimate: "3d"
---

# [P3-009] CEH Concept Cards を作る

## Summary

問題の周辺知識を 1 枚カードで復習できるようにする。

## User Story

受験者として、問題を解く前後に短い要点カードで理解を補強したい。

## Requirements

- [x] 各 module に minimum 5 concept cards を用意する
- [x] cards は meaning, when used, exam trap, remember phrase を含める
- [x] 危険な tool 手順ではなく、概念・判断・防御観点に寄せる
- [x] cards を問題と相互リンクする

## Acceptance Criteria

- [x] 最低 100 枚の card 仕様が用意される
- [x] question detail から関連 card を見られる
- [x] card から関連 questions に行ける

## Subtasks

- [x] card schema を作る
- [x] card samples を作る
- [x] question link を作る
- [x] card viewer を作る

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
