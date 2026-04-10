# Track 4 Implementation Plan

## Detection of Digital Threats & Malicious Content

Problem Statement ID: `PS-402`

This document is the implementation roadmap for converting the current Luna / AML Shield codebase into a broader AI-powered digital threat intelligence platform for Track 4: Cybersecurity, Fintech, and Digital Trust.

The plan is intentionally written for an agentic IDE that will "vibe code" large parts of the system. Each phase is designed to be:

- large enough to produce visible progress
- constrained enough to be executable without losing direction
- sequenced so architecture gets cleaner while features expand

This plan assumes the current project context in `files/luna.md` remains the baseline technical reference.

## 1. Product Direction

### 1.1 New product position

The project should evolve from a mostly AML-focused investigation tool into a hybrid AI threat intelligence platform that detects:

- malicious content
- phishing and impersonation attempts
- suspicious URLs and attachments
- misinformation and coordinated harmful campaigns
- digital fraud and financially motivated threat networks

### 1.2 Core idea

The platform should combine:

- investigator AI chat
- multi-format file and content ingestion
- IOC and entity extraction
- graph-based relationship analysis
- explainable risk scoring
- alerting and mitigation workflows
- case-level evidence trails

### 1.3 Non-negotiables

The following current capabilities must remain part of the system:

- the Luna chatbot and conversation workflow
- file ingestion and analyst-style chat analysis
- graph visualization and network investigation
- the current six AML patterns and their ML server flow
- source-backed responses, explainable outputs, and case-style reasoning

The new system should not discard the AML side. Instead, it should reposition it as one module inside a wider digital threat platform.

## 2. Preserve, Repurpose, Remove

### 2.1 Preserve

Keep and repurpose:

- Next.js frontend shell and chat workspace
- streaming chat backend in `luna-chatbot-backend`
- Supabase conversation and message persistence
- graph visualization concepts and Neo4j-based relationship view
- ML server pattern classification pipeline
- structured upload parsing
- charts, Mermaid, and Excalidraw support where useful for analyst workflows

### 2.2 Repurpose

Repurpose the current AML-specific system into:

- a cyber and digital-trust investigator copilot
- a threat graph explorer
- a malicious content and threat scoring platform
- a campaign correlation engine

Repurpose the six AML patterns as the "financial threat monetization" part of the platform.

### 2.3 Remove or isolate

The implementation plan should isolate or de-emphasize:

- unrelated healthcare flows in `luna-aml-web/server`
- hardcoded auth behavior
- split backend assumptions between ports `5001` and `5002`
- purely demo-only logic that blocks credibility, such as random `sus_detection`

## 3. Target Capability Set

The final Track 4 version should support all of the following:

- AI investigator chat for cyber threats, fraud, and malicious content
- upload and analysis of screenshots, PDFs, docs, CSVs, emails, SMS logs, posts, and threat reports
- phishing, smishing, email, social post, and malicious message analysis
- malicious URL, domain, attachment, and file-hash scoring
- IOC extraction for URLs, domains, emails, phone numbers, wallet addresses, bank accounts, usernames, and hashes
- relationship graphing for actors, campaigns, infrastructure, content, and evidence
- real-time alerts and watchlists
- case management, evidence trails, and analyst handoff
- explainable risk scoring with score breakdowns
- campaign clustering and threat fingerprinting
- misinformation and malicious-content identification
- preservation of the six existing AML patterns

## 4. Extraordinary Features Worth Building

These are the standout features that can make the project stronger than a normal hackathon dashboard:

- Screenshot-to-threat analysis: upload a screenshot of an email, SMS, or social post and extract the text, links, brand impersonation signals, CTA pressure, and likely attacker intent.
- Threat DNA clustering: automatically group repeated phishing or misinformation attempts by language style, domain pattern, attachment family, brand target, and message intent.
- Explainable risk cockpit: show the risk score as a breakdown of content risk, infrastructure risk, propagation risk, graph risk, and financial risk.
- Evidence graph with timeline replay: let the analyst see content, sender, links, attachments, repost chains, domain history, and financial traces in one linked investigation timeline.
- Analyst co-pilot with mitigation suggestions: generate recommended actions such as block domain, quarantine attachment, add sender to watchlist, escalate case, or monitor propagation.
- Misinformation claim clustering: extract claims from posts and cluster similar narratives to detect coordinated harmful messaging.
- Multi-module pattern library: retain P1-P6 for AML and add new digital-threat patterns T1-T6.

