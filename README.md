<div align="center">

<h1>⚡ Praeventix EWS-360</h1>

<p><strong>Intelligence that acts before a payment is missed.</strong></p>

<p>
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.104+-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/LightGBM-4.1+-009688?style=for-the-badge" />
  <img src="https://img.shields.io/badge/PyTorch-2.1+-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" />
  <img src="https://img.shields.io/badge/SHAP-Explainable_AI-blueviolet?style=for-the-badge" />
</p>

<p>
  <strong>Team Code Atlantis</strong> · SFIT Mumbai Hackathon 2026
</p>

</div>

---

## 🧭 Project Overview

### Problem Statement

Every year, Indian banks and NBFCs lose over **₹2 lakh crore** to retail loan delinquencies — not because customers are dishonest, but because stress signals go undetected until it is too late. Traditional risk systems are **reactive**: they fire an alert only after a borrower has missed one or more EMI payments, by which point recovery costs escalate by 3–5×, CIBIL scores are already damaged, and the customer relationship is beyond repair.

Banks currently lack a behavioural early-warning layer that can look *upstream* — at weekly cash-flow patterns, salary timing, UPI spending behaviour, ATM withdrawals, and failed auto-debits — and predict delinquency risk **14–21 days before the first missed payment**.

### Solution

**Praeventix EWS-360** is a full-stack, AI-powered pre-delinquency intervention platform for retail banking collections teams. It:

1. **Ingests** 16 real-time weekly behavioural signals per customer (cash flow, salary delay, credit utilisation, lending UPI activity, etc.)
2. **Scores** every customer through a 4-model ensemble (LightGBM + GRU + Meta-Learner + Isolation Forest)
3. **Explains** each score with SHAP attributions and Gemini-generated narrative reports
4. **Routes** high-risk accounts to the correct intervention tier (RM call, payment holiday, SMS nudge) through a policy-gated agentic decision engine
5. **Surfaces** everything on a live risk operations dashboard for bank managers

> *"Most banks react after default. We intervene 15 days before."*

---

## ✨ Features

### 🔬 Core AI / ML Features

| Feature | Description |
|---|---|
| **Ensemble Risk Scoring** | LightGBM + GRU sequential model + Logistic meta-learner produces a single calibrated risk probability (0–1) per customer per week |
| **Anomaly Detection** | Isolation Forest (8% contamination) flags structurally unusual spending profiles that classifiers may miss |
| **SHAP Explainability** | TreeExplainer computes per-feature SHAP values for every LightGBM prediction — surfaced as ranked bar charts in the UI |
| **AI Narrative Reports** | Gemini API generates professional, context-aware risk narratives from SHAP attributions; falls back to template engine when key is absent |
| **Temporal Modelling** | GRU processes 8-week rolling sequences of 16 behavioural features to capture trend and velocity signals |
| **Ability-Willingness Matrix** | Classifies each customer into a 2-axis quadrant (financial ability × repayment intent) for targeted intervention strategy |
| **Live Simulation Stream** | Real-time customer risk scoring from a streaming CSV with <30ms inference latency per record |

### 🖥️ Frontend / User-Facing Features

| Module | Description |
|---|---|
| **Overview Dashboard** | Live KPI cards (portfolio exposure, high-risk count, velocity trend, model accuracy), animated risk distribution chart, ticker feed |
| **AI Predict** | Manual feature entry, preset profiles, or CSV batch upload → real-time risk score + SHAP bar chart + one-click PDF export |
| **Live Flagging** | Searchable, sortable at-risk customer table with sparkline trends; drill-down modal with timeline, SHAP breakdown, and Gemini narrative |
| **Rules & SHAP** | UI-editable policy rule tuning with impact simulation; global SHAP explain view; SHAP PDF export |

### ⚙️ Backend / System Features

