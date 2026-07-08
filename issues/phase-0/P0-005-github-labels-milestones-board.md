---
title: "[P0-005] GitHub labels / milestones / project board を定義する"
labels: "phase:0,type:infra,type:quality,priority:P1"
milestone: "Phase 0 - Foundation"
phase: "0"
priority: "priority:P1"
estimate: "0.5d"
---

# [P0-005] GitHub labels / milestones / project board を定義する

## Summary

Phase 0〜6 を GitHub Issues でそのまま管理できるようにする。

## User Story

プロジェクト管理者として、Issue を迷わず分類し、Phase ごとの進捗を追えるようにしたい。

## Requirements

- [ ] phase, type, area, priority の label セットを定義する
- [ ] Phase 0〜6 の milestones を定義する
- [ ] Project board の columns を定義する
- [ ] Issue import 用の metadata frontmatter を用意する

## Acceptance Criteria

- [ ] docs/LABELS.md と docs/MILESTONES.md が存在する
- [ ] 全 Issue に phase label と milestone がある
- [ ] Import script が dry-run で全 Issue を表示できる

## Subtasks

- [ ] label 定義を書く
- [ ] milestone 定義を書く
- [ ] board columns を書く
- [ ] Issue import guide を書く

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
