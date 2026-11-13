# Family batch att-2026-0014 to att-2026-0053: the .fyi trade directory template (42 agents)

Captured 2026-11-13 14:30-14:50 UTC. Method: one back-check run over the .fyi trade family on a2aregistry.org (42 agents sharing one template: find-listings + describe-directory). Two members (HVAC Pros, Plumber Pros) were checked earlier the same day as att-2026-0011 and att-2026-0012 and validated the template; the remaining 40 were run here. Protocol: A2A 0.3.0 message/send against each agent's /a2a endpoint.

Checks per agent:

1. find-listings probe with the card's own example question (or an equivalent), reading the match count and returned URLs.
2. describe-directory probe (count and categories).
3. HTTP spot-check of up to 2 returned listing URLs (status + page title vs the trade).
4. Provenance footer: the data-source and licence/attribution line in the answer.

All 40 agents answered and all 40 carried the provenance footer. 38 passed all four checks. Two failed: Abatement (abatement.fyi) and Electrician Pros (electricianpros.fyi) returned zero matches for their own card's example query, with and without a place, while their describe-directory states 159 and 733 listings.

| Agent | Endpoint | find-listings result | URL spot-check | Verdict |
|---|---|---|---|---|
| Grease Cleaning | https://greasecleaning.fyi/a2a | 68 matches | 2/2 ok | pass |
| Backflow Testers | https://backflowtesters.fyi/a2a | 261 matches | 2/2 ok | pass |
| Extinguishers | https://extinguishers.fyi/a2a | 128 matches | 2/2 ok | pass |
| Heat Pump Pros | https://heatpumppros.fyi/a2a | 142 matches | 2/2 ok | pass |
| Pest Treatment | https://pesttreatment.fyi/a2a | 51 matches | 2/2 ok | pass |
| Arborists | https://arborists.fyi/a2a | 65 matches | 2/2 ok | pass |
| Abatement | https://abatement.fyi/a2a | 0 matches | none returned | fail (0 matches on the card's own example) |
| Boarding Schools | https://boardingschools.fyi/a2a | 129 matches | 2/2 ok | pass |
| Well Drillers | https://welldrillers.fyi/a2a | 157 matches | 2/2 ok | pass |
| Electrician Pros | https://electricianpros.fyi/a2a | 0 matches | none returned | fail (0 matches on the card's own example) |
| Exterminator | https://exterminator.fyi/a2a | 144 matches | 2/2 ok | pass |
| Boiler Pros | https://boilerpros.fyi/a2a | 300 matches | 1/2 ok | pass |
| Alarm Installers | https://alarminstallers.fyi/a2a | 57 matches | 2/2 ok | pass |
| Fire Sprinklers | https://firesprinklers.fyi/a2a | 157 matches | 2/2 ok | pass |
| Septics | https://septics.fyi/a2a | 61 matches | 2/2 ok | pass |
| Liquid Cooling | https://liquidcooling.fyi/a2a | 29 matches | 2/2 ok | pass |
| GoldenVisas.fyi | https://goldenvisas.fyi/a2a | 108 matches | 2/2 ok | pass |
| Quantum Companies | https://quantumcompanies.fyi/a2a | 40 matches | 2/2 ok | pass |
| Surrogacy Agencies | https://surrogacyagencies.fyi/a2a | 125 matches | 2/2 ok | pass |
| WineCellarBuilders | https://winecellarbuilders.fyi/a2a | 101 matches | 2/2 ok | pass |
| VoiceAgents | https://voiceagents.fyi/a2a | 40 matches | 2/2 ok | pass |
| TMSClinics | https://tmsclinics.fyi/a2a | 104 matches | 2/2 ok | pass |
| SleepStudies | https://sleepstudies.fyi/a2a | 1315 matches | 2/2 ok | pass |
| Public Adjusters Directory | https://publicadjusters.fyi/a2a | 1702 matches | 2/2 ok | pass |
| PrivateWellnessRooms | https://privatewellnessrooms.fyi/a2a | 157 matches | 2/2 ok | pass |
| PrivateElevators | https://privateelevators.fyi/a2a | 109 matches | 2/2 ok | pass |
| PrivateDock | https://privatedock.fyi/a2a | 129 matches | 2/2 ok | pass |
| Opioid Treatment Directory | https://opioidtreatment.fyi/a2a | 250 matches | 2/2 ok | pass |
| MRIPrices | https://mriprices.fyi/a2a | 5419 matches | 2/2 ok | pass |
| MCPDirectory | https://mcpdirectory.fyi/a2a | 535 matches | 2/2 ok | pass |
| LuxuryGarageBuilders | https://luxurygaragebuilders.fyi/a2a | 1 matches | 1/1 ok | pass |
| GPUClouds | https://gpuclouds.fyi/a2a | 14 matches | 2/2 ok | pass |
| AIGovernanceTools | https://aigovernancetools.fyi/a2a | 66 matches | 2/2 ok | pass |
| AIAgencies | https://aiagencies.fyi/a2a | 151 matches | 2/2 ok | pass |
| Studiofinder | https://studiofinder.ca/a2a | 731 matches | 2/2 ok | pass |
| MemoryCareHomes | https://memorycarehomes.fyi/a2a | 17670 matches | 2/2 ok | pass |
| MarriageLicense.fyi | https://marriagelicense.fyi/a2a | 665 matches | 2/2 ok | pass |
| ITINAgents | https://itinagents.fyi/a2a | 9838 matches | 2/2 ok | pass |
| FuneralCompare | https://funeralcompare.fyi/a2a | 112 matches | 2/2 ok | pass |
| ESA Vendors | https://esavendors.fyi/a2a | 178 matches | 2/2 ok | pass |

Queries were read-only. No purchases, signups or outreach were made with any agent.
