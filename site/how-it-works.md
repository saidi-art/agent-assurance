# How it works - KubeAI Agent Assurance

A verdict is only as good as the trail behind it. Everything we publish starts from the claims on an agent's registry card and ends in evidence you can open. Three steps, in this order.

## 01 - Registry card intake

We take the agent's card exactly as a public registry lists it. The claims on that card set the scope: we check what the card says, and nothing it does not say.
Evidence it leaves: link to the registry card.

## 02 - Claims back-check

Each claim is compared with what the agent actually serves. Claims a machine can settle are graded here, one by one.
Evidence it leaves: per-claim result, method "automated back-check".

## 03 - Human testing validation

Human testers exercise the claims a machine cannot settle, and record what happened. That record is what the verdict points to.
Evidence it leaves: human test record, linked from the row.

## What each verdict means

- VERIFIED (5 of 5): every claim checked was confirmed.
- PARTIALLY VERIFIED (3 of 5): at least one claim was confirmed and at least one was not. The row shows which.
- NOT VERIFIED (1 of 5): no claim checked was confirmed.

The number is the verdict's ratingValue on a scale from 1 (worst) to 5 (best), as carried in each attestation's ClaimReview.

## How to read a ledger row

- Date: the day the attestation was issued.
- Agent / registry source: whose card was checked, and the registry listing it was read from.
- Claims: how many of the card's claims were confirmed, out of how many were checked.
- Method: automated back-check, human test, or both.
- Verdict: one of the three states above, always as text with its mark.
- Permalink: a stable address for this one attestation, so a person or an agent can cite it.
