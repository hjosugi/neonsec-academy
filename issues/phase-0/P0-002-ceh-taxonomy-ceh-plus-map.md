---
title: "[P0-002] CEH 20 module と CEH+ 実践トラックの分類体系を定義する"
labels: "phase:0,type:content,area:content,area:exam,priority:P0"
milestone: "Phase 0 - Foundation"
phase: "0"
priority: "priority:P0"
estimate: "1d"
---

# [P0-002] CEH 20 module と CEH+ 実践トラックの分類体系を定義する

## Summary

CEH 公式 module、問題 domain、実践 skill、CEH 後の skill track を同じ taxonomy で管理できるようにする。

## User Story

問題作成者として、すべての問題・復習・lab を CEH module と実践 skill に紐付けたい。

## Requirements

- [ ] CEH 20 module を固定 master data として持つ
- [ ] 各問題に module, subtopic, skill_type, difficulty, source_type を付けられる
- [ ] CEH+ track として pentest, AppSec, cloud, SOC, IR, reporting を追加する
- [ ] module と CEH+ track の対応表を作る

## Acceptance Criteria

- [ ] 20 module すべてが docs/taxonomy.md に記載されている
- [ ] question schema から module と CEH+ track を参照できる
- [ ] 未分類問題を検出できるルールがある

## Subtasks

- [ ] CEH module list を master data 化する
- [ ] CEH+ skill track を定義する
- [ ] difficulty と question_type を定義する
- [ ] coverage matrix の初版を作る

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

- CEH 後の実践トラックは攻撃手順ではなく、許可済み評価・防御・レポート・ログ分析中心で扱う。