## 5. Target Architecture

### 5.1 Preferred architecture after cleanup

The cleanest path is:

- `client/`
  - main analyst frontend
- `luna-chatbot-backend/`
  - primary backend for auth, chat, ingestion, analysis, alerts, and graph APIs
- `ml-server/`
  - ML scoring service for threat pattern models
- `server/`
  - either retired, or reduced to transitional compatibility until graph routes are migrated

### 5.2 Key architectural decision

To reduce confusion, the long-term target should be:

- one main Node backend for product logic
- one ML backend for scoring
- one frontend

That means graph APIs should eventually live with the main chatbot backend instead of staying trapped inside the unrelated legacy server.

### 5.3 Threat data model direction

The future unified graph should support entities such as:

- Person
- Account
- EmailAddress
- PhoneNumber
- Username
- Organization
- Brand
- Domain
- URL
- File
- Hash
- IP
- Device
- Wallet
- BankAccount
- Message
- Post
- Attachment
- Campaign
- Case
- Evidence

And relationships such as:

- SENT
- RECEIVED
- LINKS_TO
- HOSTED_ON
- USES
- IMPERSONATES
- MENTIONS
- AMPLIFIES
- TARGETS
- TRANSFERS_TO
- RELATED_TO
- PART_OF_CAMPAIGN
- ATTACHED
- REPORTED_IN
- EVIDENCE_FOR

## 6. Pattern Library Strategy

### 6.1 Preserve current AML patterns

Keep the existing six patterns exactly as a supported module:

- P1 Round Trip
- P2 Loan Evergreening
- P3 Invoice Fraud / TBML
- P4 Hawala Banking
- P5 Benami
- P6 PEP Kickback

### 6.2 Add new digital-threat patterns

Add a second family of threat patterns:

- T1 Brand Impersonation Phishing Campaign
- T2 Malicious URL Redirect / Cloaking Infrastructure
- T3 Malware Attachment Delivery Chain
- T4 Social Engineering Scam and Payout Chain
- T5 Coordinated Misinformation / Inauthentic Amplification
- T6 Account Takeover / Identity Impersonation Spread

### 6.3 Why this matters

This lets the final product say:

- it handles malicious content and digital threats
- it still supports financial threat and laundering pattern detection
- it correlates cyber, content, infrastructure, and financial signals in one platform

## 7. Phase Summary

The implementation roadmap is split into 12 phases:

1. Platform reset and Track 4 pivot
2. Unified threat schema and API contracts
3. Multi-source ingestion workbench
4. IOC, entity, and claim extraction engine
5. Threat scoring engine v1
6. Threat graph and campaign correlation
7. Pattern library expansion and ML evolution
8. AI investigator copilot upgrade
9. Real-time monitoring and alerting
10. Case management and evidence workspace
11. Mitigation actions and trust operations
12. Hardening, evaluation, and final demo polish

## 8. Detailed Phases

## Phase 1: Platform Reset and Track 4 Pivot

### Outcome

Transform the project identity from a narrow AML prototype into a digital-threat platform while preserving the existing AML module.

### Build items

- Rewrite product copy, labels, prompts, navigation, and landing content around digital threats and malicious content.
- Keep AML as a submodule called something like `Financial Threats` or `AML & Illicit Finance`.
- Remove or hide irrelevant healthcare-facing language and routes from the visible app experience.
- Fix the architecture confusion around split URLs so the frontend has an explicit config for:
  - main API
  - ML API
  - graph API
- Document a clear backend ownership model.
- Replace hardcoded or misleading product text in the landing page and chat workspace.

### Primary code surfaces

- `client/src/app/page.tsx`
- landing page components
- `client/src/app/chat/page.jsx`
- `client/src/utils/commonHelper.js`
- chatbot prompts in `luna-chatbot-backend/src/prompts`
- backend README and local setup docs

### Deliverables

