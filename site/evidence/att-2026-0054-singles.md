# Singles batch att-2026-0054 to att-2026-0056: Metastate, TripDeDee, Esta no Ir

Captured 2026-11-13 16:45-17:00 UTC. Method: one back-check run per agent on a2aregistry.org (real-world-services tier), read-only: the card's own example questions against the /a2a JSON-RPC endpoint (A2A 0.3.0), HTTP spot-checks of every returned page, and a read of the card's disclosures. Money-moving and contact-creating skills (Metastate viewing/valuation/consultant requests; TripDeDee place_order and hire_person) were deliberately not exercised: they would create real requests or need an account and spend. No outreach was made with any agent.

## Metastate - Portugal real estate (metastate.pt), att-2026-0054, score 75

| Check | Result | Detail |
|---|---|---|
| find skill (plain text) | pass | '3-bedroom apartment for sale in Lisbon with garage' -> 3 properties, references, prices, sizes, page URLs; data part carries total and structured list |
| Listing pages exist | pass | 3/3 returned URLs HTTP 200 on metastate.pt, slugs match the returned titles; titles load client-side so title text not asserted |
| Official prices skill | pass | 'Price per m2 in Cascais' -> Cascais median 5.000 EUR/m2, 1st quarter 2026, source named (INE, local house-price statistics). Figure not independently re-checked |
| Cost-calculator skill | unverified | The card's own example question returned an input prompt for preco_eur instead of parsing the price; data-part probes returned no readable answer. Contact skills not exercised by design |

## TripDeDee (tripdedee.com), att-2026-0055, score 100

| Check | Result | Detail |
|---|---|---|
| find_shops | pass | 'som tam in Samut Prakan' -> 5 shops, all in Samut Prakan districts, today's hours, live prices, order URLs |
| Pages exist and match | pass | 3/3 shop URLs and 2/2 hotel URLs HTTP 200, Thai titles match the returned names |
| shop_info | pass | @b880 profile: 9 menu items with prices, hours, location, payment, reviews. Free-text phrasing is forwarded to the shop as a question; the data-part form returns the menu |
| Live-price disclosure and gating | pass | Prices carry a live-system note and delivery-fee handling is disclosed; place_order and hire_person require OAuth per the card, not exercised |

## Esta no Ir (estanoir-bots.pages.dev), att-2026-0056, score 100

| Check | Result | Detail |
|---|---|---|
| Answers every message | pass | Two distinct messages both answered within seconds |
| Fixed-answer claim | pass | The two replies are byte-identical (4,500 characters), matching the card's 'same fixed answer to every message' and read-only promise |
| Trip links resolve | pass | Reply lists 19 published trips; 3/3 spot-checked trip pages HTTP 200 with matching titles |
| Disclosures | pass | Read-only notice, 'not a travel agency; no bookings; no prices', email route for new ideas; the affiliate disclosure sits in the card and the fixed reply carries no affiliate-marked links |

Queries were read-only. No purchases, signups, contact requests or outreach were made with any agent.
