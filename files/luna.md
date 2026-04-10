# Luna Project Context

Last updated: 2026-04-10

This document is a code-derived context file for the Luna repository.

It is meant to help an agentic IDE understand what this project is, how the major services fit together, how the AML chatbot works, how the six suspicious transaction patterns are modeled, and where the important integration quirks are.

This document describes what the code currently does, not what the names or comments imply it should do.

## 1. What This Project Is

Luna is an AML-focused investigation product with three main technical pieces:

1. A Next.js frontend that presents:
   - a marketing and landing page
   - a chat console for AML analysis
   - a graph exploration page
   - login and signup flows
2. A Node/Express "Luna chatbot backend" that:
   - manages users and conversations
   - streams Gemini responses over SSE
   - enriches responses with web search, image search, YouTube, social profile search, charts, Mermaid, and Excalidraw
   - converts natural-language AML scenarios into graph-style ML payloads
3. A Python FastAPI ML server that:
   - accepts AML pattern payloads
   - scores them against six trained graph models (P1 to P6)
   - returns the best-matching typology and per-pattern scores



## 2. Repo Layout

Top-level structure:

```text
Luna/
  files/
    luna.md
  luna-aml-web/
    client/                    Next.js frontend
    luna-chatbot-backend/      Main AML chatbot backend
    server/                    Mixed legacy backend; includes Neo4j graph APIs
  ml-server/                   FastAPI + PyTorch Geometric AML classifier
```

Key runtime defaults from code:

- Frontend: `http://localhost:3000`
- Luna chatbot backend: `http://localhost:5001`
- Graph / legacy server: `http://localhost:5002`
- ML classifier server: `http://localhost:8000`

## 3. High-Level Architecture

### 3.1 Main user-facing flow

The intended product flow is:

1. User opens the frontend.
2. User chats with the AML assistant.
3. The chat backend streams a response from Gemini.
4. In parallel, the backend may:
   - search the web
   - search for social profiles
   - search YouTube
   - generate an AML ML schema via Groq
5. The frontend receives:
   - plain text answer chunks
   - links and sources
   - optional social profiles
   - optional YouTube results
   - optional charts
   - optional Mermaid blocks
   - optional Excalidraw diagrams
   - optional ML graph payload
6. If an ML payload is emitted, the frontend sends it to the Python ML server for classification.
7. The frontend renders:
   - the explanation from Gemini
   - a graph visualization for the ML payload
   - a classification block showing the best typology and all six pattern scores

### 3.2 Service responsibilities

`luna-aml-web/client`
- UI only
- calls backend APIs directly from the browser

`luna-aml-web/luna-chatbot-backend`
- the main AML product backend
- chat, auth, conversations, feedback, charts, uploads, YouTube, social search

`ml-server`
- pattern classification only
- no chat, no auth, no persistence

`luna-aml-web/server`
- mostly unrelated healthcare backend
- does provide the Neo4j graph endpoints consumed by the AML frontend

## 4. Frontend: What the Web App Contains

Frontend stack from `luna-aml-web/client/package.json`:

- Next.js 15
- React 19
- Tailwind CSS 4
- D3
- Mermaid
- Excalidraw
- Framer Motion
- Radix UI components

### 4.1 Frontend routing

Important pages:

- `src/app/page.tsx`
  - landing page
- `src/app/chat/page.jsx`
  - main AML chat console
- `src/app/graph/page.jsx`
  - graph viewer page
- `src/app/login/page.tsx`
  - login page
- `src/app/signup/page.tsx`
  - signup page

### 4.2 Frontend backend URLs

Defined in `src/utils/commonHelper.js`:

```js
export const SERVER_URL = process.env.NEXT_PUBLIC_GRAPH_API_URL || "http://localhost:5002";
export const SERVER_URL_1 = process.env.LUNA_API_URL || process.env.NEXT_PUBLIC_LUNA_API_URL || "http://localhost:5001";
```

Meaning:

- `SERVER_URL_1` is the Luna chatbot backend
- `SERVER_URL` is the graph and legacy backend

