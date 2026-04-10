# Luna Shield – AI-Powered Digital Threat Intelligence Platform

**Track 4: Cybersecurity, Fintech, and Digital Trust | PS-402**

Luna Shield is an AI-powered threat intelligence platform that detects, analyzes, and mitigates digital threats including phishing, malicious content, misinformation campaigns, and financial crime.

---

## 🎯 Problem Statement

PS-402: Detection of Digital Threats & Malicious Content

The platform addresses the growing challenge of detecting and responding to sophisticated digital threats across multiple domains:
- **Phishing & Impersonation** — Email, SMS, social engineering attacks
- **Malicious URLs & Attachments** — Infrastructure and payload analysis
- **Misinformation Campaigns** — Coordinated harmful content propagation
- **Financial Threats** — AML patterns and illicit finance networks

---

## ✨ Key Capabilities

### 🔍 **Multi-Domain Threat Detection**
- Phishing and impersonation analysis
- Malicious URL and attachment scoring
- Misinformation and social engineering detection
- AML pattern recognition (P1-P6)

### 🧠 **AI Investigator Copilot**
- Natural language threat analysis
- Context-aware mode selection (Phishing, URL, Campaigns, AML)
- Explainable risk scoring with evidence

### 📊 **Threat Graph Analysis**
- Relationship mapping for actors, domains, content
- Campaign correlation and clustering
- Network investigation workspace

### 🚨 **Real-Time Alerting**
- Watchlist-based detection
- Automatic alert generation from analysis
- Real-time SSE alert streaming

### 📁 **Case Management**
- Investigation workspace with evidence tracking
- Timeline-based case progression
- Mitigation action recommendations

### ⚡ **Mitigation Actions**
- Automated action recommendations by threat type
- Action workflow (suggested → approved → completed)
- Trust operations dashboard

---

## 🏗️ Architecture

### **Services**

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                        │
│              http://localhost:3000                          │
│  • Analyze • Graph • Alerts • Cases • Chat • Auth          │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
┌───────────────▼──────┐  ┌──▼──────────┐  ┌▼─────────────────┐
│ Luna Chatbot Backend │  │ Graph API   │  │   ML Server      │
│   (Node/Express)     │  │  (Legacy)   │  │  (Python/PyTorch)│
│   Port: 5001         │  │ Port: 5002  │  │  Port: 8000      │
│                      │  │             │  │                  │
│ • Chat/Copilot       │  │ • Neo4j     │  │ • AML P1-P6      │
│ • Threat Analysis    │  │ • Graph     │  │ • Classification │
│ • Alerts/Cases       │  │   Query     │  │                  │
│ • Actions            │  │             │  │                  │
└──────────────────────┘  └─────────────┘  └──────────────────┘
```

### **Tech Stack**

**Frontend:**
- Next.js 15 + React 19
- Tailwind CSS 4
- D3.js (graph visualization)
- Lucide Icons
- SSE (real-time alerts)

**Backend:**
- Node.js + Express
- Supabase (auth & persistence)
- Gemini AI (chat/copilot)
- Groq (schema generation)

**ML Server:**
- FastAPI
- PyTorch Geometric
- Scikit-learn
- 6 trained AML pattern models

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+
- Python 3.9+
- Neo4j (for graph features)

### **Environment Setup**

Create `.env` files in both `luna-chatbot-backend/` and `client/`:

```bash
# luna-chatbot-backend/.env
PORT=5001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

# client/.env.local
NEXT_PUBLIC_LUNA_API_URL=http://localhost:5001
NEXT_PUBLIC_GRAPH_API_URL=http://localhost:5002
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
```

### **Installation & Run**

**1. Install dependencies:**

```bash
# Frontend
cd client
npm install

# Backend
cd ../luna-chatbot-backend
npm install

# ML Server
cd ../../ml-server
pip install -r requirements.txt
```

**2. Start services:**

```bash
# Terminal 1: ML Server
cd ml-server
python api/app.py

# Terminal 2: Main Backend
cd luna-aml-web/luna-chatbot-backend
npm start

# Terminal 3: Graph Backend (optional)
cd luna-aml-web/server
npm start

