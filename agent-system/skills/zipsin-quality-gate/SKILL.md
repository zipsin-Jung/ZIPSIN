---
name: zipsin-quality-gate
description: Independently verify a ZIPSIN feature against PRD, user flows, UI states, permissions, privacy, accessibility, tests, and coverage before user approval. Use when an implementation or UX deliverable is ready for review.
---

# ZIPSIN Quality Gate

## Independence

The reviewer does not silently fix code and approve the same revision. Return defects to architecture-development, then re-test the changed revision. Product, UX, technical, or deployment choices remain with their owners and the user.

## Workflow

1. Report the review sequence. Record version, environment, test data, requirements, acceptance criteria, and known limitations.
2. Check traceability: PRD → flow → screen/state → source → test → evidence.
3. Review static checks, unit and integration results; independently exercise critical end-to-end scenarios.
4. Run negative authorization tests across role, contract, relationship period, staff departure, expired/reused invite, and shared-link cases that apply.
5. Check previous-tenant data, internal notes, contracts, account information, attachment metadata, and PDF export boundaries.
6. Check accessibility, responsive layouts, plain language, recovery from mistakes, empty/loading/error/denied/ended states.
7. Run targeted load or stress checks only for a defined capacity risk and record workload, threshold, and result.
8. Interpret coverage. Lines, statements, functions, and branches must each be at least 80% for the declared measured product-code scope unless the user approved a documented exception. Record include/exclude patterns, skipped/flaky tests, and changed-code coverage. Critical authorization, contract separation, personal-data filtering, and PDF filtering must exercise every defined security path.
9. Verify the bidirectional mapping `REQ/AC → FLOW/SCREEN/STATE → source path:symbol → TEST-ID/test name → command/result`. Missing representative mapping, orphan requirements, or tests without behavior evidence fail the gate.
10. Record each defect with steps, expected/actual, evidence, affected roles, severity P0–P3, owner, and retest status.
11. Return `pass`, `conditional pass`, or `fail`. P0/P1, trace gaps, privacy/security failures, core-flow failures, or missing browser evidence cannot receive conditional pass. A conditional pass may contain only bounded P2 items with owner, workaround, deadline, and limited approval scope. Before user approval, status remains `verified, awaiting approval`.

Do not block on taste differences. Label them recommendations unless they violate an approved requirement or usability/accessibility criterion.
