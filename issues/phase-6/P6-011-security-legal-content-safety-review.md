---
title: "[P6-011] Security / Legal / Content Safety Review を行う"
labels: "phase:6,type:security,type:quality,area:safety,priority:P0"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P0"
estimate: "3d"
---

# [P6-011] Security / Legal / Content Safety Review を行う

## Summary

v1.0 公開前に危険機能、誤解を招く copy、プライバシーリスクを確認する。

## User Story

公開者として、安全で合法的な学習プロダクトとして公開できる状態にしたい。

## Requirements

- [x] unsafe content scan を全問題・全 lab に実行する
- [x] 外部 target を示す data がないか確認する
- [x] privacy export と public demo を確認する
- [x] README と UI copy が authorized-only を明確にしているか確認する

## Acceptance Criteria

- [x] safety review checklist が完了している
- [x] unsafe content が 0 件になっている
- [x] 残リスクと対応方針が docs に記録されている

## Subtasks

- [x] content scan を実行する
- [x] manual review を行う
- [x] risk register を作る
- [x] release approval を記録する

## Dependencies

- None

## Safety / Abuse Prevention

安全レビューの Issue。見つかった危険項目は修正または削除し、回避方法や実害手順はドキュメントに残さない。

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
