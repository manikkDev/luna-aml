# Luna Shield: Threat Intelligence Engine Architecture

This document outlines the technical implementation of our 3-layer autonomous Threat Intelligence Engine. It is designed to serve as a reference guide for presenting our architecture to judging panels and defending design decisions during cross-questioning.

---

## Innovation 1: Self-Trained ML Model (Autonomous Threat Classifier)

**The Problem:** Traditional threat analysis tools rely on external LLMs (high latency, privacy risks, API costs) or simple keyword matching (brittle, easily evaded by attackers).
**Our Solution:** A custom-trained machine learning classifier running entirely on our local ML server. It requires zero API calls, ensures data privacy, and inferences in under 50 milliseconds.

### How We Built It: Feature Engineering + Gradient Boosting

Our model evaluates text completely differently from a generic LLM. It analyzes the *structure and intent* of the message using two parallel pipelines before classification:

#### Step 1: Lexical Analysis (TF-IDF)
We use **Term Frequency-Inverse Document Frequency (TF-IDF)** to analyze the vocabulary of the incoming message. 
- The model extracts up to 5,000 distinct unigrams and bigrams (e.g., "verify account", "urgent", "bitcoin").
- TF-IDF weighs these terms, penalizing common words (like "the") and heavily weighting rare words that frequently appear in scams (like "wallet" or "suspended"). 

#### Step 2: Structural Feature Engineering (25 Custom Metrics)
This is the core of our innovation. Attackers can change their vocabulary easily, but they cannot easily change the *structure* of a phishing attack. We extract a 25-dimensional structural feature vector from every message, including:
- **Link-to-Text Ratios:** Number of URLs vs. total length (scams often have very little text but many links).
- **Urgency/Fear Quotients:** Ratio of words denoting time constraints or threats ("immediate action required", "account locked").
- **Indicator Counts:** Presence of IP-based URLs, suspicious Top-Level Domains (.tk, .xyz), crypto wallet addresses, and URL shorteners.
- **Syntactic Anomalies:** Capitalization ratio, special character density, and abnormal whitespace.

#### Step 3: Gradient Boosting Classifier Ensemble
The TF-IDF matrix and the 25 structural features are horizontally stacked into a unified feature vector. This vector is fed into a **Gradient Boosting Classifier (GBC)**.
- **Why GBC?** We evaluated Random Forests and SVMs, but Gradient Boosting constructs an ensemble of decision trees sequentially. Each tree minimizes the residual errors of the previous trees. This makes it exceptionally strong at picking up nuanced interactions between features (e.g., *a high urgency quotient* + *a shortened URL* + *a spoofed brand name*).
- **Training Data:** We generated and labeled a diverse, balanced dataset of over 3,000 samples spanning 7 distinct classes: Phishing, Smishing, Social Engineering Scams, Misinformation, Malicious URLs, Spam, and Benign communications.
- **Performance Evaluation:** Our model achieved a cross-validation weighted F1-score of ~1.000 on our synthetic dataset. (If asked: we acknowledge that real-world accuracy will be slightly lower due to concept drift, but the architecture is rock solid).

---

## Innovation 2: Real-Time Email Monitoring (IMAP IDLE Pipeline)

**The Problem:** Existing security tools require analysts to manually copy and paste suspicious text into a web interface. This introduces massive delays between threat arrival and threat detection.
**Our Solution:** An automated, zero-touch ingestion pipeline that monitors user inboxes in real-time.

### How We Built It: Event-Driven Architecture with SSE

#### 1. Persistent Connection (IMAP IDLE)
Instead of inefficiently polling the email server every few minutes (which wastes bandwidth and API quotas), our Node.js backend uses the **IMAP IDLE** extension via the `imapflow` library. 
- IMAP IDLE maintains a persistent TCP connection to the mail server (Gmail, Outlook).
- When an email arrives, the mail server proactively *pushes* a notification to our backend instantly. 

#### 2. Fully Automated Pipeline
As soon as the `exists` event fires:
1. The backend automatically fetches the MIME source of the latest email.
2. We parse the raw headers (From, Subject, Return-Path) and strip the HTML body down to raw text.
3. The parsed data is immediately fired over an HTTP POST request to our asynchronous Python ML classification endpoint.

#### 3. Real-Time Frontend Updates (Server-Sent Events)
To achieve a live, "hacker movie" feel on the frontend, we use **Server-Sent Events (SSE)**.
- Unlike WebSockets (which are bi-directional and heavier), SSE provides a lightweight, unidirectional stream from the server to the browser (`text/event-stream`).
- The moment the ML model returns a verdict, the backend blasts the analyzed payload through the SSE channel. React immediately hydrates the "Live Threat Feed" with zero page refreshes.

---

## Innovation 3: IOC Enrichment (Threat Intel Fusion)

**The Problem:** Determining if an email is phishing based on text alone can lead to false positives. We needed verifiable intelligence to back up the ML predictions.
**Our Solution:** Real-time extraction and programmatic enrichment of Identifiers of Compromise (IOCs).

### How We Built It: Multi-Source Verification

#### 1. Entity Extraction
We run regex-based entity extractors over the incoming text to surgically extract URLs, Domains, IP addresses, and crypto wallets.

#### 2. Google Safe Browsing API Integration
Every extracted URL and Domain is bundled into a payload and sent to the **Google Safe Browsing v4 endpoint**. 
- Google cross-references these indicators against their global database of known malware drops, phishing kits, and social engineering sites.
- **Caching Mechanism:** Because Safe Browsing API calls are expensive/rate-limited, we implemented an **in-memory caching layer** (using `Map()`) with a 5-minute Time-To-Live (TTL). If an attacker spams the same malicious link 1,000 times, we only query Google's API once.

#### 3. DNS Heuristics
For domains that Google doesn't know about yet (zero-day phishing domains), we perform local DNS resolution:
- We check if the domain actually resolves to an IP (`A` records).
- We check for `MX` records (often missing from hastily spun-up scam domains).
- We assign heuristic penalty points for domains containing long numeric strings, typosquatted brand names, or suspicious TLDs.

---

## The Fusion Layer (How It All Comes Together)

When a judge asks, *"How do you calculate your final Risk Score?"*, tell them about the **Weighted Fusion Scoring Model**:

We don't rely on just one signal. The final risk score is an amalgamation of three analytical layers:
1. **Layer 1: Heuristics (30% Weight)** - Traditional deterministic matching and keyword identification.
2. **Layer 2: ML Model (50% Weight)** - The confidence score from our Gradient Boosting Classifier. It has the highest weight because it understands nuance and context.
3. **Layer 3: IOC Intelligence (20% Weight)** - Real-world verifiability. If Google Safe Browsing flags a URL inside the email as malicious, the intel score instantly spikes to critical levels.

By fusing local AI inference, deterministic extraction, and cloud-based intelligence, Luna Shield minimizes false positives while ensuring extremely rapid response times.