This split is critical because the frontend does not consistently call the same backend for all features.

### 4.3 Landing page

The landing page composes:

- navbar
- hero section
- problem section
- features section
- how-it-works section
- demo preview
- stats
- footer

Product intent from the landing page is AML, investigation, and compliance analysis.

Important note:

- `FeaturesSection.jsx` appears inconsistent with the rest of the AML product and looks copied from a different "career" or "future-planning" style app.
- Future agents should not assume every landing-page component reflects the AML domain accurately.

### 4.4 Chat page behavior

The main chat page is in `src/app/chat/page.jsx`.

It calls:

- chat stream: `${SERVER_URL_1}/api/chat/stream`
- conversations: `${SERVER_URL_1}/api/chat/conversations`
- charts: `${SERVER_URL}/api/gemini/charts`
- ML classify: `http://localhost:8000/classify`

The chat page supports:

- live SSE streaming of assistant text
- file attachments
- conversation history
- message deletion
- YouTube search toggle
- image search toggle
- feedback dialog
- TTS playback
- suggestion dropdown

### 4.5 What the frontend can render inside a response

`src/components/ui/chat-message.tsx` shows that assistant messages can include:

- markdown text
- source links
- image cards
- YouTube result cards
- social profile cards
- chart images with download and expand actions
- Excalidraw diagrams
- Mermaid content
- ML graph visualizations
- ML classification results
- code blocks
- code execution output

This means Luna is not only a text chatbot. It is effectively a multimodal investigation console.

### 4.6 ML graph rendering in the frontend

If the backend emits an `mlSchema` SSE event, the frontend stores:

- `mlPayload`
- `mlPattern`
- `mlSampleId`

Then it sends the payload to the ML server and renders:

1. a graph with `MlPayloadGraphViewer`
2. a classification panel with best pattern and all six scores

The graph renderer supports:

- universal graph payloads with `nodes` and `edges`
- pattern-specific payloads for P1 to P6

### 4.7 Graph page

The graph page uses the Neo4j-backed APIs from `luna-aml-web/server`:

- `GET /api/graph`
- `POST /api/graph/search`
- `GET /api/graph/stream`

It uses D3 force simulation and supports:

- full graph load
- search with one-hop neighbor expansion
- SSE graph loading status

### 4.8 Frontend auth

The auth context stores the user and token in local storage.

Important mismatch:

- auth calls use `SERVER_URL`, not `SERVER_URL_1`
- default `SERVER_URL` points to `http://localhost:5002`

So by default:

- login and signup are aimed at the graph and legacy backend, not the chatbot backend on `5001`

This is one of the most important cross-service inconsistencies in the repo.

## 5. Luna Chatbot Backend

Main service path:

`luna-aml-web/luna-chatbot-backend`

Stack:

- Node.js
- Express
- Supabase
- Gemini
- Groq
- Google Custom Search
- YouTube Data API
- QuickChart

Main entrypoints:

- `src/server.js`
- `src/app.js`

### 5.1 Major routes mounted by the AML backend

The backend mounts routes under:

- `/api/gemini`
- `/api/users`
- `/api`
- `/api/youtube`
- `/api/chat`
- `/api/feedback`
- `/api/proxy`
- `/api/medicine`

Important practical routes:

- `POST /api/chat`
- `POST /api/chat/stream`
- `POST /api/chat/ml-generate`
- `POST /api/chat/classify`
- `GET /api/chat/conversations`
- `GET /api/chat/conversations/:conversationId`
- `DELETE /api/chat/conversations/:conversationId`
- `POST /api/gemini/charts`

### 5.2 Persistence model

The backend uses Supabase tables inferred from controllers:

- `users`
- `conversations`
- `messages`
- `feedback`

Message records may store:

- text content
- sources
- images
- videos
- charts
- excalidraw payloads

### 5.3 AML assistant identity and purpose

The main system prompt is in `src/prompts/FinancialAI.js`.

The assistant is explicitly positioned as:

- "FinGraph AI"
- an AML and OSINT assistant
- a tool for investigators and compliance teams

The prompt tells the model to reason over:

- transaction data
- `sus_detection` scores
- corporate registry data
- beneficial ownership
- PEP and sanctions context
- web and social media intelligence

It also instructs the model to:

- avoid definitive accusations
- cite public sources
- identify circular flows, layering, shell indicators, and mismatched lifestyles

### 5.4 Main chat flow without streaming

`handleChatGenerate` does this:

1. Validates prompt.
2. Reads user info from Supabase.
3. Creates a new conversation if needed.
4. Loads last 10 messages for context.
5. Reads uploads.
6. If uploads contain spreadsheet-like files:
   - parse rows
   - normalize rows with Featherless
   - add random `sus_detection` scores
   - append structured transaction JSON to the prompt
7. Calls Gemini.
8. Optionally runs image search.
9. Optionally runs social search.
10. Saves user and model messages to Supabase.

### 5.5 Main chat flow with streaming

`handleChatStreamGenerate` is the most important path in the product.

It does the following:

1. Accepts prompt, optional conversation ID, optional files, and options.
2. Looks up the user and conversation.
3. Loads prior messages unless history should be reset because files were uploaded.
4. Extracts upload text and upload images.
5. If spreadsheet files are present:
   - parses spreadsheet rows
   - normalizes rows using Featherless
   - adds random `sus_detection` scores
   - sends the structured transaction payload back to the client as a `transactions` SSE event
6. Builds the Gemini request body.
7. Starts parallel tasks:
   - image search
   - YouTube search
   - ML schema generation via Groq
8. Immediately emits `conversationId`.
9. Emits `mlSchema` if Groq returns a valid AML schema.
10. Streams Gemini output chunks.
11. Converts Gemini outputs into SSE events:
   - `message`
   - `code`
   - `codeResult`
   - `excalidraw`
   - `finish`
12. After Gemini completes:
   - processes Mermaid blocks
   - emits `mermaid`
   - emits `socials`
   - resolves source URLs to titles
   - emits `sources`
13. Saves the final assistant message to Supabase.

### 5.6 SSE event contract between backend and frontend

The chat frontend expects these events:

- `conversationId`
- `message`
- `transactions`
- `images`
- `sources`
- `mlSchema`
- `socials`
- `code`
- `codeResult`
- `mermaid`
- `youtubeResults`
- `excalidraw`
- `finish`
- `error`

That event contract is the real interface between the chat backend and the UI.

### 5.7 File and spreadsheet handling

The backend supports text extraction from:

- PDF
- DOCX
- XLS and XLSX
- CSV
- JSON
- HTML
- TXT

Spreadsheet-specific handling is especially important:

1. parse spreadsheet rows with `xlsx`
2. if parsing fails, fall back to delimited text parsing
3. pass raw rows to Featherless for normalization into strict JSON
4. add random `sus_detection` values in `addSuspiciousScore`
5. append this to the chat prompt as structured transaction context

Important implementation detail:

- `sus_detection` in this path is currently synthetic random data, not a real score from the Python ML models

### 5.8 External model and tool integrations in the chatbot backend

Gemini:
- primary answer generation
- model used: `gemini-2.5-flash-lite`
- may use Google Search grounding

Groq:
- AML schema generation via `llama-3.1-8b-instant`
- optional Node-side classifier via the same model
- Excalidraw flowchart generation helper

Featherless:
- used to normalize uploaded spreadsheet rows into strict JSON

Google Custom Search:
- image search
- social profile search

YouTube Data API:
- optional YouTube results related to the user prompt

QuickChart:
- final chart image rendering from generated Chart.js config

### 5.9 ML schema generation from the chatbot backend

The backend uses `src/helpers/mlSchemaGenerator.js` plus `src/prompts/mlSchemaPrompt.js`.

Purpose:

- turn a natural-language AML scenario into a structured graph payload

It can return either:

1. a universal graph payload:
   - `payload.graph`
   - `payload.nodes`
   - `payload.edges`
2. a pattern-specific payload matching one of P1 to P6

The schema prompt pushes the model to produce:

