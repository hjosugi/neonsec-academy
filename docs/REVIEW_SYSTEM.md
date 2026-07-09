# Review System Design

## Goal

ユーザーが毎日迷わず復習できるようにする。

## Review Priority

1. Due today
2. Incorrect recently
3. Low confidence even if correct
4. Weak CEH module
5. Bookmarked / pinned

## Scheduling Inputs

Each reviewed question keeps one `ReviewItem` with `intervalDays`, `dueAt`, `ease`, `lapses`,
`lastReviewed`, and the latest self-rated `confidence` when available.

- Incorrect answers schedule as `again` and return tomorrow.
- Correct answers use the 4-button grade plus confidence.
- Confidence `1` or `2` shortens the next interval; confidence `5` slightly extends it.
- If confidence input is hidden in Settings, the app records the neutral default `3`.
- Question Detail can manually reschedule a card for now, tomorrow, or seven days out.
- Settings exposes a daily review cap so one day does not flood the queue.

## Daily Review Session State

Daily Review freezes the due queue when a session starts. The current queue, index, correct count,
and creation time are saved in localStorage under `neonsec:review-session:v1`, so leaving the review
screen and coming back resumes the in-progress session. Finishing or starting a fresh review clears
that saved session.

## Streaks And Achievements

The dashboard shows the current study streak with copy that treats a missed day as a restart point,
not a failure. Lightweight achievements are limited to local learning behavior such as reviews,
module coverage, mock exams, reports, and answer accuracy; there is no leaderboard. Settings can
hide achievements and pause new badge awards while keeping progress, reviews, and readiness active.

## Session Types

| Session | Size | Purpose |
|---|---:|---|
| Daily Review | 10-30 | Due items |
| Weak Drill | 10-30 | Weak module |
| Final Sprint | 50 | Exam prep |
| Mistake Review | variable | Wrong answers only |

## Keyboard Review Flow

See `docs/KEYBOARD_SHORTCUTS.md` for the full map. In Review, answer choices use number keys before
submit; after reveal, `1`/`2`/`3`/`4` apply `Again`/`Hard`/`Good`/`Easy`. `Enter`, `N`, and
right-arrow advance with `Good` when correct and `Again` when incorrect. `B` toggles bookmark.

## Scheduling Model

Review items store `intervalDays`, `dueAt`, `ease`, `lapses`, latest result, and latest confidence.
The app uses an SM-2 style scheduler:

- Incorrect answers schedule an `again` review for tomorrow and increment lapses.
- Correct answers with low confidence (`1`-`2`) are treated as harder recalls and get shorter intervals.
- Correct answers with high confidence (`5`) can move further out.
- Settings has a separate daily review cap so a large backlog does not overload one session.
- Question Detail can manually reschedule a review item to now, tomorrow, or seven days out.
- Daily Review lets the learner choose a session size from currently due cards. The active queue,
  current index, and correct count are saved in local storage so "Save & exit" can resume later.

## Mistake Notebook Fields

- Why I was wrong
- Correct reasoning
- Trap pattern
- Reasoning gap from free-form explanation compare
- Memory phrase
- Next action

The notebook supports open/resolved status, module filters, tag filters, updated-date filters, and
a "needs notes" view for entries missing the core reflection fields. Dashboard and Question Detail
link back to the notebook so missed questions are visible outside the list view.

## Explanation Compare

Short-answer, scenario, and report-prompt questions ask the learner to write their reasoning before
revealing the model answer. After reveal, the app displays the learner's reasoning beside the model
answer and explanation, then lets the learner save a reasoning-gap note to the Mistake Notebook.
Review completion summarizes how many reasoning-gap notes were captured.

## Readiness Factors

- Latest mock score
- 3-mock consistency
- CEH module coverage
- Due review backlog
- Weak module count
- Practical challenge score

## Final Gate Checklist

試験予約前の最終判定として、`/final-gate` は次の条件をまとめて評価する。

- 直近 mock exam が設定回数ぶん連続して目標点以上
- due review backlog が設定上限以内
- weak module 数が設定上限以内
- CEH 20 module に問題が存在し、少なくとも 1 問は回答済み

Fail の場合は各 check に next action を出し、結果は Markdown checklist として export できる。
