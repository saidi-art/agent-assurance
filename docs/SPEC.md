# KubeAI Agent Assurance: development instructions for the build agent

Version 1.0, 2026-11-12. Owner of this spec: Fo (KubeAI). You are the build agent executing it.

## 0. What this project is

KubeAI Agent Assurance is a card-verification layer inside the A2A ecosystem. We back-check the claims on agents' cards as published in A2A registries and attach human testing validation to those claims.

The website at https://assurance.kubeai.info has two jobs:

1. **Public attestation ledger.** Every card we grade produces a dated, public result: the claims checked, what passed, what failed, the evidence. This running scorecard is the company's reputation.
2. **A2A-native storefront.** The site serves our own A2A agent card, which sells the human validation service to agents. Our own card is the first thing our own checker grades (self-certification), so the store proves the product.

Every feature you build traces back to this loop. Nothing outside it gets built.

## 1. Your role and boundaries

You are the execution engineer for the website and its deployment. You build the static frontend, the rendering logic described here, and the deploy pipeline, and you keep production green.

You do not own:

- The checker logic (the engine that grades cards). It lives elsewhere and ships results to you as a JSON file you consume.
- The attestation model: scoring, claim taxonomies, badge criteria.
- Site copy. Copy arrives with the task. Never write or improvise marketing text.
- Registry submissions, outreach, or any contact with third parties. Submitting our card to any registry happens only when Yacine says so; it is not part of any milestone.

When anything in this spec is ambiguous, contradicts what you find live, or needs a decision, stop and send the question back through Yacine. A question costs minutes. A wrong guess costs a rebuild.

## 2. Repository

- Repo: `saidi-art/agent-assurance` (public; created by Yacine).
- Layout:

```
/
  site/                  # static site source
    index.html           # home / storefront
    attestations/        # ledger index + per-card pages (built)
    assets/              # css, badge svg, images
    .well-known/         # agent-card.json (served at the domain root)
    contact.html
    privacy.html
    llms.txt
    sitemap.xml
    robots.txt
  data/
    attestations.json    # single source of truth for the ledger (supplied by Fo)
  docs/
    SPEC.md              # this document
  .github/workflows/     # build + deploy
```

- `main` is protected. Work lands through feature branches and pull requests, one PR per milestone step.
- Conventional commit messages (`feat:`, `fix:`, `chore:`).
- Every PR title references its milestone: `[M2] ...`.

## 3. Data contract (the most important section)

The site renders from structured data. Results are never hardcoded in pages.

`data/attestations.json`, schema version 1:

```json
{
  "schema_version": 1,
  "generated_at": "2026-11-12T21:00:00Z",
  "attestations": [
    {
      "attestation_id": "att-2026-11-12-example-agent",
      "published_at": "2026-11-12T21:00:00Z",
      "source_registry": "a2aregistry.org",
      "agent": {
        "name": "Example Agent",
        "url": "https://example.com/a2a",
        "card_url": "https://example.com/.well-known/agent-card.json",
        "registry_entry_url": "https://a2aregistry.org/agent/...",
        "last_seen": "2026-11-12"
      },
      "summary": {
        "claims_total": 6,
        "claims_pass": 4,
        "claims_fail": 1,
        "claims_unverified": 1,
        "score": 67
      },
      "claims": [
        {
          "id": "c1",
          "claim": "Answers support inquiries within 4 hours",
          "check_type": "behavior",
          "result": "pass",
          "evidence": {
            "type": "screenshot",
            "url": "https://assurance.kubeai.info/evidence/att-...-c1.png",
            "captured_at": "2026-11-12T20:31:00Z"
          },
          "note": "One line of context, no diagnosis."
        }
      ]
    }
  ]
}
```

Rules:

- This file is the single source of truth for the ledger. The build reads it and prerenders `/attestations` and `/attestations/<attestation_id>`.
- Rendering must tolerate missing optional fields without breaking the page.
- Evidence URLs are relative paths into `site/evidence/`; copy evidence files at build time. No client-side fetching of third-party APIs.
- When Fo supplies a new `attestations.json`, a redeploy publishes it. That is the whole update path.

## 4. Site surfaces

