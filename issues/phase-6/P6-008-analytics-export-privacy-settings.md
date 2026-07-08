---
title: "[P6-008] Analytics Export と Privacy Settings を作る"
labels: "phase:6,type:feature,area:analytics,area:safety,priority:P1"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P1"
estimate: "2d"
---

# [P6-008] Analytics Export と Privacy Settings を作る

## Summary

学習・復習・模試結果を安全に export できるようにする。

## User Story

ユーザーとして、自分の進捗をバックアップしたり、公開可能な形で共有したい。

## Requirements

- [ ] export targets: attempts, review schedule, mock summaries, lab summaries, reports
- [ ] public-safe export と full backup export を分ける
- [ ] sensitive field masking を行う
- [ ] export 前に privacy checklist を表示する

## Acceptance Criteria

- [ ] full backup JSON を export できる
- [ ] public-safe Markdown を export できる
- [ ] privacy checklist が表示される

## Subtasks

- [ ] export types を作る
- [ ] masking rules を作る
- [ ] settings UI を作る
- [ ] preview を作る

## Dependencies

- None

## Safety / Abuse Prevention

public-safe export を default にする。実情報、credential、private note は明示的に除外する。

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
