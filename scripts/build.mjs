#!/usr/bin/env node
/*
 * Build step for assurance.kubeai.info (spec section 3: the build reads
 * data/attestations.json and prerenders /attestations and /attestations/<id>).
 *
 * Usage: node scripts/build.mjs [distDir] [dataFile]
 *   defaults: dist and data/attestations.json, run from the repo root after
 *   `cp -r site/. dist/` so this script only overlays generated content.
 *
 * Pure Node stdlib - no dependencies. Runs on the stock ubuntu-latest runner.
 *
 * Generates/overwrites in dist:
 *   attestations/index.html        ledger rows + ItemList JSON-LD (from template)
 *   index.html                     home "Recent attestations" rows (from template)
 *   attestations/<id>/index.html   one page per attestation, one ClaimReview each
 *   attestations/<id>.json         the attestation record (machine twin)
 *   attestations/<id>.md           markdown twin of the attestation page
 *   badge/<id>.svg, badge/<id>@2x.svg  per-attestation badge, two sizes
 *   attestations.json              root copy of the data file (machine surface)
 *   attestations.md                ledger markdown twin
 *   index.md                       home markdown twin (with recent list)
 *   sitemap.xml                    static pages + attestation permalinks
 *
 * Missing optional fields in the data are tolerated; an empty attestation
 * list renders the labelled empty state and no per-attestation pages.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = process.argv[2] || 'dist';
const DATA = process.argv[3] || 'data/attestations.json';
const ORIGIN = 'https://assurance.kubeai.info';

/* ---------- data ---------- */
const data = JSON.parse(readFileSync(DATA, 'utf8'));
if (data.schema_version !== 1) {
  throw new Error(`attestations.json: unsupported schema_version ${data.schema_version} (expected 1)`);
}
const attestations = (data.attestations || []).slice().sort((a, b) =>
  String(b.published_at || '').localeCompare(String(a.published_at || ''))
);
const lastmod = (data.generated_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10);

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const date = (a) => String(a.published_at || '').slice(0, 10);

const VERDICTS = {
  'verified': { rating: 5, label: 'Verified', css: 'v-ok', text: 'VERIFIED' },
  'partially': { rating: 3, label: 'Partially verified', css: 'v-warn', text: 'PARTIALLY VERIFIED' },
  'not-verified': { rating: 1, label: 'Not verified', css: 'v-bad', text: 'NOT VERIFIED' },
};

function verdictOf(a) {
  const s = a.summary || {};
  const total = s.claims_total ?? (a.claims || []).length;
  const pass = s.claims_pass ?? (a.claims || []).filter(c => c.result === 'pass').length;
  if (total > 0 && pass === total) return 'verified';
  if (pass === 0) return 'not-verified';
  return 'partially';
}

const CHECK_METHODS = { automated: 'Automated back-check', behavior: 'Human test' };
function methodOf(a) {
  const kinds = new Set((a.claims || []).map(c => CHECK_METHODS[c.check_type] || 'Back-check'));
  if (kinds.has('Automated back-check') && kinds.has('Human test')) return 'Back-check + human test';
  return [...kinds][0] || 'Back-check';
}

const claimsStr = (a) => `${a.summary?.claims_pass ?? 0} / ${a.summary?.claims_total ?? (a.claims || []).length}`;

const specimenTag = (a) => a.specimen ? ' <span class="specimen-tag">SPECIMEN</span>' : '';

function registryHref(a, campaign) {
  const u = a.agent?.registry_entry_url;
  if (!u) return null;
  const sep = u.includes('?') ? '&' : '?';
  return `${u}${sep}utm_source=assurance&utm_medium=website&utm_campaign=${campaign}`;
}

function claimReview(a) {
  const v = VERDICTS[verdictOf(a)];
  const claims = (a.claims || []).map(c => c.claim).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'ClaimReview',
    url: `${ORIGIN}/attestations/${a.attestation_id}`,
    datePublished: date(a),
    author: { '@type': 'Organization', name: 'KubeAI Agent Assurance' },
    claimReviewed: claims.join('. ') + (claims.length ? '.' : ''),
    itemReviewed: {
      '@type': 'Claim',
      author: { '@type': 'Organization', name: a.agent?.name || 'unknown' },
      ...(a.agent?.registry_entry_url ? { appearance: a.agent.registry_entry_url } : {}),
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: v.rating,
      worstRating: 1,
      bestRating: 5,
      alternateName: v.label,
    },
  };
}