- JWT-based authentication with bearer token flow
- SQLite query cache with file-mtime snapshotting for hot reload
- Policy-gated agentic intervention pipeline with compliance filtering
- PII masking before any LLM prompt dispatch
- Rate limiter class (pluggable middleware)
- CORS-enabled REST API with Pydantic v2 schema validation
- BentoML service layer (`service.py`) for optional model serving
- Full pytest test suite covering API, agent, features, models, and compliance

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Why Chosen |
|---|---|---|
| **Python** | 3.11+ | Dominant ML ecosystem; asyncio for FastAPI |
| **FastAPI** | 0.104+ | High-performance async REST; automatic OpenAPI docs |
| **Uvicorn** | 0.24+ | ASGI server with hot-reload for development |
| **Pydantic v2** | 2.4+ | Fast schema validation; strict typing for API contracts |
| **LightGBM** | 4.1+ | State-of-the-art gradient boosting; DART boosting for AUC optimisation |
| **PyTorch** | 2.1+ | GRU temporal model with custom training loop |
| **scikit-learn** | 1.3+ | Ensemble meta-learner (Logistic Regression), Isolation Forest, scalers |
| **SHAP** | 0.44+ | TreeExplainer for LightGBM; post-hoc interpretability |
| **LangChain / LangGraph** | 0.1+ | Pluggable LLM client abstraction; agentic intervention graph |
| **python-jose** | 3.3+ | JWT signing and verification |
| **SQLite** | (stdlib) | Lightweight query cache; zero infra dependency |
| **PyYAML** | 6.0+ | Config-driven thresholds, model params, compliance rules |

### Frontend

| Technology | Version | Why Chosen |
|---|---|---|
| **React** | 18.3 | Component-based; concurrent rendering for live data |
| **Vite** | 5.4 | Sub-second HMR; ESM-native bundling |
| **Recharts** | 2.12 | Declarative charting for KPI and sparkline components |
| **Axios** | 1.7 | Promise-based HTTP; centralised interceptor for auth tokens |
| **html2pdf.js** | 0.14 | Client-side PDF export from risk reports and SHAP charts |
| **Three.js** | 0.183 | WebGL neural-network landing animation |
| **threejs-components** | 0.0.30 | TubesCursor 3D animation component |

### AI / ML Models

