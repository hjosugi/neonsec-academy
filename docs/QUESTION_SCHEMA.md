# Question Schema

## Required fields

- id
- type
- module
- difficulty
- tags
- body
- answer
- explanation.answer
- explanation.why
- explanation.trap
- explanation.memory_phrase

## Supported question types

- mcq
- multi_select
- true_false
- short_answer
- scenario
- report_prompt

## Explanation Format

```text
Answer:
Why:
Trap:
Memory phrase:
Next review action:
```

## Quality Rules

- 1 問 1 concept。
- 正解だけでなく、なぜ他の選択肢が罠かを書く。
- 危険な手順を答えにしない。
- 実サービス・実ターゲットを前提にしない。
