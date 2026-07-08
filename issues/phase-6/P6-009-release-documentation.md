---
title: "[P6-009] Release Documentation を整備する"
labels: "phase:6,type:quality,type:content,priority:P0"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P0"
estimate: "2d"
---

# [P6-009] Release Documentation を整備する

## Summary

v1.0 に向けて README、setup、usage、content authoring、safety docs を整える。

## User Story

利用者として、何ができるか、どう安全に使うか、どう問題を追加するかをすぐ理解したい。

## Requirements

- [ ] README に product overview, screenshots placeholders, quick start, safety を書く
- [ ] docs に question authoring, lab authoring, import/export を書く
- [ ] dangerous-use disclaimer ではなく、具体的な safe-use policy を書く
- [ ] CHANGELOG の初版を作る

## Acceptance Criteria

- [ ] README だけで利用目的が分かる
- [ ] 安全境界へのリンクが目立つ
- [ ] authoring docs が存在する

## Subtasks

- [ ] README を書く
- [ ] authoring docs を書く
- [ ] safety docs を更新する
- [ ] CHANGELOG を作る

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