- rebranded landing page
- updated chat intro and empty state
- cleaned config naming
- explicit environment template for Track 4 mode
- architecture note in docs

### Acceptance checkpoint

- a first-time user understands this is a digital threat and malicious-content platform
- AML still exists as a supported module
- frontend API wiring is no longer ambiguous

## Phase 2: Unified Threat Schema and API Contracts

### Outcome

Introduce a single threat-centric data model that all services can use.

### Build items

- Define a universal threat analysis schema for messages, URLs, attachments, actors, infrastructure, evidence, and risk scores.
- Define normalized request and response formats for:
  - content analysis
  - URL analysis
  - file analysis
  - campaign correlation
  - alert generation
  - case creation
- Add a threat graph payload format that works the same way the current AML ML graph payload works.
- Create a score object with explainability fields:
  - total score
  - content score
  - infrastructure score
  - propagation score
  - graph score
  - financial score
  - confidence
  - evidence list
- Define a schema version so the agentic IDE can extend it safely.

### Primary code surfaces

- `luna-chatbot-backend/src/types` or `src/schemas`
- `ml-server/api`
- `client/src/utils`
- graph conversion helpers

### Deliverables

- `ThreatAnalysisSchema`
- `ThreatGraphSchema`
- `AlertSchema`
- `CaseSchema`
- a single shared markdown or JSON schema document in the repo

### Acceptance checkpoint

- every new feature can emit a normalized threat object
- frontend rendering can depend on a stable contract
- the ML server and chat backend can exchange threat payloads without custom one-off transforms

## Phase 3: Multi-Source Ingestion Workbench

### Outcome

Expand the current upload workflow into a true malicious-content ingestion surface.

### Build items

- Add dedicated ingestion modes for:
  - email text or `.eml`
  - SMS or chat transcript
  - social post text
  - screenshots and images
  - PDFs and reports
  - URLs
  - domains
  - attachments and files
- Build a unified `Analyze` drawer or form where the analyst chooses input type.
- Add OCR support for screenshots and image-based phishing or scam samples.
- Add drag-and-drop batch upload with per-item status.
- Store normalized ingested artifacts as investigation inputs, not just raw chat attachments.
- Support enrichment tags such as:
  - source platform
  - claimed sender
  - target brand
  - urgency level
  - suspected attack type

### Primary code surfaces

- `client/src/app/chat/page.jsx`
- new frontend analysis pages such as `client/src/app/analyze`
- upload controllers in `luna-chatbot-backend`
- new helpers for OCR and artifact normalization

### Deliverables

- ingestion workbench UI
- OCR pipeline
- normalized artifact storage model
- upload status and processing progress UI

### Acceptance checkpoint

- an analyst can submit text, screenshot, URL, or attachment and get a normalized threat-analysis request object
- the upload flow feels like a threat analyst workspace, not only a generic chat attachment system

## Phase 4: IOC, Entity, and Claim Extraction Engine

### Outcome

Turn every ingested artifact into structured intelligence.

### Build items

- Extract IOCs from text and OCR output:
  - URLs
  - domains
  - emails
  - phone numbers
  - IPs
  - usernames
  - wallet addresses
  - hashes if present
- Extract threat entities:
  - sender
  - target brand
  - victim persona
  - mentioned organization
  - language and tone markers
- Extract malicious-content indicators:
  - urgency
  - fear pressure
  - credential request
  - payment request
  - impersonation
  - deceptive CTA
- Add claim extraction for misinformation analysis:
  - key claim
  - stance
  - amplification hints
  - harmful narrative category
- Build an evidence object for every extracted item with source span references.

### Primary code surfaces

- new backend helpers such as:
  - `iocExtractor.js`
  - `entityExtractor.js`
  - `claimExtractor.js`
  - `threatFeatureBuilder.js`
- frontend evidence renderer

### Deliverables

- structured extraction pipeline
- evidence spans and extraction cards in the UI
- reusable extraction result format for later scoring and graphing

### Acceptance checkpoint

- every analyzed artifact yields structured entities and IOCs
- the frontend can show "what was found" before scoring begins

## Phase 5: Threat Scoring Engine V1

### Outcome

Introduce a hybrid scoring system that feels credible and explainable.