/* ---------- ledger row (shared by home + ledger page) ---------- */
function ledgerRow(a) {
  const v = VERDICTS[verdictOf(a)];
  const id = esc(a.attestation_id);
  const href = registryHref(a, 'attestations');
  const source = a.specimen
    ? `${esc(a.source_registry || '')} &middot; specimen row`
    : (href ? `<a href="${esc(href)}">${esc(a.source_registry || '')}</a>` : esc(a.source_registry || ''));
  return `    <div role="row" class="lrow body-row" id="${id}" data-verdict="${verdictOf(a)}" data-search="${esc((a.agent?.name || '') + ' ' + (a.source_registry || '')).toLowerCase()}">
      <span role="cell" class="c-date">${esc(date(a))}</span>
      <span role="cell" class="c-agent"><span class="name">${esc(a.agent?.name || 'unknown')}${specimenTag(a)}</span><span class="source">${source}</span></span>
      <span role="cell" class="c-claims">${esc(claimsStr(a))}<span class="m-only"> claims</span></span>
      <span role="cell" class="c-method">${esc(methodOf(a))}</span>
      <span role="cell" class="c-verdict verdict ${v.css}"><span class="dot" aria-hidden="true"></span>${v.text}</span>
      <a role="cell" class="c-link" href="/attestations/${id}/">#${id}</a>
    </div>`;
}

const EMPTY_ROWS = `    <div class="lrow body-row" style="display: block; padding: 32px 20px;">
      <p class="body-copy" style="margin: 0;">No attestations published yet. First results are published here as cards are graded.</p>
    </div>`;

/* ---------- badge SVG (two sizes) ---------- */
function badgeSvg(a, scale = 1) {
  const v = VERDICTS[verdictOf(a)];
  const fs = 12 * scale;
  const adv = 0.6 * fs;           // IBM Plex Mono advance width
  const pad = 10 * scale;
  const h = 30 * scale;
  const left = 'Attested by KubeAI';
  const right = `${v.text} · ${date(a)}`;
  const lw = Math.ceil(left.length * adv + 2 * pad);
  const rw = Math.ceil(right.length * adv + 2 * pad);
  const rightColor = { 'v-ok': '#0B7A75', 'v-warn': '#8A5A00', 'v-bad': '#A6321F' }[v.css];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lw + rw}" height="${h}" viewBox="0 0 ${lw + rw} ${h}" role="img" aria-label="Claims human-tested by KubeAI Agent Assurance: ${v.label}, ${date(a)}">
  <rect width="${lw}" height="${h}" rx="3" fill="#0F1B2A"/>
  <rect x="${lw}" width="${rw}" height="${h}" rx="3" fill="#FFFFFF"/>
  <rect x="${lw}" width="1" height="${h}" fill="#0F1B2A"/>
  <rect x="${lw}" width="${rw}" height="${h}" fill="none" stroke="#0F1B2A"/>
  <text x="${pad}" y="${h / 2 + fs * 0.36}" font-family="'IBM Plex Mono', ui-monospace, monospace" font-size="${fs}" fill="#F3F5F7">${esc(left)}</text>
  <text x="${lw + pad}" y="${h / 2 + fs * 0.36}" font-family="'IBM Plex Mono', ui-monospace, monospace" font-size="${fs}" font-weight="500" fill="${rightColor}">${esc(right)}</text>
</svg>
`;
}

/* ---------- page chrome (keep in sync with the static pages) ---------- */
const NAV = [
  ['/attestations/', 'Attestations'],
  ['/how-it-works.html', 'How it works'],
  ['/services.html', 'Services'],
  ['/contact.html', 'Contact'],
];

function header(current) {
  const links = NAV.map(([href, label]) =>
    `      <a href="${href}"${href === current ? ' aria-current="page"' : ''}>${label}</a>`).join('\n');
  return `<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">KubeAI Agent Assurance</a>
    <button class="menu-button" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="primary-nav">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h14M3 10h14M3 14h14"></path></svg>
    </button>
    <nav class="primary-nav" id="primary-nav" aria-label="Primary">
${links}
    </nav>
  </div>
</header>`;
}

function footer(mdPath) {
  return `<footer class="site-footer">
  <div class="wrap">
    <span>No cookies. No trackers. No accounts.</span>
    <span class="links">
      <a href="mailto:quotes@kubeai.info">quotes@kubeai.info</a>
      <a href="/privacy.html">Privacy</a>
      <a href="${mdPath}">This page as markdown</a>
    </span>
  </div>
