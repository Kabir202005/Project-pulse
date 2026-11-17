# Predicting Project Cost & Timeline

An end-to-end analytics + ML platform for construction/civil-engineering
project estimation. Answers:
- How much will this project actually cost, and how long will it take?
- Which factors (terrain, complexity, labor, weather, etc.) drive overruns?
- Which past projects were highest-risk, and why?
- How should labor & equipment be allocated to hit a cost or schedule target?

## The 8 constraints/inputs

1. Project type (Residential / Commercial / Industrial / Infrastructure / Institutional)
2. Terrain type (Flat / Hilly / Rocky / Wetland / Sandy-Coastal)
3. Region
4. Land area (sqft)
5. Number of floors
6. Complexity level (Low / Medium / High / Very High)
7. Labor count
8. Equipment count
9. Material cost index
10. Contractor experience (years)
11. Season
12. Weather risk

(More than 8, but these are the "constraints" you described — trim any you
don't need in your writeup; the code doesn't require using all of them.)

## Features

| Area | What it does |
|---|---|
| **Data upload & cleaning** | Upload your own project CSV or use the bundled synthetic sample. Deduplicates, fixes types, imputes missing values, drops impossible rows |
| **Dashboard** | Cost/schedule overrun %, % on-budget, % on-schedule, cost/sqft + overrun-by-terrain and overrun-by-complexity charts + high-risk project list |
| **Project analysis** | Group performance by project type / terrain / region / complexity / season / weather, plus correlation view of overrun drivers |
| **Visualizations** | Planned vs. actual cost trend, overrun by project type, land area vs. cost, labor vs. duration, overrun distribution |
| **Cost & Timeline prediction (ML)** | Two GradientBoostingRegressor models — one predicts final cost, one predicts final duration — from the 12 inputs above |
| **Explainable AI** | SHAP-based breakdown for *both* predictions: which factors pushed cost/timeline up or down, and by how much |
| **Resource optimizer** | Grid search over labor/equipment counts to minimize cost, minimize timeline, or balance both, for a fixed project scope |
| **What-if analysis** | Sweep labor count, land area, or contractor experience and see predicted cost/duration change in real time |
| **Project comparison** | Side-by-side metrics for any set of projects |
| **Business report** | Auto-generated markdown summary + downloadable cleaned dataset |

## Setup (macOS / Windows / Linux)

```bash
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

Open the local URL Streamlit prints (usually `http://localhost:8501`).

## Using it

1. **Data Upload & Cleaning** — click "Load bundled sample dataset."
2. **Dashboard / Project Analysis / Visualizations** — explore immediately.
3. **Cost & Timeline Prediction** — click "Train prediction models" once per session. Unlocks Resource Optimizer and What-If Analysis.
4. **Resource Optimizer** — set a project's scope and pick a priority (cost / time / balanced) to get a labor & equipment recommendation.

## About the sample dataset

`data/construction_projects_raw.csv` is **synthetically generated**
(`data/generate_data.py`) in the style of public construction-cost-estimation
datasets. It's built so that:
- terrain, complexity, season, and weather multiplicatively affect both cost and duration (matches real-world overrun literature — median overrun in the sample is ~35% cost / ~46% schedule, in line with published construction industry benchmarks),
- labor & equipment count have a genuine two-sided trade-off: more crew shortens the timeline (with diminishing returns) but costs more per day, while a longer timeline itself accrues more labor/equipment cost — this is what makes the Resource Optimizer's search meaningful instead of just picking a boundary value.

Swap in a real dataset via the upload page any time — as long as it has the
required columns, everything downstream works unchanged.

## Project structure

```
project-cost-timeline-predictor/
├── app.py                          # Streamlit app (all 9 pages)
├── data/
│   ├── generate_data.py            # synthetic dataset generator
│   └── construction_projects_raw.csv
├── models/
│   ├── cost_timeline_predictor.py  # training + inference for both targets
│   ├── resource_optimizer.py       # grid-search labor/equipment optimizer
│   ├── cost_model.joblib           # pretrained cost model
│   └── duration_model.joblib       # pretrained duration model
├── utils/
│   ├── data_processing.py          # cleaning + derived metrics
│   └── explainability.py           # SHAP wrapper (works for either model)
└── requirements.txt
```

## Notes for your writeup / viva

- **Why two separate models instead of one multi-output model?** Cost and duration have different scales and, in reality, partly different drivers (e.g. material_cost_index matters a lot for cost, barely for duration). Two specialized models generally outperform one shared model on scikit-learn's GradientBoostingRegressor, which doesn't natively support multi-output.
- **Why R² is much higher here (~0.93) than a typical marketing-ROI model** would be: cost and duration in construction are driven substantially by measurable physical/logistical factors (scope, terrain, crew size) rather than pure market noise — a high R² here is expected and defensible, not a sign of leakage, provided train/test split is respected (which it is).
- **Why grid search instead of gradient-based optimization for the resource optimizer?** Gradient-boosted trees produce a stair-step prediction surface; local optimizers like SLSQP/Nelder-Mead can get stuck with zero apparent gradient. Grid search reliably finds the true best point on that surface.
- **Extending this:** add a time-series/seasonality forecast for material cost index, add a Monte-Carlo risk simulation (cost/schedule confidence intervals instead of point estimates), or connect to a real regional construction-cost API.