### Build items

- Build a rule and model hybrid scorer for:
  - phishing likelihood
  - impersonation likelihood
  - malicious URL risk
  - suspicious attachment risk
  - scam risk
  - misinformation coordination risk
- Replace purely demo-style random suspicion scoring with real score components.
- Add score breakdown categories:
  - content risk
  - infrastructure risk
  - behavior risk
  - graph risk
  - financial risk
  - overall confidence
- Introduce explainability reasons such as:
  - "domain age is suspicious"
  - "brand impersonation cues detected"
  - "credential collection language present"
  - "same message pattern seen across multiple artifacts"
- Support fallback rules when external APIs or model calls fail.

### Primary code surfaces

- `luna-chatbot-backend/src/helpers`
- new scoring controllers and routes
- frontend score cards and explanation panels

### Deliverables

- threat scoring API
- score breakdown UI
- reusable explanation format

### Acceptance checkpoint

- the platform can score a suspicious email or post with a reasoned breakdown
- scoring is deterministic enough to demo reliably

## Phase 6: Threat Graph and Campaign Correlation

### Outcome

Upgrade the current graph capability into a true campaign intelligence graph.

### Build items

- Expand graph generation to include:
  - content nodes
  - actor nodes
  - brand nodes
  - URL and domain nodes
  - attachment and hash nodes
  - campaign nodes
  - case nodes
- Add campaign clustering logic:
  - shared domain infrastructure
  - shared message templates
  - same target brand
  - repeated CTA language
  - shared attachment fingerprints
- Add graph-driven "related incidents" suggestions.
- Add a timeline view that orders evidence by first seen, linked artifact, analysis step, and escalation.
- Migrate graph APIs out of the unrelated legacy server, or create new parallel graph routes in the main chatbot backend and progressively switch the frontend.

### Primary code surfaces

- graph routes in Node backend
- Neo4j integration
- frontend graph view and new campaign view
- graph converters similar to current AML payload converters

### Deliverables

- threat campaign graph
- related incidents view
- evidence timeline
- migrated or duplicated graph APIs in the main backend

### Acceptance checkpoint

- the app can show a linked network of sender, domain, URL, attachment, brand, and case
- an analyst can move from one alert to a broader campaign view

## Phase 7: Pattern Library Expansion and ML Evolution

### Outcome

Keep the current AML models and add a digital-threat pattern family.

### Build items

- Preserve current P1-P6 workflows exactly.
- Add digital-threat patterns T1-T6:
  - T1 Brand Impersonation Phishing Campaign
  - T2 Malicious URL Redirect / Cloaking Infrastructure
  - T3 Malware Attachment Delivery Chain
  - T4 Social Engineering Scam and Payout Chain
  - T5 Coordinated Misinformation / Inauthentic Amplification
  - T6 Account Takeover / Identity Impersonation Spread
- Create synthetic or semi-structured datasets for T1-T6 similar to the existing AML generators.
- Extend the ML server so it can classify:
  - AML patterns
  - digital threat patterns
  - or hybrid multi-pattern cases
- Add new graph builders for digital-threat entities.
- Expose model metadata and pattern explanations back to the frontend.
- Make the UI clearly show whether the result is:
  - AML pattern
  - digital-threat pattern
  - mixed threat pattern

### Primary code surfaces

- `ml-server/api`
- `ml-server/Data/scripts/data-generation`
- `ml-server/Data/scripts/gnn_trainer.py`
- frontend classification blocks
- backend schema generator prompts

### Deliverables

- expanded pattern router
- T1-T6 dataset generators
- new threat pattern metadata
- updated frontend classification experience

### Acceptance checkpoint

- the ML layer can score both the original six AML patterns and the new digital-threat patterns
- the user can visually inspect the graph behind a digital-threat pattern result

## Phase 8: AI Investigator Copilot Upgrade

### Outcome

Turn the existing Luna chatbot into a specialized digital-threat investigator.

### Build items

- Replace the current system prompt with a multi-domain threat intelligence copilot prompt.
- Keep AML expertise as one section inside the prompt rather than the whole persona.
- Add tool-aware workflows for:
  - IOC extraction
  - URL and file scoring
  - social post analysis
  - campaign correlation
  - misinformation claim analysis
  - mitigation recommendations
