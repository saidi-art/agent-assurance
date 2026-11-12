# KubeAI Agent Assurance

Public card-verification layer for the A2A ecosystem: back-checks the claims on
agents' A2A cards and attaches human testing validation. The static site at
<https://assurance.kubeai.info> serves the public attestation ledger and the
service's own A2A agent card.

Scope, data contract and milestones: [`docs/SPEC.md`](docs/SPEC.md).

## Repository layout

```
site/                  # static site source (deployed as-is)
  index.html           # home / storefront
  attestations/        # ledger index (+ per-card pages from M2)
  assets/              # css, badge svg, images
  .well-known/         # agent-card.json, served at the domain root
  contact.html
  privacy.html
  llms.txt
  sitemap.xml
  robots.txt
  CNAME                # GitHub Pages custom domain
data/
  attestations.json    # single source of truth for the ledger (supplied by Fo)
docs/
  SPEC.md              # governing spec
.github/workflows/
  deploy.yml           # build + deploy to GitHub Pages
```

## Build and deploy

Every merge to `main` runs `.github/workflows/deploy.yml`:

1. Assemble `dist/` (`site/` + `data/attestations.json`).
2. Keep the assembled output as a retained build artifact (`site-dist`, 90 days).
3. Deploy to GitHub Pages.

### Rollback

Every deploy keeps the previous build artifact, so a rollback is one click:
Actions -> "build-and-deploy" -> "Run workflow" -> enter the run ID of the
last good build in `rollback_run_id` -> Run. The stored artifact from that run
is redeployed without rebuilding.

## DNS setup

The `kubeai.info` zone is managed by the owner, who applies these records.

1. Custom domain CNAME:

   | Type  | Host        | Value                  | TTL |
   |-------|-------------|------------------------|-----|
   | CNAME | `assurance` | `saidi-art.github.io.` | 300 |

   (`assurance` is a subdomain, so a CNAME is correct; the GitHub apex A
   records are not needed here.)

2. GitHub Pages domain verification TXT (proves zone control to GitHub):

   | Type | Host                                            | Value                          | TTL |
   |------|-------------------------------------------------|--------------------------------|-----|
   | TXT  | `_github-pages-challenge-saidi-art.assurance`   | `fa9f2f84851d1a237d08f67d1113d9`    | 300 |

   (Value generated under GitHub Settings -> Pages -> "Add a domain" for
   `assurance.kubeai.info`. After the record propagates, click "Verify" on
   that page: https://github.com/settings/pages_verified_domains/assurance.kubeai.info)

After the records propagate:

- Repo Settings -> Pages shows the custom domain `assurance.kubeai.info`
  (already pinned by `site/CNAME`).
- Tick **Enforce HTTPS** once the certificate is provisioned (spec section 5:
  HTTPS from day one, force redirect).

## Working agreement

- `main` is protected; work lands through feature branches and pull requests,
  one PR per milestone step, titles prefixed with the milestone (`[M1] ...`).
- Conventional commit messages (`feat:`, `fix:`, `chore:`).
- No secrets in the repo; configuration via CI variables only.
- Site copy is supplied with each task - never improvised.
