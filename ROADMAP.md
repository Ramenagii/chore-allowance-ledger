# Chore Allowance Ledger Improvement Roadmap

## Objective

Improve the chore allowance ledger with purposeful motion, clearer interaction feedback, and a few reliability fixes that make the app feel calmer and more trustworthy during day-to-day family use.

This roadmap is an implementation checklist for a future build pass. It does not describe completed work.

## Current State

- The app has a compact local-first dashboard with chores, approvals, allowance history, rewards, fairness bars, export, reset, and print actions.
- Most state changes happen instantly with little visual continuity, so users may miss what changed after filtering chores, marking work done, approving tasks, or redeeming rewards.
- The code is currently small and centralized, with the main UI in `src/App.tsx` and styling in `src/style.css`.
- A few general UX issues should be handled alongside motion work: safer stored-state loading, text encoding cleanup, reward redemption validation, and action feedback.

## Phase 1: Motion Foundation

- Add a small motion system in CSS using shared duration and easing variables.
  - Acceptance: repeated motion values are centralized and easy to tune.
- Add initial staggered reveals for the hero summary, kid filters, dashboard panels, chore cards, reward cards, ledger rows, and fairness section.
  - Acceptance: major sections enter in a clear top-to-bottom rhythm without delaying the app from being usable.
- Add a `prefers-reduced-motion: reduce` override for all new animations and transitions.
  - Acceptance: users who request reduced motion receive near-instant transitions with no looping or large movement.
- Animate fairness bars from zero width to their computed width on first render.
  - Acceptance: the bar fill communicates comparative progress while preserving the existing point values.

## Phase 2: Interaction Polish

- Add kid filter transitions so the chore list feels reorganized instead of abruptly replaced.
  - Acceptance: switching between Everyone, Ava, and Kai gives visible continuity without layout jumping.
- Add enter and exit animation patterns for approval queue items.
  - Acceptance: a chore marked done visibly moves into the parent queue, and an approved chore leaves the queue cleanly.
- Add ledger row insert animation when an approved chore or reward redemption creates a new entry.
  - Acceptance: the newest ledger item is visually highlighted long enough for the user to notice it.
- Add button press feedback for mark done, approve, redeem, export, reset, and print actions.
  - Acceptance: every important click has immediate visual feedback before or during the state update.
- Add lightweight toast notifications for important actions.
  - Acceptance: mark done, approve, redeem, export, and reset actions produce concise feedback that does not block the workflow.

## Phase 3: General UX and Reliability Fixes

- Add undo support for reset and reward redemption through toast actions.
  - Acceptance: users can reverse a recent reset or redemption before the toast expires.
- Guard `localStorage` parsing with a safe fallback to demo state.
  - Acceptance: invalid, missing, or incompatible stored JSON does not crash the app.
- Clean up mojibake and text encoding issues such as stray encoded separator characters.
  - Acceptance: separators and currency text render correctly in the browser and source code.
- Validate reward redemption against the selected kid's available points before updating rewards or ledger entries.
  - Acceptance: users cannot redeem a reward when the relevant kid does not have enough points.
- Make reward redemption kid-aware instead of always assigning redemptions to Ava.
  - Acceptance: reward cost, ledger entry, and printed coupon reflect the chosen kid.
- Add empty states for filtered chore lists and unavailable rewards.
  - Acceptance: filtered views and disabled rewards explain what happened without adding instructional clutter.

## Acceptance Criteria

- Motion supports the app's state changes: reveal, filter, approve, ledger insert, reward redeem, and fairness progress.
- All new motion respects reduced-motion preferences.
- No task in this roadmap is represented as already completed.
- App code remains local-first and does not introduce accounts, a backend, or cloud storage.
- The main user workflows still work: filter chores, mark done, approve, view ledger, redeem rewards, print coupon, export backup, and reset demo data.
- Error handling prevents broken stored data from blocking the app.
- Reward redemption cannot create impossible point balances.

## Test Checklist

- Run `npm run build`.
- Load the app with no stored state and confirm the demo state appears.
- Corrupt the stored `chore-allowance-ledger-state` value and confirm the app recovers to demo state.
- Switch between Everyone, Ava, and Kai and confirm the chore list transitions without layout glitches.
- Mark an approval-required chore as done and confirm the approval queue item appears with feedback.
- Approve a pending chore and confirm the ledger receives a highlighted new row.
- Redeem an affordable reward and confirm stock, ledger, toast, and printable coupon update.
- Attempt to redeem an unaffordable reward and confirm the app blocks it with a clear message.
- Use undo for reset and reward redemption and confirm state returns to the prior value.
- Enable reduced motion at the OS/browser level and confirm animations are minimized.
- Check mobile width around 360px and desktop width around 1440px for text overflow and layout stability.
