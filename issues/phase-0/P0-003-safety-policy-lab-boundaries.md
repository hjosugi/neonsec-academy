---
title: "[P0-003] 安全ポリシーと lab boundary を定義する"
labels: "phase:0,type:security,area:safety,priority:P0"
milestone: "Phase 0 - Foundation"
phase: "0"
priority: "priority:P0"
estimate: "1d"
---

# [P0-003] 安全ポリシーと lab boundary を定義する

## Summary

実システムに触れず、許可済みローカル教材だけで学ぶための安全境界を明文化する。

## User Story

開発者として、危険な機能や誤用されやすい機能を最初から除外したい。

## Requirements

- [x] 禁止事項: 外部 scan、実 phishing、credential theft、live malware、DDoS traffic、実 Wi-Fi 攻撃
- [x] 許可事項: 模擬ログ、PCAP、ローカル vulnerable app、toy hash、設定レビュー、レポート演習
- [x] 全 lab に scope contract を必須にする
- [x] ユーザーが scope を確認しないと lab を開始できない UX にする

## Acceptance Criteria

- [x] docs/SAFETY_BOUNDARIES.md が存在する
- [x] すべての practical issue が safety section を持つ
- [x] unsafe content review checklist がある

## Subtasks

- [x] allowed / forbidden の一覧を作る
- [x] lab scope contract のテンプレートを作る
- [x] dangerous category の safe replacement を定義する
- [x] review gate を Issue template に入れる

## Dependencies

- None

## Safety / Abuse Prevention

この Issue 自体が全プロジェクトの安全基準になる。安全に変換できない機能は backlog から削除する。

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