### 4.1 Home (storefront)
What KubeAI Agent Assurance is, who it is for (the humans behind A2A-registered agents), the process in three steps (automated attestation, human validation, public badge), and the contact path. No prices anywhere on the site; pricing goes through the contact form.

### 4.2 `/attestations` (the ledger)
A dated list of every graded card: agent name, registry, date, claims pass/fail counts, score, link to the detail page. Sort by date, newest first. This page is the public reputation; treat its correctness as production-critical.

### 4.3 `/attestations/<attestation_id>`
One card's full result: each claim, its result, the evidence, the date. Pass/fail rendered clearly and neutrally; no editorial language about the agent.

### 4.4 Badge
An embeddable SVG badge in `site/assets/badge/`, two sizes, with a copy-paste embed snippet that links to the agent's attestation page. The badge always shows the validation date. Alt text: "Claims human-tested by KubeAI Agent Assurance".

### 4.5 Agent card
`site/.well-known/agent-card.json`, served at `https://assurance.kubeai.info/.well-known/agent-card.json`. A2A v1.0 card: name `KubeAI Agent Assurance`, provider KubeAI (kubeai.info), url `https://assurance.kubeai.info`, two skills: `request-attestation` (free, automated card attestation) and `request-human-validation` (paid, human testing of claims). Final card content is supplied by Fo at M4; scaffold the endpoint at M1 so the URL exists.

### 4.6 `/contact`
A form (Formspree; Yacine creates the form, recipient `quotes@kubeai.info`). Until the form exists, the page shows `quotes@kubeai.info` directly. Fields: name, agent URL, what should be validated. No phone field, no address field.

### 4.7 `/privacy`
Plain-language privacy page: what the site collects (cookieless analytics, aggregate only), what it never collects, how to reach `privacy@kubeai.info`.

## 5. Publication standards (non-negotiable)

- HTTPS from day one, force redirect.
- Privacy-friendly analytics only: Plausible or equivalent, cookieless, aggregate. No cookie banner (none needed), no Google Analytics, no ad pixels, no third-party trackers.
- Pages rendered from structured data (section 3).
- All outbound links UTM-tagged: `utm_source=assurance`, `utm_medium=website`, plus a per-page `utm_campaign`.
- No public prices anywhere.
- System font stack preferred; no third-party font CDNs.
- Semantic HTML, alt text on every image, WCAG AA contrast.
- Provide `llms.txt`, `sitemap.xml`, `robots.txt`.

## 6. Deploy and infrastructure

- Static output, built and deployed by GitHub Actions.
- Target: GitHub Pages first (preferred: no deploy quota). Custom domain `assurance.kubeai.info` with HTTPS. Netlify is the fallback only if Pages cannot serve the custom domain (the Netlify account is on a limited plan).
- DNS: the `kubeai.info` zone is Yacine's. Put the exact records needed (CNAME/A, and the Pages verification TXT) in the repo README under "DNS setup"; he applies them.
- Every deploy must be idempotent and reversible: keep the previous build artifact so a rollback is one click.
- No secrets in the repo. Configuration via CI variables only.

## 7. Milestones

- **M1 repo-live.** Scaffold, deploy pipeline, placeholder home page, and `assurance.kubeai.info` live with HTTPS (DNS applied by Yacine). Done when: the domain serves the placeholder over HTTPS and the pipeline redeploys from a merged PR without manual steps.
- **M2 ledger.** `/attestations` and per-card pages render from the first real `attestations.json` (supplied with the task), badge assets produced. Done when: a data-only change publishes through the pipeline and renders correctly.
- **M3 storefront.** Home and process pages with supplied copy, `/contact` wired to Formspree. Done when: a form submission reaches `quotes@kubeai.info`.
- **M4 card and badge live.** `/.well-known/agent-card.json` serving the supplied final card, badge embed snippet published, self-certification entry visible in the ledger. Done when: the card URL validates as an A2A v1.0 card and the ledger shows our own card graded by our own checker.

## 8. Working agreement

- Ambiguity protocol: stop, write the question, send it back through Yacine, label it `needs-owner` on the GitHub issue. Never improvise.
- No new dependencies without listing them in the PR description with a one-line reason.
- Questions and blockers live in GitHub issues, one issue per question.
- Questions are answered within one working day (CET).
- Scope is this document. Anything that smells like a new product surface is a question, not a build.
