---
title: "[P2-007] Explanation Compare View を作る"
labels: "phase:2,type:feature,area:review,priority:P1"
milestone: "Phase 2 - Review System"
phase: "2"
priority: "priority:P1"
estimate: "2d"
---

# [P2-007] Explanation Compare View を作る

## Summary

自分の回答理由と公式 explanation を比較できるようにする。

## User Story

ユーザーとして、単に答えを覚えるのではなく、考え方のズレを直したい。

## Requirements

- [x] short_answer / scenario で user reasoning を入力できる
- [x] model answer と side-by-side で比較する
- [x] 差分メモを mistake notebook に送れる
- [x] 採点は自動化しすぎず self-check を基本にする

## Acceptance Criteria

- [x] user reasoning と explanation が並んで表示される
- [x] compare note を保存できる
- [x] review summary に reasoning gap が出る

## Subtasks

- [x] reasoning input を作る
- [x] compare layout を作る
- [x] notebook 連携を作る
- [x] summary 連携を作る

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
