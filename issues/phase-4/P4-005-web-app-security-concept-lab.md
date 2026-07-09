---
title: "[P4-005] Web App Security Concept Lab を作る"
labels: "phase:4,type:content,area:lab,area:content,priority:P1"
milestone: "Phase 4 - Safe Practical Labs"
phase: "4"
priority: "priority:P1"
estimate: "3d"
---

# [P4-005] Web App Security Concept Lab を作る

## Summary

Web security の概念を安全なローカル教材で理解する lab type を作る。

## User Story

CEH 受験者として、Web app の脆弱性を攻撃手順の暗記ではなく、原因と修正で理解したい。

## Requirements

- [ ] broken access control, input validation, session, security headers などを扱う
- [x] 課題は local toy app または静的 request/response dataset に限定する
- [x] 各課題で finding, impact, remediation を書かせる
- [x] 危険な payload 集や実サイト検査手順は含めない

## Acceptance Criteria

- [ ] 最低 4 つの web concept lab sample がある
- [ ] 各 sample は remediation を要求する
- [x] unsafe target warning が表示される

## Subtasks

- [ ] lab template を作る
- [x] sample request/response を作る
- [x] report prompt を作る
- [x] safety review を行う

## Dependencies

- None

## Safety / Abuse Prevention

第三者 Web サイトに対する検査手順は含めない。local toy app / static request-response のみ扱う。

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
