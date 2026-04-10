# Luna Shield - Quick Start Guide

**Get the platform running in under 5 minutes.**

---

## Prerequisites

- Node.js 18+ installed
- Python 3.9+ installed (for ML server)
- Git installed

---

## 1. Environment Setup

### Backend Environment

Create `luna-chatbot-backend/.env`:

```bash
PORT=5001
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

**Getting API Keys:**
- **Supabase:** Sign up at https://supabase.com, create a project, copy URL and anon key
- **Gemini:** Get from https://ai.google.dev/
- **Groq:** Get from https://console.groq.com/

### Frontend Environment

Create `client/.env.local`:

```bash
NEXT_PUBLIC_LUNA_API_URL=http://localhost:5001
NEXT_PUBLIC_GRAPH_API_URL=http://localhost:5002
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
```

---

## 2. Install Dependencies

```bash
# Frontend
cd client
npm install

# Main Backend
cd ../luna-chatbot-backend
npm install

# ML Server (optional for full AML features)
cd ../../ml-server
pip install -r requirements.txt
```

---

## 3. Start Services

**Open 4 separate terminals:**

### Terminal 1: ML Server (Optional)
```bash
cd ml-server
python api/app.py
```
*Server runs on port 8000*

### Terminal 2: Main Backend (Required)
```bash
cd luna-aml-web/luna-chatbot-backend
npm start
```
*Server runs on port 5001*

### Terminal 3: Graph Backend (Optional)
```bash
cd luna-aml-web/server
npm start
```
*Server runs on port 5002*  
*Only needed for Neo4j graph features*

### Terminal 4: Frontend (Required)
```bash
cd luna-aml-web/client
npm run dev
```
*App runs on port 3000*

---

## 4. Access the Platform

**Open your browser:**

http://localhost:3000

---

## 5. Quick Demo

### Option 1: Fast Demo (2 minutes)

1. Navigate to `/analyze`
2. Click "Load Demo Scenario" → select "📧 PayPal Phishing Email"
3. Click "Analyze Threat"
4. Explore tabs: Analysis → Graph → Correlation
5. Navigate to `/alerts` to see auto-generated alert
6. Click "Create Case" on the alert

### Option 2: Full Workflow (5 minutes)

1. Load phishing demo scenario
2. Analyze and review risk score
3. View extracted IOCs and entities
4. Check graph relationships
5. Go to `/alerts` and create case
6. In case details, add a note
7. Approve a recommended action
8. Mark action as completed

### Option 3: AML Demo (3 minutes)

1. Load "💵 Loan Evergreening (P2)" demo
2. See AML pattern detection
3. Navigate to `/chat?mode=aml`
4. Discuss the pattern with AI copilot
5. Create case from analysis
6. Review AML-specific action recommendations

---

## 6. Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5001 (Windows)
netstat -ano | findstr :5001
taskkill /PID <process_id> /F

# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Backend Not Connecting
- Check `.env` file exists in `luna-chatbot-backend/`
- Verify API keys are valid
- Check console for error messages

### Frontend Build Errors
```bash
cd client
rm -rf node_modules .next
npm install
npm run dev
```

### Missing API Keys
The platform will run with limited features:
- **No Gemini key:** Chat/copilot won't work
- **No Groq key:** Schema generation disabled
- **No Supabase:** Auth and persistence disabled (in-memory only)

---

## 7. Demo Scenarios

**Available via `/analyze` page dropdown:**

| Scenario | Threat Type | Key Features |
|----------|-------------|--------------|
| PayPal Phishing | Phishing | Typosquatted domain, urgency tactics |
| Fake Delivery SMS | Smishing | Malicious tracking link |
| Typosquatted URL | Malicious URL | Microsoft login clone |
| Health Misinformation | Misinformation | Conspiracy claims, amplification |
| Crypto Scam | Social Engineering | Too-good-to-be-true, wallet extraction |
| Loan Evergreening | AML (P2) | Circular loan structure |

---

## 8. Key Pages

| URL | Purpose |
|-----|---------|
| `/` | Landing page with platform overview |
| `/analyze` | Multi-domain threat analysis workspace |
| `/graph` | Graph investigation interface |
| `/alerts` | Real-time alert dashboard |
| `/cases` | Case management and investigation |
| `/cases/[id]` | Case details with timeline and actions |
| `/chat` | AI investigator copilot |
| `/chat?mode=aml` | AML-focused copilot mode |
| `/chat?mode=phishing` | Phishing investigation mode |

---

## 9. API Endpoints

**Test backend health:**
```bash
curl http://localhost:5001/
```
**Expected:** `✅ API service is running`

**Get metrics:**
```bash
curl http://localhost:5001/api/metrics/dashboard
```

**Get alerts:**
```bash
curl http://localhost:5001/api/alerts
```

**Get cases:**
```bash
curl http://localhost:5001/api/cases
```

---

## 10. Development Tips

### Hot Reload
- Frontend: Changes auto-reload
- Backend: Restart server manually or use `nodemon`

### Clear In-Memory Data
Restart the backend server (port 5001) to reset:
- Alerts
- Cases
- Actions
- Metrics

### View Console Logs
- **Frontend:** Browser DevTools → Console
- **Backend:** Terminal running `npm start`

### Debug API Calls
Use browser Network tab to inspect:
- Request payloads
- Response data
- Error messages

---

## Need Help?

- Check `README.md` for full documentation
- Review `PHASE12_COMPLETION.md` for architecture details
- Check backend console for error logs
- Verify all environment variables are set

---

**Platform Status:** 🟢 Demo-Ready  
**Estimated Setup Time:** 5 minutes  
**Minimum Services:** Frontend + Main Backend  
**Full Features:** All 4 services running