- Add a mode selector or auto-routing for:
  - phishing
  - malicious URL
  - malicious file
  - misinformation
  - scam/fraud
  - AML and financial threat
- Add chat-generated outputs:
  - analyst brief
  - executive summary
  - incident report
  - evidence timeline
  - mitigation checklist
  - watchlist recommendation
- Support "why was this flagged?" and "show related threats" follow-ups as first-class queries.

### Primary code surfaces

- chatbot prompts
- chat controller orchestration
- message rendering
- new mode selectors and quick actions in the frontend

### Deliverables

- upgraded threat investigator chat
- domain mode switching
- richer response templates
- incident report generation

### Acceptance checkpoint

- the chatbot feels like a cyber and content-threat copilot, not only an AML assistant
- analysts can drive most workflows from chat without losing structured evidence

## Phase 9: Real-Time Monitoring and Alerting

### Outcome

Move from analyst-on-demand analysis to real-time threat monitoring.

### Build items

- Add a real-time alert pipeline for:
  - newly ingested suspicious content
  - risky URLs or attachments
  - repeat domains or actors
  - campaign amplification spikes
  - high-risk AML or fraud patterns
- Create watchlists for:
  - brands
  - domains
  - senders
  - phone numbers
  - wallets
  - keywords and narratives
- Build an alerts dashboard with:
  - severity
  - confidence
  - source
  - threat family
  - status
  - assigned analyst
- Add real-time frontend updates using SSE or websockets.
- Add alert grouping so duplicate noise does not flood the dashboard.

### Primary code surfaces

- backend alert service
- frontend alerts page
- real-time transport layer
- watchlist data models

### Deliverables

- alerts dashboard
- watchlist UI
- streaming updates
- grouped alerts and severity filters

### Acceptance checkpoint

- the platform can surface a stream of new threats in real time
- repeated threat artifacts are grouped into campaigns or alert clusters

## Phase 10: Case Management and Evidence Workspace

### Outcome

Introduce a full analyst workspace around investigations.

### Build items

- Build case creation from:
  - chat analysis
  - alert
  - manual upload
  - graph selection
- Create case pages with:
  - summary
  - evidence list
  - timeline
  - related entities
  - risk score history
  - analyst notes
  - resolution state
- Let users pin evidence from chat outputs into a case.
- Add downloadable report generation:
  - analyst report
  - executive summary
  - technical IOC report
  - case closure summary
- Add collaboration basics:
  - assignee
  - status
  - priority
  - last updated

### Primary code surfaces

- new frontend routes such as `client/src/app/cases`
- Supabase or DB tables for cases
- backend case controllers and persistence
- chat-to-case actions

### Deliverables

- case dashboard
- case details page
- evidence pinning flow
- exportable reports

### Acceptance checkpoint

- an alert can become a case
- chat findings and graph evidence can be attached to a case
- the platform looks like an investigation system, not just an analysis demo

## Phase 11: Mitigation Actions and Trust Operations

### Outcome

Add proactive mitigation support so the system does more than detect.

### Build items

- Add mitigation recommendations by threat type:
  - block domain
  - quarantine attachment
  - warn user cohort
  - freeze suspicious wallet or payment path
  - escalate to SOC or fraud team
  - monitor for repost amplification
- Add action logging so each mitigation becomes part of the evidence trail.
- Add simulated integration adapters for:
  - email blocklists
  - domain watchlists
  - URL deny lists
  - fraud review queues
  - brand monitoring workflows
- Add a "trust operations" dashboard for:
  - open mitigations
  - watchlist hits
  - mitigation latency
  - false-positive reviews

### Primary code surfaces

- backend mitigation module
- action logging
- frontend mitigation controls
- trust-ops dashboard

### Deliverables

- mitigation recommendation engine
- action history
- trust operations UI
- simulated downstream connectors

### Acceptance checkpoint

- the platform can recommend and record mitigation actions
- each major threat artifact can move from detection to action to resolution

## Phase 12: Hardening, Evaluation, and Final Demo Polish

### Outcome

Make the platform credible, reliable, and demo-ready.

