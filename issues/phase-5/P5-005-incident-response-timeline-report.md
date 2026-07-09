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

- [ ] timeline event: time, source, observation, confidence, related evidence を持つ
- [ ] incident summary, impact, containment, eradication, recovery, lessons learned を書く
- [x] SOC log track と連携する
- [ ] report quality checklist を入れる

## Acceptance Criteria

- [ ] synthetic incident を timeline に整理できる
- [ ] IR report を Markdown export できる
- [ ] missing evidence warning が出る

## Subtasks

- [ ] timeline schema を作る
- [ ] timeline UI を作る
- [ ] IR report template を作る
- [ ] quality checklist を作る

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