</footer>`;
}

function headTags(title, description, extra = '') {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="stylesheet" href="/assets/css/site.css">
<script src="/assets/js/nav.js" defer></script>
<!-- Analytics placeholder: Plausible (cookieless, aggregate only), per spec section 5.
     Uncomment once the Plausible site for assurance.kubeai.info is created by the owner.
<script defer data-domain="assurance.kubeai.info" src="https://plausible.io/js/script.js"></script>
-->
${extra}`;
}

/* ---------- single attestation page ---------- */
function attestationPage(a) {
  const v = VERDICTS[verdictOf(a)];
  const id = a.attestation_id;
  const cr = claimReview(a);
  const href = registryHref(a, 'attestation');
  const claims = a.claims || [];

  const claimRows = claims.map((c, i) => {
    const cv = c.result === 'pass' ? VERDICTS['verified'] : VERDICTS['not-verified'];
    const resultText = c.result === 'pass' ? 'VERIFIED' : 'NOT VERIFIED';
    const ev = c.evidence || {};
    const evLabel = esc(ev.type || 'evidence');
    const evHtml = ev.url
      ? `<a class="evidence" href="/${esc(ev.url)}">${evLabel}</a>`
      : `<span class="evidence">${evLabel}</span>`;
    return `      <div class="claim-row">
        <span class="n">${String(i + 1).padStart(2, '0')}</span>
        <span>${esc(c.claim || '')}${c.note ? ` <span class="fine">${esc(c.note)}</span>` : ''}</span>
        <span class="verdict ${cv.css}" style="font-size: 13px;"><span class="dot" aria-hidden="true"></span>${resultText}</span>
        ${evHtml}
      </div>`;
  }).join('\n');

  const badgePreview = `<div class="badge-preview" aria-hidden="true">
      <span class="left">Attested by KubeAI</span>
      <span class="right ${v.css}">${v.text} &middot; ${esc(date(a))}</span>
    </div>`;

  /* Addendum fix 2: the snippet escapes the ampersand once (&amp; in HTML
     source, & when copied), so the pasted href is valid. */
  const snippetText = `<a href="${ORIGIN}/attestations/${id}?utm_source=assurance&utm_medium=badge">
  <img src="${ORIGIN}/badge/${id}.svg"
       alt="Claims human-tested by KubeAI Agent Assurance">
</a>`;

  const crAbridged = `"@context": "https://schema.org",
"@type": "ClaimReview",
"url": "${ORIGIN}/attestations/${id}",
"datePublished": "${date(a)}",
"author": { "@type": "Organization", "name": "KubeAI Agent Assurance" },
"claimReviewed": ${JSON.stringify(cr.claimReviewed)},
"itemReviewed": {
  "@type": "Claim",
  "author": { "@type": "Organization", "name": ${JSON.stringify(cr.itemReviewed.author.name)} },
  "appearance": ${JSON.stringify(cr.itemReviewed.appearance || '')}
},
"reviewRating": {
  "@type": "Rating",
  "ratingValue": ${v.rating},
  "worstRating": 1,
  "bestRating": 5,
  "alternateName": "${v.label}"
}`;

  return `<!doctype html>
<html lang="en">
<head>
${headTags(
    `${a.agent?.name || id} - Attestation ${id} - KubeAI Agent Assurance`,
    `Attestation ${id}: ${a.agent?.name || 'agent'}, ${v.label}, issued ${date(a)}. Each claim, its result and its evidence.`,
    `<script type="application/ld+json">${JSON.stringify(cr, null, 2)}</script>`)}
</head>
<body>

${header('/attestations/')}

<main class="page-main" style="padding-top: 40px; gap: 32px;">

<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="/attestations/">attestations</a><span aria-hidden="true">/</span><span>${esc(id)}</span>
</nav>

<article class="certificate">
  <div class="cert-head">
    <div class="cert-title">
      <div class="cert-kicker">ATTESTATION${a.specimen ? ' &middot; <span class="specimen-tag">SPECIMEN</span>' : ''}</div>
      <h1>${esc(a.agent?.name || 'unknown')}</h1>
    </div>
    <span class="verdict large ${v.css}"><span class="dot" aria-hidden="true"></span>${v.text}</span>
  </div>

  <dl class="cert-meta">
    <div><dt>ISSUED</dt><dd>${esc(date(a))}</dd></div>
    <div><dt>REGISTRY SOURCE</dt><dd>${href ? `<a href="${esc(href)}">${esc(a.source_registry || '')}</a>` : esc(a.source_registry || '')}</dd></div>
    <div><dt>METHOD</dt><dd class="plain">${esc(methodOf(a))}</dd></div>
    <div><dt>CLAIMS VERIFIED</dt><dd>${esc(claimsStr(a))}</dd></div>
  </dl>

  <div class="cert-claims">
    <h2>CLAIMS ON THE CARD, AS CHECKED</h2>
    <div style="display: flex; flex-direction: column;">
${claimRows}
    </div>
  </div>
</article>
${a.specimen ? `<p class="fine">This attestation is specimen data, invented to prove the pipeline. It is not a real check of a real agent, and it is replaced when real checker output lands.</p>` : ''}

<div class="att-panels">

  <section class="panel">
    <h2>Embed this verdict</h2>
    <p class="desc">For the agent owner's own card page. The mark links back to this attestation and reads its state from the JSON endpoint.</p>
    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
${badgePreview}
    </div>
    <pre class="snippet" id="badge-snippet">${esc(snippetText)}</pre>
    <button type="button" class="copy-btn" id="copy-snippet">Copy snippet</button>
    <script>
    (function () {
      var btn = document.getElementById('copy-snippet');
      var pre = document.getElementById('badge-snippet');
      if (!btn || !pre || !navigator.clipboard) return;
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(pre.textContent).then(function () {
          btn.textContent = 'Copied';
          setTimeout(function () { btn.textContent = 'Copy snippet'; }, 2000);
        });
      });
    })();
    </script>
  </section>

  <section class="panel">
    <h2>Read it your way</h2>
    <div class="twin-links">
      <a href="/attestations/${esc(id)}.json">/attestations/${esc(id)}.json</a>
      <a href="/attestations/${esc(id)}.md">/attestations/${esc(id)}.md</a>
      <a href="/attestations/#${esc(id)}">/attestations#${esc(id)}</a>
    </div>
    <div class="integrity">
      <h2 style="margin: 8px 0 0;">Integrity</h2>
      <dl>
        <div><dt>CONTENT HASH</dt><dd>Reserved: not issued in v1</dd></div>
        <div><dt>SIGNATURE</dt><dd>Reserved: not issued in v1</dd></div>
      </dl>
    </div>
  </section>
</div>

<section class="structured">
  <h2>Structured data on this page</h2>
  <p>One ClaimReview, and only one, per attestation page. Its values come from the same record as everything above. The numeric scale is 1 Not verified, 3 Partially verified, 5 Verified.</p>
  <pre class="code">${esc(crAbridged)}</pre>
</section>

</main>

${footer(`/attestations/${id}.md`)}

</body>
</html>
`;
}

