# PROJECT PULSE — Construction Intelligence Platform

A fully integrated full-stack construction cost and timeline prediction platform powered by **FastAPI**, **React (Vite + TypeScript + TailwindCSS)**, **scikit-learn**, and **SHAP**.

---

## 🏗️ Architecture Overview

```text
                 ┌────────────────────────────────┐
                 │         React Frontend         │
                 │   Vite + TailwindCSS + Recharts│
                 │       (9 Integrated Pages)     │
                 └───────────────┬────────────────┘
                                 │
                            REST API JSON
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │        FastAPI Backend         │
                 │                                │
                 │  - CORS Middleware             │
                 │  - Pydantic Validation         │
                 │  - In-Memory Dataset & Cache   │
                 │  - OpenAPI / Swagger Docs      │
                 └───────────────┬────────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
     Data Pipeline           ML Ensemble          Analytics
            │                    │                    │
     - Data Cleaning      - Cost Predictor      - Portfolio KPIs
     - Deduplication        (GradientBoost)     - Dimensions
     - Imputation         - Duration Predictor  - Correlations
     - Derived Metrics      (GradientBoost)     - Risk Indexing
                                 │
                                 ▼
                         TreeSHAP Explainer
                                 │
                                 ▼
                      Feature Attributions ($ / days)
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### 1. Start the FastAPI Backend

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server (Port 8000)
python -m uvicorn main:app --reload --port 8000
```

- Backend API: `http://localhost:8000`
- Interactive Swagger API Docs: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

---

### 2. Start the React Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server (Port 5173)
npm run dev
```

- Application UI: `http://localhost:5173`

---

## 📑 9 Integrated Modules

| # | Page | Endpoint | Description |
|---|---|---|---|
| 1 | **Data Center** | `POST /api/data/upload`<br>`POST /api/data/sample`<br>`GET /api/data/preview` | Upload CSV or load 3,000-project sample dataset. Runs deduplication, median imputation, and derived metrics calculation. |
| 2 | **Executive Dashboard** | `GET /api/analytics/portfolio` | Real-time portfolio KPIs, capital expenditure, on-budget compliance rates, terrain overruns, and high-risk flags. |
| 3 | **Performance & Drivers** | `GET /api/analytics/performance`<br>`GET /api/analytics/drivers` | Dynamic categorical slicing (terrain, type, region, complexity) and linear correlation analysis for cost drivers. |
| 4 | **Interactive Visualizations** | `GET /api/analytics/visualizations` | Quarterly capital timeline, project-type variances, land-scale elasticity scatter plots, and overrun histograms. |
| 5 | **AI Estimator** | `POST /api/prediction/train`<br>`POST /api/prediction/predict` | Train dual GradientBoostingRegressor models and predict cost & duration with real TreeSHAP feature attributions. |
| 6 | **Smart Resource Optimizer** | `POST /api/optimization/resources` | Discovers optimal crew size and equipment allocations across a multi-objective cost vs timeline trade-off surface. |
| 7 | **Sensitivity / What-If** | `POST /api/what-if` | Multi-point continuous parameter sweep evaluating marginal cost and schedule elasticity curves. |
| 8 | **Project Comparison** | `POST /api/projects/compare` | Multi-project side-by-side benchmarking matrix and comparative grouped bar charts (2–6 projects). |
| 9 | **Business Report** | `GET /api/reports/business`<br>`GET /api/reports/business/download` | Executive summary report synthesis with downloadable Markdown document and cleaned CSV export. |

---

## 🧪 Machine Learning Details

- **Cost Model**: `GradientBoostingRegressor(n_estimators=350, max_depth=3, learning_rate=0.05, subsample=0.9)`
- **Duration Model**: `GradientBoostingRegressor(n_estimators=350, max_depth=3, learning_rate=0.05, subsample=0.9)`
- **Preprocessing**: `StandardScaler` for continuous features, `OneHotEncoder(handle_unknown='ignore')` for categorical features in an integrated scikit-learn `Pipeline`.
- **Explainability**: `shap.TreeExplainer` computed over background sample distributions, producing dollar ($) and day contributions for each individual prediction.

---

## 🔒 Environment Variables

### Backend (`backend/.env` optional)
```env
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000/api
```

---

## 📦 Production Build

```bash
cd frontend
npm run build
```
Build output is generated in `frontend/dist/`.
