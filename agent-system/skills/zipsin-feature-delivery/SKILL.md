---
name: zipsin-feature-delivery
description: Design and implement an approved ZIPSIN requirement with traceable architecture, privacy-aware access controls, tests, rollback thinking, and an independent QA handoff. Use only when approved requirement IDs and acceptance criteria exist.
---

# ZIPSIN Feature Delivery

## Entry Gate

Require approved requirement IDs, user flows, screen states, and normal/failure/permission acceptance criteria. If these are missing or contradictory, return to product-spec instead of inventing them.

## Workflow

1. Report the implementation sequence and preserve existing work.
2. Build a requirement trace, role/contract-state access matrix, data classification, and concise threat review before editing source.
3. Design data, API, server-side authorization, failure, retry, deduplication, audit, and recovery behavior.
4. For schema or retained-data changes, document backup, compatibility, staged migration, validation, and rollback before mutation. Obtain required approval.
5. Implement only approved scope. Keep contract records, long-term property history, office-internal notes, and personal data separated.
6. Add tests for normal, denied, ended relationship, staff departure, duplicate request, retry, and partial failure cases relevant to the feature.
7. Run and report static checks, types, unit/integration tests, build, and browser validation separately. A successful build is not browser validation.
8. Update requirement-to-code-to-test mapping and affected product, technical, decision, and worklog documents.
9. Hand off changed files, commands, evidence, unverified items, and residual risks to the quality-critic. Do not self-approve.

## Security Invariants

- Enforce access on the server, never only in UI.
- Invitation links must be scoped, expiring, revocable, and resistant to reuse when implemented.
- Revoke staff, office, session, and shared-link access according to the approved lifecycle.
- Filter private fields, attachments, metadata, and prior-contract data before PDF or long-term-history output.
- Never commit live contracts, contact details, account numbers, secrets, or production exports.