/* ---------- markdown twins ---------- */
function attestationMd(a) {
  const v = VERDICTS[verdictOf(a)];
  const lines = [
    `# Attestation ${a.attestation_id}: ${a.agent?.name || 'unknown'}`,
    '',
    `- Verdict: **${v.label}** (${v.text})`,
    `- Issued: ${date(a)}`,
    `- Registry source: ${a.source_registry || 'unknown'}${a.agent?.registry_entry_url ? ` (${a.agent.registry_entry_url})` : ''}`,
    `- Method: ${methodOf(a)}`,
    `- Claims verified: ${claimsStr(a)}`,
    `- Specimen: ${a.specimen ? 'yes - invented data, not a real check' : 'no'}`,
    '',
    '## Claims',
    '',
    '| # | Claim | Result | Evidence |',
    '| --- | --- | --- | --- |',
    ...(a.claims || []).map((c, i) =>
      `| ${i + 1} | ${c.claim || ''} | ${c.result === 'pass' ? 'Verified' : 'Not verified'} | ${c.evidence?.type || ''}${c.evidence?.url ? ` (${ORIGIN}/${c.evidence.url})` : ''} |`),
    '',
    '## Badge',
    '',
    '```html',
    `<a href="${ORIGIN}/attestations/${a.attestation_id}?utm_source=assurance&utm_medium=badge">`,
    `  <img src="${ORIGIN}/badge/${a.attestation_id}.svg"`,
    `       alt="Claims human-tested by KubeAI Agent Assurance">`,
    '</a>',
    '```',
    '',
    `Permalink: ${ORIGIN}/attestations/${a.attestation_id}/`,
    '',
  ];
  return lines.join('\n');
}