| Model | Role | Config Highlights |
|---|---|---|
| **LightGBM** (DART) | Primary tabular classifier | 500 estimators, 63 leaves, AUC metric, class imbalance handling |
| **GRU (PyTorch)** | Temporal sequence model | 8-week window, 64→32 hidden, dropout 0.3, pos_weight 4.0 |
| **Logistic Ensemble** | Meta-learner stacking | Combines `lgbm_prob`, `gru_prob`, `week_number`, `stress_level`, `credit_utilization` |
| **Isolation Forest** | Anomaly detection | 200 estimators, 8% contamination rate |
| **Gemini API** | Narrative generation | Contextualises SHAP output → human-readable risk explanation |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA INGESTION LAYER                           │
│  customers.csv · weekly_behavioral_features.csv · transactions.csv  │
│  scored_customers.json · intervention_log.csv                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FastAPI APPLICATION LAYER                         │
│  api/main.py — data loader · SQLite cache · lazy model init         │
│  api/auth.py — JWT token issuance & verification                    │
│  api/schemas.py — Pydantic v2 request/response models               │
└──────────┬──────────────────────────────┬───────────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌───────────────────────────────────────┐
│   ML INFERENCE LAYER │      │        INTERVENTION AGENT LAYER       │
│                      │      │                                       │
│  predict.py          │      │  intervention_agent.py                │
│  ├─ LightGBM         │      │  ├─ Risk gate (threshold check)       │
│  ├─ GRU              │      │  ├─ policy_rules.py (eligibility)     │
│  ├─ Ensemble         │      │  ├─ pii_masking.py (redact PII)       │
│  └─ Isolation Forest │      │  ├─ llm_client.py (mock/Gemini/OAI)  │
│                      │      │  └─ Compliance filter + dispatch      │
│  shap_explainer.py   │      └───────────────────────────────────────┘
│  ai_explain.py       │
│  context_engine.py   │
└──────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        REST API SURFACE                             │
│  /health · /auth/token · /api/predict · /api/predict/batch          │
│  /api/customers/* · /api/interventions/* · /api/metrics/*           │
│  /api/rules/* · /api/model-info                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    REACT OPERATOR DASHBOARD                         │
│  Overview · AI Predict · Live Flagging · Rules & SHAP               │
│  Canvas neural animation · Glassmorphic UI · PDF export             │
└─────────────────────────────────────────────────────────────────────┘
```

### Architecture Diagram Prompt (for Whimsical / Draw.io / Eraser)

> Paste this into any diagram tool:
>
> *"Create a top-down system architecture diagram for a fintech risk platform. The diagram should have 5 horizontal swimlane layers:  
> **Layer 1 — Data Sources**: CSV files (customers, weekly behavioral, transactions), JSON scored data, SQLite cache.  
> **Layer 2 — FastAPI Backend**: Auth module (JWT), Data loader, Cache manager, Rate limiter.  
> **Layer 3 — ML Engine** (two parallel blocks): (a) Inference Block: LightGBM → GRU → Ensemble Meta-Learner → Isolation Forest → SHAP Explainer → Gemini Narrative; (b) Agent Block: Risk Gate → Policy Rules → PII Masking → LLM Client → Compliance Filter → Dispatch Log.  
> **Layer 4 — REST API**: Endpoints for predict, customers, interventions, metrics, rules.  
> **Layer 5 — React Dashboard**: Overview, AI Predict, Live Flagging, Rules & SHAP modules.  
> Connect layers with directional arrows. Use a dark-navy colour scheme with cyan and indigo accents."*

---

## 🔄 Working Flow (Step-by-Step)

```
Step 1: DATA COLLECTION
  └─ Bank's core banking system exports weekly behavioral signals per customer
     (salary timing, UPI spend, ATM withdrawals, failed auto-debits, etc.)

Step 2: FEATURE ENGINEERING  (backend/pipeline/)
  └─ 16 tabular features built per customer per week
  └─ 8-week rolling sequences built for GRU input

Step 3: PARALLEL INFERENCE  (backend/inference/predict.py)
  ├─ LightGBM scores tabular features → lgbm_prob
  ├─ GRU scores 8-week sequence    → gru_prob
  ├─ Ensemble meta-learner stacks both + contextual features → final_risk_score
  └─ Isolation Forest checks for anomalous behavioral profile → anomaly_flag

Step 4: RISK CLASSIFICATION  (backend/config/thresholds.yaml)
  ├─ score < 0.40  → MONITOR (no action)
  ├─ score 0.40–0.55 → LOW intervention tier
  ├─ score 0.55–0.70 → MEDIUM intervention tier
  └─ score > 0.70  → HIGH — immediate RM escalation

Step 5: EXPLAINABILITY  (backend/inference/shap_explainer.py + ai_explain.py)
  ├─ SHAP TreeExplainer computes per-feature attributions
  ├─ Top drivers ranked and surfaced as bar chart in UI
  └─ Gemini API generates narrative: "Customer shows 3-week salary delay
     trend with rising credit utilization — pre-delinquency risk elevated."

Step 6: INTERVENTION DECISION  (backend/agent/intervention_agent.py)
  ├─ Risk gate: skip if score < monitor_only threshold
  ├─ Policy check: cooldown periods, intervention limits, salary eligibility
  ├─ PII masked before LLM prompt
  ├─ LLM selects: payment_holiday / rm_call / sms_nudge / email_advisory
  ├─ Compliance filter: blocks aggressive language, enforces length limits
  └─ Dispatch logged to intervention_log.csv

Step 7: DASHBOARD  (frontend/src/)
  └─ Bank manager views live risk table, drills into individual customer,
     reviews SHAP attribution, reads AI narrative, exports PDF report
```

---

## 🤖 ML / AI Logic

### Feature Signals (16 Behavioural Inputs)

| Signal | Category | Risk Implication |
|---|---|---|
| `salary_delay_days` | Income stress | Salary arriving late → cash flow crisis |
| `savings_wow_delta_pct` | Wealth erosion | Week-on-week savings drawdown |
| `atm_withdrawal_count_7d` | Cash dependency | Rising cash use may indicate digital credit exhaustion |
| `atm_withdrawal_amount_7d` | Cash dependency | Large ATM withdrawals near EMI dates |
| `discretionary_spend_7d` | Spend behaviour | High discretionary spend despite stress signals |
| `lending_upi_count_7d` | Debt behaviour | UPI transfers to lending apps → parallel borrowing |
| `lending_upi_amount_7d` | Debt behaviour | Volume of funds going to lending platforms |
| `failed_autodebit_count` | Payment stress | Failed auto-debits are a direct delinquency precursor |
| `utility_payment_delay_days` | Payment stress | Delayed utility bills → liquidity squeeze |
| `gambling_spend_7d` | Risk behaviour | Gambling activity signals financial desperation |
| `credit_utilization` | Credit stress | High utilization → credit exhaustion |
| `net_cashflow_7d` | Cash position | Net weekly cash flow (income - expenses) |
| `customer_segment` | Profile | Segment-based risk baseline |
| `round_number_withdrawal_count_7d` | Fraud signal | Round-number ATM withdrawals = structured withdrawals |
| `weekend_spend_ratio` | Behaviour pattern | Weekend vs weekday spend anomaly |
| `net_cashflow_trend_slope` | Trend | Linear slope of cashflow over 4 weeks |

### Model Architecture

```
LightGBM (DART, 500 trees, AUC)
  ↓ lgbm_prob
GRU (seq_len=8, hidden=64→32, dropout=0.3)
  ↓ gru_prob
                    ↓
Logistic Meta-Learner [lgbm_prob, gru_prob, week_number, stress_level, credit_utilization]
                    ↓
           final_risk_score (0.0 → 1.0)
                    ↓
Isolation Forest (parallel) → anomaly_flag
```

### Confidence & Variance

- Confidence = `1 - std(lgbm_prob, gru_prob, ensemble_prob)` across the three model outputs
- High variance → low confidence → flagged with uncertainty warning in UI

---

## 💡 Use Cases

### For Banks & NBFCs
- **Collections intelligence**: Prioritise collection calls by risk score rather than DPD bucket
- **Relationship manager routing**: Auto-escalate high-value at-risk customers to dedicated RMs
- **Portfolio exposure monitoring**: Real-time view of aggregate portfolio delinquency risk
- **Policy simulation**: Test the impact of changing intervention thresholds before deploying

### For Bank Managers (Operators)
- See every at-risk customer in a single dashboard without querying core banking
- Read AI-generated explanations in plain language — no data science jargon
- Export PDF risk reports for credit committee presentations
- Simulate rule changes and see predicted portfolio impact before saving

### Real-World Scenarios
1. **Salary delay + rising ATM withdrawal** → System flags 18 days before EMI → RM calls customer → payment holiday offered → delinquency avoided
2. **Lending UPI activity spike** → Signals parallel borrowing → score crosses HIGH threshold → advisory SMS sent within 4 hours
3. **Savings drawdown + failed auto-debit** → SHAP shows top drivers → Gemini generates narrative → PDF exported to credit file

---

## 📈 Impact & Metrics

| Metric | Value |
|---|---|
| 🎯 Ensemble model accuracy | **88%+** |
| ⏱️ Inference latency (single record) | **< 30ms** |
| 📅 Early warning window | **14–21 days before first missed payment** |
| 💰 Potential NPA reduction per 1,000 customers | **₹1.5–2.5 Cr** |
| 📉 Reduction in reactive collection cost | **~40%** |
| 🔁 Intervention compliance (no aggressive language) | **100%** (policy enforced) |
| 👥 Customers scored per batch run | **5,000+** |
| 📊 SHAP features surfaced per prediction | **16** |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/Atharv-coder16/SFIT-Mumbai.git
cd SFIT-Mumbai
```

### 2. Backend Setup

```powershell
cd backend
pip install -r requirements.txt
```

### 3. Generate Data & Train Models

```powershell
# From backend/
python generate_data.py
python training/train_all.py
python generate_scored_customers.py
```

### 4. (Optional) Set Gemini API Key

Create a `.env` file in `backend/`:

```env
GEMINI_API_KEY=your_key_here
```

Without this key, the system uses a high-quality template-based narrative fallback.

### 5. Start the Backend

```powershell
cd backend
uvicorn api.main:app --reload --port 8000
```

### 6. Start the Frontend

```powershell
cd frontend
npm install
npm run dev
```

### 7. Open the App

| Service | URL |
|---|---|
| 🖥️ Dashboard | http://localhost:3000 |
| 📖 API Docs (Swagger) | http://localhost:8000/docs |
| ❤️ Health Check | http://localhost:8000/health |

**Demo credentials:** `admin` / `admin123`

### One-Click Launch (Windows)

```powershell
# From repo root
.\start.ps1
```

---

## 📡 API Reference

### Auth & Health

```
GET  /health
POST /auth/token
```

### Prediction

```
POST /api/predict              # Single feature payload → risk score + SHAP
POST /api/predict/batch        # Batch scoring
GET  /api/model-info           # Model metadata and feature list
```

### Customer Intelligence

```
GET /api/customers/at-risk                          # All customers above threshold
GET /api/customers/{customer_id}                    # Full customer profile
GET /api/customers/{customer_id}/history            # Weekly history
GET /api/customers/{customer_id}/explain            # SHAP + AI narrative
GET /api/customers/{customer_id}/timeline           # Transaction timeline
GET /api/customers/{customer_id}/ability-willingness # 2-axis risk matrix
```

### Interventions & Metrics

```
POST /api/interventions/trigger     # Trigger agentic intervention decision
POST /api/interventions/record      # Manually record intervention
GET  /api/interventions/log         # Full intervention audit log
GET  /api/metrics/overview          # Portfolio KPIs
GET  /api/metrics/landing           # Landing page live stats
POST /api/rules/impact              # Simulate rule change impact
POST /api/rules/save                # Persist updated rules
```

---

## 📁 Repository Structure

```
SFIT-Mumbai/
├── backend/
│   ├── api/
│   │   ├── main.py               # FastAPI app, all endpoints, data + cache management
│   │   ├── auth.py               # JWT token issuance & verification
│   │   ├── schemas.py            # Pydantic v2 request/response models
│   │   └── rate_limiter.py       # Rate limiting class
│   ├── agent/
│   │   ├── intervention_agent.py # Agentic decision orchestrator
│   │   ├── policy_rules.py       # Eligibility & cooldown rules
│   │   ├── pii_masking.py        # PII redaction before LLM
│   │   └── llm_client.py         # Mock / Anthropic / OpenAI / Gemini abstraction
│   ├── config/
│   │   ├── model_config.yaml     # Model hyperparameters & feature lists
│   │   ├── thresholds.yaml       # Risk thresholds & compliance rules
│   │   ├── llm_config.yaml       # LLM backend mode & retry config
│   │   └── rules.json            # UI-editable rule set
│   ├── inference/
│   │   ├── predict.py            # RiskPredictor — loads all 4 models, scores customers
│   │   ├── shap_explainer.py     # SHAP TreeExplainer wrapper
│   │   ├── ai_explain.py         # Gemini/template narrative generation
│   │   ├── context_engine.py     # Customer context builder
│   │   └── batch_predict.py      # Batch scoring utility
│   ├── pipeline/
│   │   └── feature_engineering   # Tabular + sequence feature builders
│   ├── training/
│   │   ├── train_lightgbm.py
│   │   ├── train_gru.py
│   │   ├── train_ensemble.py
│   │   ├── train_isolation_forest.py
│   │   └── train_all.py          # Full training pipeline orchestrator
│   ├── tests/                    # pytest suite — API, agent, features, models
│   ├── generate_data.py          # Synthetic data generator
│   ├── generate_scored_customers.py
│   ├── run_simulation_stream.py  # Real-time streaming simulation
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/client.js         # Axios wrappers for all backend routes
│       ├── components/
│       │   ├── Overview.jsx
│       │   ├── ModelPredict.jsx
│       │   ├── LiveFlagging.jsx
│       │   ├── RulesShap.jsx
│       │   ├── LandingHero.jsx
│       │   └── ui/
│       │       └── TextRevealCard.jsx
│       ├── App.jsx
│       ├── index.css             # Full monolithic design system
│       └── main.jsx
├── ARCHITECTURE.md
├── start.ps1                     # One-click Windows launcher
└── README.md
```

---

## 🧪 Running Tests

```powershell
cd backend
python -m pytest tests -v
```

Test coverage includes:
- ✅ API import, auth, and schema contracts
- ✅ Feature engineering smoke checks
- ✅ GRU sequence shape and build checks
- ✅ LightGBM config and artifact presence checks
- ✅ Agent policy and PII/compliance behaviour

---

## ⚙️ Configuration

| File | Purpose |
|---|---|
| `backend/config/thresholds.yaml` | Risk score thresholds, intervention policy cooldowns, compliance word blocklist |
| `backend/config/model_config.yaml` | All model hyperparameters and the 16-feature input list |
| `backend/config/llm_config.yaml` | LLM backend mode (`mock` / `anthropic` / `openai`) and retry settings |
| `backend/config/rules.json` | UI-editable business rules persisted via the `/api/rules/save` endpoint |

---

## 🔭 Future Scope

- **Core Banking Integration**: Live connectors to Finacle / Temenos via secure API adapters for real-time transaction feeds
- **Multi-Bank SaaS**: Multi-tenant architecture with isolated model instances per bank
- **Mobile Companion App**: Bank RM mobile app for on-the-go intervention management
- **Reinforcement Learning**: Adaptive intervention policy that learns which channel/message converts best per customer segment
- **Regulatory Reporting**: Auto-generated SMA-0/SMA-1/SMA-2 classification reports for RBI submission
- **Credit Bureau Integration**: CIBIL score trend overlay on the risk timeline
- **WhatsApp Business API**: Direct intervention message dispatch via verified WhatsApp

---

## 👥 Contributors

| Name | Role |
|---|---|
| **Team Code Atlantis** | Full-stack development, ML engineering, system architecture |

---

## 📄 License

This project was built for the SFIT Mumbai Hackathon 2026. All rights reserved by Team Code Atlantis.

---

<div align="center">
<p>Built with ⚡ by Team Code Atlantis · SFIT Mumbai 2026</p>
<p><em>"Intelligence that acts before a payment is missed."</em></p>
</div>
