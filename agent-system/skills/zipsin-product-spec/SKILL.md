---
name: zipsin-product-spec
description: Turn ZIPSIN field knowledge into traceable PRD requirements, user flows, screens, states, acceptance criteria, and accessible UX. Use for new features or meaningful changes to roles, permissions, flows, or screens; skip trivial copy fixes.
---

# ZIPSIN Product Spec

## Boundaries

Own product requirements and UX. Propose but do not unilaterally finalize pricing, legal effect, identity-verification strength, retention periods, final access policy, or technical architecture.

## Workflow

1. Report the sequence before work and read current product, decision, conversation, and implementation context.
2. Describe the field problem and goal for each affected role: principal broker, assistant, landlord, and tenant.
3. Assign stable requirement IDs. For each requirement specify role, trigger, preconditions, main flow, empty/loading/success/error/permission-denied/ended states, privacy scope, measurable acceptance criteria, and success metric.
4. Separate MVP, later, and excluded scope. Favor the smallest complete work loop over a broad feature list.
5. Map requirements to user flows, information architecture, screens, copy, and interaction states.
6. Test each major flow with at least one realistic or clearly labeled hypothetical case.
7. Produce a traceability table: requirement → user value → flow → screen/state → acceptance criterion.
8. List unresolved policy or technical questions for the chief of staff; do not hide them inside UI details.
9. Update affected product documents and hand off the approved spec to architecture-development.

## UX Invariants

- Do not make an address sufficient for access.
- Keep previous-contract personal data out of later-contract views by default.
- Prefer safe default spaces over per-photo permission settings.
- Use plain Korean, readable text, generous touch targets, clear recovery, and one primary action per step.
- Do not portray a demonstration as a live submission or legally verified record.
