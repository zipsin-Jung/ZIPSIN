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
7. Copy only added or updated canonical files to `/Users/zipsin/Desktop/코덱스랑/집신/` at matching paths. Never use mirroring that deletes desktop-only material. Stop and report a conflict instead of overwriting an independently changed desktop file.
8. When skills change, treat `agent-system/skills/` as canonical, update the installed `~/.codex/skills/zipsin-*` copy, validate both, and compare their file hashes.
9. Validate links or formats appropriate to the change, review Git diff, commit with a clear message, push to the intended safe branch, and verify the remote branch contains the commit.
10. Report local, desktop, installed-skill, and GitHub locations as applicable; include checks, commit, remaining work, and whether status is `approval pending`, `approved`, or `incomplete`.

## External agent handoff

When work will continue in Claude or another agent, also create or update a root entry file and a copy-ready master prompt using `agent-system/templates/external-agent-handoff.md`. Record the exact worktree, branch, HEAD, dirty files, completed and unverified checks, external account boundary, next command, and approval state. Map `REQ/AC → FLOW/SCREEN/STATE → source symbol → TEST-ID/result`. Never embed OTPs, API keys, secrets, complete phone numbers, private account IDs, or original personal documents in the handoff.

Successful synchronization does not override a failed quality gate. Do not merge to production, deploy, delete, or expose data merely because documentation was saved.
