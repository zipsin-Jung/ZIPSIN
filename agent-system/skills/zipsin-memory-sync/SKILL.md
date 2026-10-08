---
name: zipsin-memory-sync
description: Preserve a completed ZIPSIN work phase by updating product documents, decisions, long conversations, worklogs, the desktop document library, and GitHub without exposing sensitive data. Use after substantive requirements, decisions, design, code, or test work.
---

# ZIPSIN Memory Sync

## Workflow

1. Confirm the user received the work sequence before execution. Record any deviation.
2. Update the canonical repository documents affected by the work. Keep facts, assumptions, decisions, and unresolved items distinct.
3. Add a decision record for consequential choices; never erase the prior decision history.
4. Save a structured conversation record when product discussion exceeds roughly one page or contains important new reasoning. Exclude repetition and sensitive data without changing meaning.
5. Write a worklog with request, plan, actions, checks, result, remaining work, commit, and approval state.
6. Scan pending changes for secrets, live personal data, account numbers, original contracts, temporary output, and unrelated user changes.
7. Mirror the canonical `docs/` structure to `/Users/zipsin/Desktop/코덱스랑/집신/docs/` and verify the two trees match. Preserve the desktop index.
8. Validate links or formats appropriate to the change, review Git diff, commit with a clear message, and push to the intended safe branch.
9. Report local and GitHub locations, checks, commit, remaining work, and whether status is `approval pending`, `approved`, or `incomplete`.

Successful synchronization does not override a failed quality gate. Do not merge to production, deploy, delete, or expose data merely because documentation was saved.