# Terminal 4: Frontend
cd luna-aml-web/client
npm run dev
```

**3. Access the platform:**

Open [http://localhost:3000](http://localhost:3000)

---

## 📖 User Guide

### **Demo Workflow**

1. **Navigate to Analyze** — Upload or paste suspicious content
2. **Run Analysis** — Extract IOCs, entities, claims, and risk scores
3. **View Graph** — Explore relationship networks
4. **Check Alerts** — Review auto-generated alerts from analysis
5. **Create Case** — Convert alert/analysis into investigation case
6. **Review Actions** — Approve recommended mitigation actions
7. **Use Copilot** — Discuss findings with AI investigator

### **Investigation Modes**

The platform supports 5 investigation modes:

- **Threat Copilot** — General digital threat analysis
- **Phishing & Impersonation** — Email/SMS phishing detection
- **URL & Attachment** — Malicious infrastructure analysis
- **Misinformation & Campaigns** — Coordinated content detection
- **AML & Financial** — Money laundering pattern recognition

---

## 📁 Project Structure

```
luna-aml-web/
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── app/              # Pages (analyze, chat, alerts, cases, graph)
│   │   ├── components/       # Reusable UI components
│   │   ├── config/           # Endpoint configuration
│   │   └── utils/            # Helper functions
│   └── package.json
│
├── luna-chatbot-backend/     # Main product backend
│   ├── src/
│   │   ├── controllers/      # Chat, analysis controllers
│   │   ├── routes/           # API routes
│   │   ├── helpers/          # Store modules (alerts, cases, actions)
│   │   ├── data/             # Fixtures and demo scenarios
│   │   └── prompts/          # AI copilot prompts
│   └── package.json
│
├── server/                    # Legacy graph backend (transitional)
│   └── src/
│
└── ml-server/                 # Python ML classification
    ├── api/                   # FastAPI app
    ├── Data/                  # Training data
    └── model.py               # Pattern models
```

---

## 🧪 Demo Scenarios

The platform includes pre-built demo scenarios:

- **PayPal Phishing** — Classic account verification scam
- **Delivery SMS Smishing** — Fake package tracking link
- **Typosquatted URL** — Microsoft login clone
- **Health Misinformation** — Coordinated false medical claims
- **Crypto Investment Scam** — Too-good-to-be-true scheme
- **Loan Evergreening (P2)** — AML money laundering pattern

Access via: `/analyze` page → "Load Demo Scenario" (implementation pending)

---

## 🔒 Security Notes

**Current Implementation:**
- Authentication via Supabase
- Protected routes with JWT validation
- API keys required for external services

**Known Limitations (Hackathon Build):**
- In-memory stores (alerts, cases, actions) — not persistent
- Demo mode with seeded watchlist data
- Some routes use simplified auth for demo purposes

For production deployment:
- Migrate to persistent database (PostgreSQL/Supabase)
- Implement proper RBAC
- Add rate limiting and input validation
- Enable CORS restrictions

---

## 📊 API Endpoints

### **Threat Analysis**
```
POST /api/threats/normalize  — Convert raw input to ThreatArtifact
POST /api/threats/analyze    — Full threat analysis with IOCs
POST /api/threats/graph      — Build threat relationship graph
POST /api/threats/correlate  — Find related threats
```

### **Alerts**
```
GET  /api/alerts            — List alerts
GET  /api/alerts/stream     — SSE real-time alert stream
GET  /api/alerts/stats      — Alert statistics
POST /api/alerts/watchlist  — Add watchlist entry
```

### **Cases**
```
GET  /api/cases             — List cases
POST /api/cases             — Create case
GET  /api/cases/:id         — Case details with evidence/timeline
PATCH /api/cases/:id        — Update case status
POST /api/cases/:id/notes   — Add analyst note
```

### **Actions**
```
GET  /api/actions           — List mitigation actions
POST /api/actions           — Create action
PATCH /api/actions/:id/status — Update action status
```

---

## 🤝 Contributing

This is a ByteCamp 2026 hackathon submission. The codebase is designed for rapid iteration and demo quality.

For questions or collaboration: Contact team via hackathon platform

---

## 📄 License

Proprietary - ByteCamp 2026 Hackathon Submission

---

## 🙏 Acknowledgments

- Built for ByteCamp 2026 - Track 4: Cybersecurity, Fintech, and Digital Trust
- Powered by Gemini AI, Groq, and PyTorch Geometric
- Graph visualization inspired by D3.js community examples