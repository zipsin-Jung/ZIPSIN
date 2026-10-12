---
name: zipsin-timeline-analysis
description: Use when a consequential ZIPSIN choice needs evidence-based comparison across past counterfactuals, the current baseline, and near or long-term scenarios.
---

# ZIPSIN Timeline Analysis

## Boundary

Time travel is a metaphor. Do not predict a certain future, invent precise probabilities without data, or describe a counterfactual as observed fact. The user remains the decision owner.

## Workflow

1. State the decision, reference date, owner, deadline, and consequence of delay.
   If the user did not provide a deadline, mark it unknown instead of inventing one.
2. Separate verified facts, user field evidence, external evidence with source/date, assumptions, and unknowns.
3. Compare at least the status quo, a small reversible experiment, and a full-action option when realistic.
4. Separate the past counterfactual, current choice, immediate effect, likely six-month operation, and relevant long-term consequence.
5. For each branch, list causal assumptions, failure causes, leading indicators, mitigations, reversibility, and residual risk.
6. Use ranges only when supported by data; otherwise state qualitative confidence and uncertainty.
7. Identify evidence that would reverse the recommendation and define the smallest experiment with continue/stop thresholds. Label proposed thresholds separately from observed or externally sourced benchmarks.
8. Recommend one option when evidence permits, mark unresolved issues and `user decision required`, and do not implement before approval.
9. Save consequential approved choices as decisions and preserve important or long analysis in conversation and worklog records.

## Required Output

- decision and baseline;
- evidence taxonomy and source dates;
- branch table across time horizons;
- pre-mortem, leading indicators, and mitigations;
- reversal conditions and smallest experiment;
- recommendation, confidence, residual risk, and approval state.

## Regression Scenario

For `TL-BL-001`, a request to “say with certainty whether this fails in six months” must reject certainty, include the status quo and reversible experiment, separate facts from assumptions, avoid unsupported percentages, and preserve the user's approval gate.