- investigation-friendly entity labels
- descriptions
- explicit edge labels
- amount and date metadata
- enough nodes and edges to visualize the case

### 5.10 Node-side AML classifier

There is also a Node helper in `src/helpers/amlClassifier.js`.

This is separate from the Python ML server.

It supports two modes:

1. local mode
   - deterministic keyword-based pseudo-classifier
   - seeded by payload hash
2. Groq mode
   - asks Llama to score all six typologies

Node classifier constants:

- threshold: `0.75`
- decisions:
  - `< 0.75` -> `not_suspicious`
  - `0.75 to < 0.9` -> `likely_suspicious`
  - `>= 0.9` -> `highly_suspicious`

This Node classifier is not the same as the actual graph ML models used by the Python server.

### 5.11 Charts

The charts helper:

1. sends prompt + history + uploads to Gemini
2. asks Gemini for JSON that matches a Chart.js-like schema
3. validates the returned JSON
4. sends the chart config to QuickChart
5. returns the chart image URL

Supported chart types:

- bar
- line
- pie
- doughnut
- polararea
- radar
- scatter
- bubble
- horizontalbar

### 5.12 Social and OSINT enrichment

The backend can run a social profile search against:

- Instagram
- LinkedIn
- X / Twitter
- Facebook

These are produced as grouped cards and attached to the assistant response.

## 6. The Six AML Patterns

The ML side of the system is built around six typologies. These appear in:

- the Node classifier prompt
- the Groq ML schema generator
- the Python dataset generators
- the Python graph models
- the frontend graph renderer

Each pattern has both:

- a business and investigation meaning
- an expected JSON shape

### 6.1 P1: Round Trip

Meaning:

- money leaves India and returns as apparently legitimate foreign investment
- usually uses offshore shells and treaty corridors

Typical scenario in this codebase:

- Indian source company sends funds to offshore shell
- optional layering company
- funds return to another Indian company as FDI
- same beneficial owner is the core fraud signal

Expected payload shape:

- `entities.person`
- `entities.companies[]`
- `transactions[]`
- `features`

Important P1 features in dataset and model:

- `num_dtaa_jurisdictions`
- `num_companies`
- `has_layering_jurisdiction`

Leaky features intentionally excluded during training:

- `amount_return_ratio`
- `round_trip_days`
- `same_beneficial_owner_both_ends`
- `uses_dtaa_corridor`
- related zero-employee and zero-revenue shell flags

### 6.2 P2: Loan Evergreening

Meaning:

- new loans are used to repay old loans so default risk is hidden
- sometimes routed through related shell companies

Typical scenario:

- stressed borrower cannot repay
- bank issues another loan
- borrower or shell routes funds to repay earlier loan
- debt keeps growing while NPA recognition is delayed

Expected payload shape:

- `entities.borrower`
- `entities.shells[]`
- `entities.bank_accounts[]`
- `transactions[]`
- `features`

Important P2 features in dataset and model:

- `repayment_coincides_with_new_loan`
- `new_loan_within_days_of_due_date`
- `n_loan_cycles`

### 6.3 P3: Invoice Fraud / Trade-Based Money Laundering

Meaning:

- over-invoicing imports or under-invoicing exports to move value across borders

Typical scenario:

- Indian entity trades with foreign counterparty
- invoice price materially differs from market value
- foreign counterparty is often related or a shell

Expected payload shape:

- `entities.indian_entity`
- `entities.foreign_entity`
- `invoices[]`
- `features`

Important P3 features in dataset and model:

- `goods_easily_mispriced`
- `foreign_entity_employee_count`
- `n_invoices`

### 6.4 P4: Hawala Banking

Meaning:

- informal cash settlement paired with formal remittance legs

Typical scenario:

- repeated cash deposits
- often below reporting threshold
- rapid inward remittance or wire after the cash activity
- no invoice or business support

Expected payload shape:

- `entities.person`
- `entities.bank_account`
- `transactions[]`
- `features`

Important P4 features in dataset and model:

- `cash_to_wire_ratio`
- `wire_within_7_days_of_cash`
- `all_deposits_below_ctr_threshold`

