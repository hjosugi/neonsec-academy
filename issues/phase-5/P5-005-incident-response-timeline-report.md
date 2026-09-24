---
title: "[P5-005] Incident Response Timeline / Report Track を作る"
labels: "phase:5,type:content,area:lab,area:content,priority:P1"
milestone: "Phase 5 - CEH Plus Practical Track"
phase: "5"
priority: "priority:P1"
estimate: "3d"
---

# [P5-005] Incident Response Timeline / Report Track を作る

## Summary

発見後の対応、時系列整理、報告書作成までを練習できるようにする。

## User Story

実践者として、見つけた事象を timeline と action plan に落とし込みたい。

## Requirements

- [x] timeline event: time, source, observation, confidence, related evidence を持つ
- [x] incident summary, impact, containment, eradication, recovery, lessons learned を書く
- [x] SOC log track と連携する
- [x] report quality checklist を入れる

## Acceptance Criteria

- [x] synthetic incident を timeline に整理できる
- [x] IR report を Markdown export できる
- [x] missing evidence warning が出る

## Subtasks

- [x] timeline schema を作る
- [x] timeline UI を作る
- [x] IR report template を作る
- [x] quality checklist を作る

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

- `/tracks/ir` reconstructs a fictional incident into a timeline (time, source, observation,
  confidence, related evidence) from artifact lines, manual events, and imported SOC track timelines,
  then writes and exports a Markdown IR report with a quality checklist and missing-evidence warning.
  Verified with unit, type, content, safety, audit, and build checks.