### Build items

- Remove hardcoded auth shortcuts and fix protected-route behavior.
- Standardize backend ownership and port usage.
- Replace demo scoring leftovers with real logic wherever possible.
- Add seed datasets for demo scenarios:
  - phishing
  - malicious URL
  - scam chain
  - misinformation campaign
  - AML and illicit-finance case
- Add evaluation dashboards:
  - precision and recall proxies
  - alert volume
  - case conversion
  - response latency
  - model confidence distribution
- Add polished demo flows:
  - upload suspicious screenshot
  - analyze malicious URL
  - investigate campaign graph
  - escalate to case
  - generate mitigation plan
- Add deployment and environment docs.

### Primary code surfaces

- auth middleware
- env handling
- seeded demo data
- metrics pages
- README and setup docs

### Deliverables

- stable demo environment
- evaluation and quality dashboard
- cleaned setup docs
- final UX polish and bug fixes

### Acceptance checkpoint

- the product can be demoed end to end without explanation-heavy workarounds
- the judges can clearly see detection, analysis, correlation, alerting, and mitigation

## 9. Build Rules for the Agentic IDE

The agentic IDE should follow these rules while implementing the phases:

- Do not delete the current AML module.
- Do not keep the healthcare flows in the visible product path.
- Prefer migrating graph functionality into the main chatbot backend instead of deepening the split architecture.
- Preserve existing conversation and graph concepts wherever possible to save time.
- Build reusable schemas before building many one-off endpoints.
- Each phase should end in a visible product milestone, not only internal refactors.
- Any new scoring logic should return explanations, not only a numeric score.
- Any new alert should be traceable to evidence.
- Any new ML pattern should have a corresponding graph or structured payload shape.
- Prefer hybrid systems over purely LLM-based claims when reliability matters.
- Start with strong deterministic heuristics, then layer model sophistication on top.

## 10. Suggested Directory Additions

Suggested new additions for implementation:

- `client/src/app/analyze`
- `client/src/app/alerts`
- `client/src/app/cases`
- `client/src/app/campaigns`
- `client/src/components/threats`
- `luna-chatbot-backend/src/routes/threatRoutes.js`
- `luna-chatbot-backend/src/routes/alertRoutes.js`
- `luna-chatbot-backend/src/routes/caseRoutes.js`
- `luna-chatbot-backend/src/controllers/threatController.js`
- `luna-chatbot-backend/src/controllers/alertController.js`
- `luna-chatbot-backend/src/controllers/caseController.js`
- `luna-chatbot-backend/src/helpers/iocExtractor.js`
- `luna-chatbot-backend/src/helpers/entityExtractor.js`
- `luna-chatbot-backend/src/helpers/claimExtractor.js`
- `luna-chatbot-backend/src/helpers/urlRisk.js`
- `luna-chatbot-backend/src/helpers/fileRisk.js`
- `luna-chatbot-backend/src/helpers/threatScorer.js`
- `luna-chatbot-backend/src/helpers/campaignClusterer.js`
- `ml-server/api/threat_router.py`
- `ml-server/Data/scripts/data-generation/T1_*.py` through `T6_*.py`

## 11. Demo Storyline to Optimize For

The final judge-facing flow should be easy to narrate:

1. Upload a suspicious email screenshot or SMS.
2. The platform extracts text, links, sender clues, and urgency patterns.
3. It scores the content and flags phishing or malicious intent.
4. It correlates the URL, domain, sender, and brand into a campaign graph.
5. It shows related incidents and live alerts.
6. The analyst opens a case and reviews evidence.
7. The copilot generates a concise report and mitigation checklist.
8. The platform can also pivot into AML and financial threat mode to analyze suspicious monetary flows.

## 12. Final Goal

The final build should feel like a serious hybrid threat intelligence platform rather than a narrowly scoped chatbot. The winning version is not just "AI answers questions." It is:

- a digital-threat detection system
- a malicious-content analysis engine
- a graph-based investigation workspace
- an explainable alerting system
- a mitigation-support platform
- and a financial-threat module powered by the existing six AML patterns

That combination gives the project a stronger story, broader relevance to the Track 4 problem statement, and better differentiation in a judging environment.