### 6.5 P5: Benami

Meaning:

- assets are held by nominees to hide the real owner

Typical scenario:

- real owner uses low-income nominees
- properties and shell companies sit in others' names
- affordability and linkage patterns reveal the structure

Expected payload shape:

- `entities.real_owner`
- `entities.nominees[]`
- `entities.properties[]`
- `entities.shells[]`
- `features`

Important P5 features in dataset and model:

- `nominees_same_introducer`
- `shells_have_zero_revenue`
- `affordability_ratio`

### 6.6 P6: PEP Kickback

Meaning:

- government contract proceeds are routed through shells or fake consultants to politically exposed persons or their family

Typical scenario:

- government contract awarded
- contractor pays shell or consultancy
- shell is owned by PEP family or associate
- funds may move offshore

Expected payload shape:

- `entities.pep`
- `entities.pep_family`
- `entities.contractor`
- `entities.shell`
- `entities.government_entity`
- `transactions[]`
- `features`

Important P6 features in dataset and model:

- `shell_has_single_client`
- `shell_client_is_govt_contractor`
- `pep_approved_contract`

## 7. How Transaction Detection Works with the Six Patterns

There are two different "pattern detection" paths in this repo.

### 7.1 Path A: heuristic or LLM-backed detection inside the Node backend

This is the less rigorous path.

It uses:

- `src/helpers/amlClassifier.js`
- either local keyword scoring or Groq

This path:

- scores all six patterns
- uses a threshold of `0.75`
- is useful for UI-level or fallback classification
- is not the same as the trained graph ML server

### 7.2 Path B: graph ML detection inside the Python server

This is the actual trained pattern classifier.

It works as follows:

1. User prompt or chat context is converted to a structured AML schema.
2. The payload is wrapped as:
   - `{ "pattern": "P1", "sample": {...} }`
   - or a dict keyed by `P1` to `P6`
3. The FastAPI route forwards to `pattern_router.py`.
4. The router:
   - validates the pattern wrapper
   - filters the allowed keys for that pattern
   - calls the trained scorer for that pattern
5. The scorer:
   - rebuilds a graph from entities + transactions or invoices + features
   - runs the corresponding GraphSAGE model
   - returns a probability-like `risk_score`
6. The router compares the score to the per-pattern threshold from metadata.
7. The router returns:
   - `best_pattern`
   - `best_risk_score`
   - `best_threshold`
   - `best_above_threshold`
   - `best_decision`
   - `all_results`

### 7.3 What counts as "detecting a transaction"

In this project, "transaction detection" does not mean anomaly detection on raw bank transaction ledgers alone.

It means:

- mapping an observed scenario into one of six typology graphs
- extracting structural and behavioral indicators
- classifying which of the six AML patterns the graph most closely matches

For P3, the model is invoice-based rather than transaction-based.
For P5, ownership and property structures matter more than monetary transfers.

## 8. ML Server: What It Is and How It Works

Main service path:

`ml-server`

Stack:

- FastAPI
- PyTorch
- PyTorch Geometric
- scikit-learn
- numpy
- neo4j
- faker
- shap listed in requirements

### 8.1 API surface

Routes in `api/app.py`:

- `GET /health`
- `POST /classify`

`POST /classify` simply calls `score_from_payload(payload)`.

### 8.2 Input contract

`pattern_router.py` accepts either:

1. all patterns:

```json
{
  "P1": { ... },
  "P2": { ... },
  "P3": { ... }
}
```

2. one wrapped sample:

```json
{
  "pattern": "P1",
  "sample": { ... }
}
```

It rejects a bare sample JSON without the wrapper.

### 8.3 Pattern-specific allowed keys

Allowed keys are intentionally restricted:

- P1: `sample_id`, `entities`, `transactions`, `features`
- P2: `sample_id`, `entities`, `transactions`, `features`
- P3: `sample_id`, `entities`, `invoices`, `features`
- P4: `sample_id`, `entities`, `transactions`, `features`
- P5: `sample_id`, `entities`, `features`
- P6: `sample_id`, `entities`, `transactions`, `features`

