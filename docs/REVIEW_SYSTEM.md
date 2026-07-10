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
missed/mastered IDs, reasoning-gap count, and creation time are saved in localStorage under
`neonsec:review-session:v1`, so leaving the review screen and coming back resumes the in-progress
session. Finishing or starting a fresh review clears that saved session.

## Review Session Summary

When a review finishes, the app saves a recent session summary with accuracy, time spent, new
mistakes, mastered items, reasoning-gap count, weak modules, incomplete mistake-note count, and one
to three next actions. The Review screen lists recent summaries so completed sessions can be checked
later.

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
- Question Detail also has a Retry Later action that inserts the card into today's due review queue.
- Daily Review lets the learner choose a session size from currently due cards. The active queue,
  current index, and correct count are saved in local storage so "Save & exit" can resume later.

## Bookmarks And Pin Notes

Bookmarks keep a question in the pinned view for later drilling. Question Detail stores optional
pin notes in `pinNotes[questionId]`; saving a non-empty note also pins the question. Question Bank
shows a note marker for pinned questions with notes.

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
- Configured mock streak consistency
- CEH module coverage
- Due review backlog
- Weak module count
- Practical challenge score

Readiness is decision support, not a guarantee. Green requires both a high blended score and all
configured gates to pass: recent mock streak at the target score, coverage target, due backlog limit,
and weak-module limit. Dashboard shows the top next action until Green is reached; Analytics shows
all gate details. Settings controls the mock streak length, mock target, coverage target, due backlog
limit, weak-module mastery threshold, and allowed weak-module count.

## CEH Coverage Matrix

Analytics lists all 20 CEH modules with inventory, attempted coverage, accuracy, due reviews,
confidence, trend, and readiness/mastery. The coverage target and minimum question inventory are
user settings. Module rows distinguish missing inventory, low inventory, unanswered modules, low
coverage, weak mastery, and ready modules, and clicking a row starts a module drill.

## Exam Weighting Config

Mock Exam keeps the standard full, half, quick, and weakness-focused starters, plus an editable
module-count weighting editor. Built-in weighted drafts include balanced, weak-focused, and
final-ready 125-question presets. Learners can edit per-module counts, save or duplicate presets in
local storage, and start a weighted exam. If a module or domain lacks enough gradable questions, the
generator shows fallback warnings and fills remaining slots from the available pool.

## Exam Randomization

Mock Exam selection uses a saved numeric seed so the same session can be reviewed reproducibly.
Question selection prefers items that were not used in the latest three mock results while preserving
domain or module-count coverage; recently used questions are only reused when the available pool is
too small. Multiple-choice display order is shuffled per question from the same seed and saved in
the session/result so the result review shows the original exam order.

## Exam Result Report

Mock Exam results show the overall score, configured target score, safety margin, time spent,
flagged-question accuracy, domain breakdown, module breakdown, and answer review. A seven-day repair
plan is generated from incorrect answers, flagged questions, and the weakest scored modules. The
report can be copied or downloaded as Markdown from the result screen.

## Mock Exam Review Mode

Exam Report review can filter questions by wrong answer, flagged, low confidence, slow response, or
all questions. The filtered set can be bulk-added to today's Review Queue. Individual questions can
be sent to the Mistake Notebook with the explanation trap, correct reasoning, memory phrase, and a
module-specific next action prefilled.

## Weak Module Drill

Practice can run a focused drill from all questions, one CEH module, a CEH+ track, pinned questions,
or the current weakest modules. Drills can be narrowed by tag, question type, and difficulty, then
started with 10, 20, or 30 questions. Queue generation prefers questions that were not recently
attempted and only falls back to older questions when the fresh pool is too small. Drill answers are
recorded as `mode: "drill"` attempts, update Review Queue scheduling, and feed Analytics module
mastery. Completed or partial drills are saved as `DrillResult` entries and shown in Dashboard /
Analytics.

## Concept Cards

Concept Cards provide one-screen review notes for the surrounding knowledge behind CEH questions.
Each CEH module has five seed cards with `meaning`, `whenUsed`, `examTrap`, and `rememberPhrase`.
Cards stay conceptual and defensive; they do not include tool procedures, payloads, target steps, or
credential-handling instructions. The `/cards` viewer lists and searches cards, card detail links to
related questions, and Question Detail links back to related cards through module and tag overlap.

## Final Gate Checklist

試験予約前の最終判定として、`/final-gate` は次の条件をまとめて評価する。

- 直近 mock exam が設定回数ぶん連続して目標点以上
- due review backlog が設定上限以内
- weak module 数が設定上限以内
- CEH 20 module に問題が存在し、少なくとも 1 問は回答済み

Fail の場合は各 check に next action を出し、結果は Markdown checklist として export できる。