function ledgerMd() {
  const lines = [
    '# Attestation ledger - KubeAI Agent Assurance',
    '',
    'Every graded agent-card result, dated and traceable. Not verified results are published, always.',
    '',
    '| Date | Agent | Registry source | Claims | Method | Verdict | Permalink |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...attestations.map(a =>
      `| ${date(a)} | ${a.agent?.name || 'unknown'}${a.specimen ? ' (SPECIMEN)' : ''} | ${a.source_registry || ''} | ${claimsStr(a)} | ${methodOf(a)} | ${VERDICTS[verdictOf(a)].label} | ${ORIGIN}/attestations/${a.attestation_id}/ |`),
    '',
  ];
  if (!attestations.length) {
    lines.push('No attestations published yet. First results are published here as cards are graded.', '');
  }
  return lines.join('\n');
}

function indexMd() {
  const recent = attestations.slice(0, 4);
  const lines = [
    '# KubeAI Agent Assurance',
    '',
    'We check what agent cards claim. Then humans test it.',
    '',
    "KubeAI back-checks the claims on agents' cards as listed in public registries, and validates them with human testing. Every result is dated, published and traceable to its evidence.",
    '',
    `- Attestation ledger: ${ORIGIN}/attestations/`,
    `- How it works: ${ORIGIN}/how-it-works.html`,
    `- Services: ${ORIGIN}/services.html`,
    `- Contact: quotes@kubeai.info (${ORIGIN}/contact.html)`,
    `- Agent card: ${ORIGIN}/.well-known/agent-card.json`,
    '',
    '## Recent attestations',
    '',
    ...(recent.length
      ? recent.map(a => `- ${date(a)} - ${a.agent?.name || 'unknown'}${a.specimen ? ' (SPECIMEN)' : ''}: ${VERDICTS[verdictOf(a)].label} (${claimsStr(a)} claims) - ${ORIGIN}/attestations/${a.attestation_id}/`)
      : ['No attestations published yet. First results are published as cards are graded.']),
    '',
  ];
  return lines.join('\n');
}

/* ---------- sitemap ---------- */
function sitemap() {
  const staticUrls = ['/', '/attestations/', '/how-it-works.html', '/services.html', '/contact.html', '/privacy.html'];
  const urls = [
    ...staticUrls.map(u => `  <url><loc>${ORIGIN}${u}</loc><lastmod>${lastmod}</lastmod></url>`),
    ...attestations.map(a => `  <url><loc>${ORIGIN}/attestations/${a.attestation_id}/</loc><lastmod>${date(a) || lastmod}</lastmod></url>`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

/* ---------- run ---------- */
function inject(file, marker, content) {
  const path = join(DIST, file);
  const src = readFileSync(path, 'utf8');
  if (!src.includes(marker)) throw new Error(`${file}: build marker ${marker} not found`);
  writeFileSync(path, src.replace(marker, content));
}

/* ledger page */
const rows = attestations.map(ledgerRow).join('\n') || EMPTY_ROWS;
inject('attestations/index.html', '<!--BUILD:LEDGER_ROWS-->', rows);
const itemList = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: attestations.map((a, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${ORIGIN}/attestations/${a.attestation_id}/`,
    name: `${a.agent?.name || a.attestation_id}: ${VERDICTS[verdictOf(a)].label}`,
  })),
};
inject('attestations/index.html', '<!--BUILD:LEDGER_JSONLD-->',
  attestations.length ? `<script type="application/ld+json">${JSON.stringify(itemList, null, 2)}</script>` : '');

/* home recent rows (4 newest) */
const recent = attestations.slice(0, 4).map(ledgerRow).join('\n') || EMPTY_ROWS;
inject('index.html', '<!--BUILD:RECENT_ROWS-->', recent);

/* per-attestation outputs */
for (const a of attestations) {
  const id = a.attestation_id;
  mkdirSync(join(DIST, 'attestations', id), { recursive: true });
  writeFileSync(join(DIST, 'attestations', id, 'index.html'), attestationPage(a));
  writeFileSync(join(DIST, 'attestations', `${id}.json`), JSON.stringify(a, null, 2) + '\n');
  writeFileSync(join(DIST, 'attestations', `${id}.md`), attestationMd(a));
  mkdirSync(join(DIST, 'badge'), { recursive: true });
  writeFileSync(join(DIST, 'badge', `${id}.svg`), badgeSvg(a, 1));
  writeFileSync(join(DIST, 'badge', `${id}@2x.svg`), badgeSvg(a, 2));
}

/* machine surface */
writeFileSync(join(DIST, 'attestations.json'), JSON.stringify(data, null, 2) + '\n');
writeFileSync(join(DIST, 'attestations.md'), ledgerMd());
writeFileSync(join(DIST, 'index.md'), indexMd());
writeFileSync(join(DIST, 'sitemap.xml'), sitemap());

console.log(`build: ${attestations.length} attestation(s) rendered from ${DATA}`);