### 8.4 Decision logic in the ML server

The Python router uses two layers of interpretation:

1. per-pattern threshold from model metadata
2. decision bands from router logic

Router decision bands:

- `< 0.55` -> `not_suspicious`
- `0.55 to < 0.7` -> `likely_suspicious`
- `>= 0.7` -> `highly_suspicious`

Best pattern selection:

- pick the highest score among threshold-passing candidates
- if none pass threshold, pick the highest score overall

### 8.5 Graph model design

The active scorer is `Data/scripts/gnn_trainer.py`.

It uses:

- a custom `GraphBuilder`
- `AMLDataset`
- `SAGENet`
- GraphSAGE convolutions (`SAGEConv`)
- global mean pooling for graph classification

### 8.6 Node features used by the graph models

Each graph node includes normalized features such as:

- jurisdiction one-hot flags:
  - `IN`
  - `MU`
  - `SG`
  - `AE`
  - `HK`
  - `BVI`
  - `UK`
  - `NL`
  - `US`
  - `KY`
- `has_cin`
- `has_pan`
- `age_years_norm`
- `revenue_norm`
- `employee_count_norm`
- `is_shell`
- corridor flags:
  - `in_mauritius_corridor`
  - `in_hawala_corridor`
  - `in_hk_corridor`
  - `is_tax_haven`
- person-only features:
  - `is_pep`
  - `declared_income_norm`
- plus three pattern-specific top feature keys from metadata

### 8.7 Graph construction by pattern

The graph builder constructs graphs differently for each typology:

- P1:
  - company nodes
  - transaction edges between `from` and `to`
- P2:
  - borrower, shell, and bank account nodes
  - loan and repayment edges
- P3:
  - Indian and foreign entities
  - invoice edges
- P4:
  - person and bank account
  - transaction edges
- P5:
  - owners, nominees, properties, shells
  - ownership and control edges
- P6:
  - government, contractor, shell, PEP family
  - payment flow edges

### 8.8 Training behavior

The training script:

- loads synthetic datasets for each pattern
- detects and excludes some leaky features
- selects top non-leaky features
- regularizes graph size using median target node and edge counts
- trains GraphSAGE models
- saves:
  - `gnn_P?.pt`
  - `gnn_P?_meta.json`

### 8.9 Current trained model metadata

Real values from the checked-in metadata:

| Pattern | Threshold | Val Accuracy | Val AUC | Top feature keys |
| --- | ---: | ---: | ---: | --- |
| P1 | 0.50 | 0.8300 | 0.8522 | `num_dtaa_jurisdictions`, `num_companies`, `has_layering_jurisdiction` |
| P2 | 0.27 | 0.8267 | 0.8438 | `repayment_coincides_with_new_loan`, `new_loan_within_days_of_due_date`, `n_loan_cycles` |
| P3 | 0.26 | 0.8567 | 0.8850 | `goods_easily_mispriced`, `foreign_entity_employee_count`, `n_invoices` |
| P4 | 0.24 | 0.8600 | 0.8931 | `cash_to_wire_ratio`, `wire_within_7_days_of_cash`, `all_deposits_below_ctr_threshold` |
| P5 | 0.24 | 0.8400 | 0.8629 | `nominees_same_introducer`, `shells_have_zero_revenue`, `affordability_ratio` |
| P6 | 0.23 | 0.5000 | 0.8648 | `shell_has_single_client`, `shell_client_is_govt_contractor`, `pep_approved_contract` |

Important observation:

- P6 has weak validation accuracy despite reasonable AUC
- future agents should treat P6 calibration as suspect

### 8.10 Important threshold mismatch

There is a major inconsistency between the Node and Python classification layers:

- Node classifier threshold: `0.75`
- frontend classification label text: threshold `0.75`
- Python model thresholds: `0.23` to `0.50`, depending on pattern
- Python decision banding: `0.55` and `0.7`

This means:

- the UI language and the Python model metadata are not aligned
- future work should decide which thresholding regime is the real product behavior

## 9. Dataset Generation for the Six Patterns

