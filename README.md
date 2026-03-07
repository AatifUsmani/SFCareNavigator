# SF Care Navigator

A free, anonymous, multilingual AI healthcare navigator for San Francisco residents — built specifically for uninsured, immigrant, and non-English-speaking communities.

---

## The Problem

San Francisco has some of the best healthcare infrastructure in the world and some of the worst healthcare access. The gap isn't clinical — it's navigational.

- 600,000 Californians are eligible for Medi-Cal but not enrolled, primarily because they don't know they qualify or fear immigration consequences
- 25% of SF's uninsured population is concentrated in the Mission and Excelsior
- Hispanic/Latino uninsured rates run 4x higher than white residents in the Bay Area
- 50% of Mission District residents speak Spanish as a primary language
- SF has a documented shortage of Cantonese and Tagalog-speaking physicians
- An avoidable ER visit costs $800–$1,200 more than the same care at a community health centre

When someone doesn't know the difference between Medi-Cal, Healthy SF, and Emergency Medi-Cal — or when they're scared that seeking care will affect their immigration status — they default to the emergency room. This tool is designed to interrupt that decision at the moment it happens.

---

## What It Does

SF Care Navigator is a conversational AI tool that routes patients to the lowest appropriate level of care, in their language, in under 60 seconds. It does not diagnose. It navigates.

The flow:

1. Patient selects their language
2. A privacy screen explains anonymity and SF's Sanctuary City protections
3. A 5-question screener determines insurance eligibility context
4. An AI chat routes them to a specific named clinic with address, hours, and language support — matched to their neighbourhood and situation

---

## Who It Serves

The tool is designed for four specific gaps in SF's healthcare system:

**Gap 1 — Eligible but not enrolled.** Someone making $18,000/year who qualifies for Medi-Cal but has never applied because nobody explained it to them in Tagalog.

**Gap 2 — Above Medi-Cal, below Covered CA affordability.** Someone making $28,000 who doesn't qualify for Medi-Cal but can't afford Covered CA premiums. Healthy SF and Clinic by the Bay are the bridge — and most people don't know they exist.

**Gap 3 — Immigration fear.** Someone who is eligible for care but avoids it because they've heard seeking government services affects immigration status. SF's Sanctuary City policy means this fear is unfounded — but the fear is real and underdiscussed.

**Gap 4 — Language at point of decision.** The moment someone decides whether to go to the ER or a walk-in clinic happens at home, often without an English speaker present. This tool is in their language at that moment.

---

## Languages

English · Español · 普通话 · 廣東話 · Tagalog · Tiếng Việt · Русский · العربية

Languages are auto-detected from input — if a user switches mid-conversation, the navigator responds in kind.

---

## SF Healthcare Context

**Medi-Cal** — California's Medicaid. Free or near-free for residents under ~$20,600/year. Covers all children under 19 regardless of immigration status. New undocumented adult enrollment frozen January 2026 due to state budget cuts.

**Healthy SF** — City-funded health access program unique to San Francisco. Available to any SF resident 19+, uninsured, income under ~$40k/year, any immigration status. Not insurance — a city program.

**Covered California** — ACA marketplace. For citizens and legal residents. Income-based subsidies available. Enhanced subsidies may expire in 2026.

**Emergency Medi-Cal** — Covers emergency care for literally everyone in California regardless of documentation, income, or any other factor.

**Children's Medi-Cal** — All children under 19 in California qualify regardless of immigration status or income. Unchanged by 2025-26 cuts.

**Clinic by the Bay** — 100% free primary care in the Excelsior for uninsured working adults who don't qualify for any government program. Saturdays and select evenings.

### 2025–26 Alert

Federal HR1 passed in 2025 cut over $1 trillion from Medicaid and Medicare. California simultaneously froze new Medi-Cal enrollment for undocumented adults and added premium requirements. Up to 2 million Californians may lose coverage. This context is built into every interaction.

---

## Clinic Database

15 verified SF clinics and resources across 6 categories, all with real addresses, phone numbers, hours, language support, and insurance coverage noted.

**Emergency** — Zuckerberg SF General (sanctuary city policy, no one turned away), UCSF Medical Center

**Urgent / Primary Care** — Mission Neighborhood Health Center, Tom Waddell Urban Health, Chinatown Public Health Center, Southeast Health Center, RAMS Richmond, Potrero Hill Health Center, North of Market Health Center

**Free Clinics** — Clinic by the Bay (100% free), St. Anthony's Medical Clinic (free walk-in)

**Mental Health** — Instituto Familiar de la Raza, Asian American Recovery Services, SF Crisis Line / 988

**Benefits & Enrollment** — SF Human Services Agency, Covered California Helpline

**Phone / Remote** — 211 SF (24/7, 150+ languages)

---

## Features

**Multilingual chat** — Claude AI responds in the exact language the user writes in, auto-detected from script

**5-question insurance screener** — determines residency, immigration status, income, children under 19, and current coverage before chat begins; passes full context to the AI

**Symptom quick-reply buttons** — tap-to-send for the most common situations so users never have to type if they don't want to

**Live open/closed status** — real-time hours indicator on every clinic card based on current time and day

**My Location / distance sorting** — geolocation sorts the clinic panel by proximity, with km distance shown on each card

**Routing summary card** — auto-generated shareable care recommendation when routing is detected; one tap to copy and send to a family member

**Alerts panel** — current SF and federal healthcare changes with source links

**Programs panel** — personalized insurance eligibility (Medi-Cal, Healthy SF, Covered CA, Emergency Medi-Cal, Children's Medi-Cal, Clinic by the Bay) based on screener answers

**Pin clinics** — bookmark any clinic for quick reference

**Font size A-/A+** — accessibility

**Voice input** — Web Speech API

**Feedback buttons** — thumbs up/down on every AI response

**Demo mode** — automatic fallback to scripted realistic responses if API rate limit is hit; the full flow is always demonstrable

**Anonymous** — zero data storage, nothing persists after the session ends

---

## Technical Stack

- React 18 + Vite
- Claude claude-sonnet-4-20250514 via Anthropic API
- Fraunces (display) + DM Sans (body) — Google Fonts
- No external UI library, no Redux, no routing framework
- Browser-native geolocation + haversine distance formula
- Web Speech API for voice input
- Zero backend — all state in memory

---

## Privacy

This tool collects no personal information. No name, address, location, or identifying data is stored. Nothing persists after the session ends. The only data transmitted is anonymized conversation text to the Anthropic API for response generation.

---

## Limitations

This tool is not a substitute for medical advice. It does not diagnose. For life-threatening emergencies, call 911. Clinic information should be verified before visiting as hours and services may change.

---

*Built as part of a broader project exploring multilingual healthcare navigation for underserved communities in North American cities.*