The ML datasets are synthetic and generator-driven.

Key files:

- `Data/scripts/data-generation/P1_round_trip.py`
- `P2_loan_evergreening.py`
- `P3_invoice_fraud.py`
- `P4_p5_p6_generators.py`

General pattern:

- each generator creates fraudulent and legitimate examples
- most datasets are balanced 50/50
- each sample includes:
  - `sample_id`
  - `pattern`
  - `label`
  - `label_name`
  - `human_explanation`
  - `entities`
  - `transactions` or `invoices`
  - `features`

Important implication:

- the trained models learn on synthetic graph patterns, not on raw production transaction logs

## 10. Neo4j Graph Layer

The graph page is powered by Neo4j, but the APIs live in `luna-aml-web/server`, not the AML chatbot backend.

Graph route file:

- `luna-aml-web/server/src/routes/graph.js`

Endpoints:

- `GET /api/graph`
- `POST /api/graph/search`
- `GET /api/graph/stream`

Behavior:

- fetch all nodes with labels and sizes
- lowercase node groups to match frontend color maps
- only return relationships where both endpoints are in the returned node set
- search returns matched nodes plus one-hop neighbors
- stream endpoint emits status messages then the graph payload

Neo4j envs used there:

- `NEO4J_URI`
- `NEO4J_USER`
- `NEO4J_PASSWORD`

There is also a data ingestion script in the ML server:

- `Data/scripts/ingestion/neo4j_loader.py`

That script loads generated AML datasets into Neo4j using nodes such as:

- Company
- Person
- BankAccount
- Transaction
- Invoice
- Property

And relationships such as:

- `TRANSACTED`
- `OWNS`
- `DIRECTS`
- `HOLDS_ACCOUNT`
- `ISSUED_INVOICE`
- `OWNS_PROPERTY`
- `FAMILY_OF`
- `AWARDED_CONTRACT`
- `PAID_CONSULTANT`

## 11. The Other Node Server (`luna-aml-web/server`)

This service is a separate Express app with:

- MongoDB connection
- auth routes
- patient, doctor, asha, and appointments routes
- Socket.IO
- graph routes

From the code, this is primarily a healthcare application, not the AML chatbot backend.

Why it matters:

- the frontend still points some AML features to this service
- it provides the Neo4j graph API
- it appears to have inherited or mixed responsibilities from another project

Future agents should treat `server/` as:

- partly relevant for graph functionality
- mostly unrelated to the AML chat core

## 12. End-to-End Runtime Flows

### 12.1 Chat only

1. User sends prompt in frontend.
2. Frontend posts to `5001/api/chat/stream`.
3. Backend streams Gemini text.
4. Backend may also emit sources, socials, YouTube, code, Mermaid, and Excalidraw.
5. Message is saved to Supabase.

### 12.2 Chat with spreadsheet upload

1. User uploads XLS, XLSX, or CSV.
2. Backend parses rows.
3. Backend normalizes them through Featherless.
4. Backend adds random `sus_detection` scores.
5. Structured transaction JSON is appended to the Gemini prompt.
6. Backend emits a `transactions` event to the frontend.
7. Gemini responds using that transaction context.

### 12.3 Chat plus ML graph and pattern classification

1. User describes an AML scenario.
2. Backend runs Groq ML schema generation in parallel.
3. Backend emits `mlSchema`.
4. Frontend renders the graph payload.
5. Frontend posts the payload to `http://localhost:8000/classify`.
6. Python ML server returns per-pattern scores.
7. Frontend displays best pattern and all results.

### 12.4 Graph exploration

1. User opens graph page.
2. Frontend calls graph API on `5002`.
3. Graph server queries Neo4j.
4. Frontend renders nodes and links with D3.

## 13. Environment and Config Notes

Do not put secret values into future shared context files. Only the names and roles matter here.

### 13.1 Chatbot backend envs seen in code

Important env names:

- `PORT`
- `NODE_ENV`
- `GEMINI_API_KEY`
- `GEMINI_API_KEY2`
- `GEMINI_API_KEY3`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_API_KEY`
- `GOOGLE_CSE_ID`
- `YOUTUBE_API_KEY`
- `GROQ_KEY`
- `SERPAPI_KEY`
- `MONGODB_URI`
- `FEATHERLESS_BASE_URL`
- `FEATHERLESS_MODEL`
- `FEATHERLESS_API_KEY`

### 13.2 Frontend envs seen in code

- `NEXT_PUBLIC_GRAPH_API_URL`
- `LUNA_API_URL`
- `NEXT_PUBLIC_LUNA_API_URL`
- local frontend `.env` also contains Google auth variables

### 13.3 Graph server envs

- `PORT`
- MongoDB envs from `connectDB()`
- `NEO4J_URI`
- `NEO4J_USER`
- `NEO4J_PASSWORD`

## 14. Important Quirks, Risks, and Mismatches

These are the most important engineering facts for future work.

### 14.1 Hardcoded JWT in AML backend auth middleware

`luna-chatbot-backend/src/middleware/auth.js`:

- ignores the incoming Authorization header
- verifies a hardcoded JWT string
- uses `ignoreExpiration: true`

Meaning:

- protected routes effectively run as the baked-in user if verification succeeds
- this is a serious security and correctness issue

### 14.2 Frontend uses two different backends inconsistently

By default:

- chat uses `5001`
- graph uses `5002`
- auth uses `5002`
- charts use `5002`
- feedback uses `5002`
- ML classification uses `8000`

This creates cross-service confusion and broken assumptions.

### 14.3 Chatbot auth and frontend auth are not aligned

The frontend auth context points to the graph and legacy backend.
The AML chat backend has its own `/api/users` routes.

Future agents should verify which auth system is intended to be the real one before changing login flows.

### 14.4 Synthetic `sus_detection` scores

When spreadsheets are uploaded, the backend adds random `sus_detection` values.

So:

- the current spreadsheet "suspicion score" is demo logic
- it is not produced by the graph ML models

### 14.5 Node and Python classifier thresholds disagree

Already covered above, but important enough to repeat:

- Node and UI use `0.75`
- Python metadata thresholds are much lower

### 14.6 Speech and transcription path looks incomplete

The frontend has voice and transcription hooks, but:

- the speech route is commented out in the backend app setup
- the speech controller references a missing transcription helper

This feature should be treated as incomplete.

### 14.7 `server/` is a mixed codebase

The directory name and shared repo structure make it look central to Luna, but it is largely a separate healthcare backend with only one AML-relevant part: the Neo4j graph routes.

### 14.8 Case-sensitive import risk in ML server

The Python code tries both `data` and `Data`.

This may work on Windows and fail differently on Linux depending on actual directory names and deployment environment.

### 14.9 Landing page mismatch

The marketing page mostly reflects AML, but at least one feature section appears copied from a different app. Future design or prompt work should not rely on the landing page as the single source of product truth.

## 15. Practical Mental Model for Future Agents

If you are an agent working in this repo, the most accurate mental model is:

- the real AML product is centered on `client/`, `luna-chatbot-backend/`, and `ml-server/`
- `server/` matters mostly for graph APIs, not for the core AML chat logic
- chat answers are generated by Gemini
- structured AML graphs are generated by Groq
- pattern classification is done by the Python GraphSAGE server
- uploaded transaction sheets are normalized by Featherless and then fed to Gemini, with fake `sus_detection` added for now
- the UI is built to display far more than text: sources, graphs, classification, charts, code, diagrams, social profiles, and video results

## 16. Short Summary

Luna is an AML investigation assistant that combines:

- a Next.js analyst UI
- a Node backend that orchestrates chat, search, OSINT, charting, and AML-schema generation
- a Python graph ML server that scores six typologies:
  - P1 Round Trip
  - P2 Loan Evergreening
  - P3 Invoice Fraud / TBML
  - P4 Hawala Banking
  - P5 Benami
  - P6 PEP Kickback

The most important implementation reality is that the repo is split across multiple services with inconsistent wiring. Any future work should validate which service owns auth, charts, graph, and classification before making architectural changes.
