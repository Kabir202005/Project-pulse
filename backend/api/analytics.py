"""
Analytics endpoints: Portfolio KPIs, Performance by dimension, Drivers/Correlations, Visualizations.
"""

from typing import Optional
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from state import state
from schemas import PortfolioResponse, PerformanceResponse, DriversResponse, VisualizationsResponse
from utils.data_processing import portfolio_summary, group_performance, flag_high_risk

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/portfolio", response_model=PortfolioResponse)
def get_portfolio():
    """Get high-level executive dashboard metrics, risk flaggings, and terrain/complexity breakdowns."""
    if not state.is_data_loaded:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload or load sample data first.")

    df = state.df
    s = portfolio_summary(df)

    terrain_df = group_performance(df, "terrain_type")
    complexity_df = group_performance(df, "complexity_level")
    flagged, threshold = flag_high_risk(df)

    risk_cols = [
        "project_id", "project_type", "terrain_type", "complexity_level",
        "planned_cost", "actual_cost", "cost_overrun_pct", "schedule_overrun_pct"
    ]
    high_risk_list = flagged[risk_cols].head(25).to_dict(orient="records")

    return {
        "total_projects": int(s["n_projects"]),
        "planned_cost": round(float(s["total_planned_cost"]), 2),
        "actual_cost": round(float(s["total_actual_cost"]), 2),
        "avg_cost_overrun": round(float(s["avg_cost_overrun_pct"]), 2),
        "avg_schedule_overrun": round(float(s["avg_schedule_overrun_pct"]), 2),
        "on_budget_rate": round(float(s["pct_on_budget"]), 1),
        "on_schedule_rate": round(float(s["pct_on_schedule"]), 1),
        "avg_cost_per_sqft": round(float(s["avg_cost_per_sqft"]), 2),
        "terrain_overruns": terrain_df.to_dict(orient="records"),
        "complexity_overruns": complexity_df.to_dict(orient="records"),
        "high_risk_projects": high_risk_list,
        "high_risk_threshold": round(float(threshold), 2),
    }


@router.get("/performance", response_model=PerformanceResponse)
def get_performance(
    dimension: str = Query("terrain_type", description="Grouping dimension: project_type, terrain_type, region, complexity_level, season, weather_risk")
):
    """Get grouped performance metrics along a specific categorical dimension."""
    if not state.is_data_loaded:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload or load sample data first.")

    valid_dims = ["project_type", "terrain_type", "region", "complexity_level", "season", "weather_risk"]
    if dimension not in valid_dims:
        raise HTTPException(status_code=400, detail=f"Invalid dimension '{dimension}'. Valid dimensions: {', '.join(valid_dims)}")

    perf = group_performance(state.df, dimension)
    return {
        "dimension": dimension,
        "data": perf.to_dict(orient="records")
    }


@router.get("/drivers", response_model=DriversResponse)
def get_drivers():
    """Get linear correlation between numeric features and cost overrun."""
    if not state.is_data_loaded:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload or load sample data first.")

    df = state.df
    numeric_cols = [
        "land_area_sqft", "num_floors", "labor_count", "equipment_count",
        "material_cost_index", "contractor_experience_years", "cost_overrun_pct"
    ]
    numeric_df = df[numeric_cols].dropna()
    corr_series = numeric_df.corr()["cost_overrun_pct"].drop("cost_overrun_pct").sort_values(ascending=False)

    feature_labels = {
        "land_area_sqft": "Land Area (sqft)",
        "num_floors": "Number of Floors",
        "labor_count": "Labor Count",
        "equipment_count": "Equipment Count",
        "material_cost_index": "Material Cost Index",
        "contractor_experience_years": "Contractor Experience (Years)",
    }

    correlations = [
        {
            "feature": feature_labels.get(feat, feat),
            "raw_feature": feat,
            "correlation": round(float(val), 4),
            "impact": "positive" if val > 0 else "negative",
        }
        for feat, val in corr_series.items()
    ]

    return {"correlations": correlations}


@router.get("/visualizations", response_model=VisualizationsResponse)
def get_visualizations():
    """Get pre-computed chart datasets for Interactive Visualizations page."""
    if not state.is_data_loaded:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload or load sample data first.")

    df = state.df.copy()

    # 1. Quarterly planned vs actual cost
    df_quarterly = df.copy()
    if not pd.api.types.is_datetime64_any_dtype(df_quarterly["start_date"]):
        df_quarterly["start_date"] = pd.to_datetime(df_quarterly["start_date"], errors="coerce")

    quarterly_data = []
    if df_quarterly["start_date"].notna().any():
        df_valid_dates = df_quarterly.dropna(subset=["start_date"]).set_index("start_date")
        resampled = df_valid_dates.resample("QE").agg({
            "planned_cost": "sum",
            "actual_cost": "sum"
        }).reset_index()
        for _, row in resampled.iterrows():
            period_str = f"Q{row['start_date'].quarter} {row['start_date'].year}"
            quarterly_data.append({
                "quarter": period_str,
                "date": str(row["start_date"].date()),
                "planned_cost": round(float(row["planned_cost"]), 2),
                "actual_cost": round(float(row["actual_cost"]), 2),
            })

    # 2. Project type overruns
    ptype_perf = group_performance(df, "project_type").sort_values("avg_cost_overrun_pct")
    project_type_overruns = ptype_perf.to_dict(orient="records")

    # 3. Land area vs actual cost (sample for fast rendering if large)
    sample_size = min(300, len(df))
    sample_df = df.sample(sample_size, random_state=42) if len(df) > 300 else df
    land_vs_cost = [
        {
            "project_id": r["project_id"],
            "land_area_sqft": float(r["land_area_sqft"]),
            "actual_cost": float(r["actual_cost"]),
            "terrain_type": r["terrain_type"],
            "cost_overrun_pct": round(float(r["cost_overrun_pct"]), 1),
        }
        for _, r in sample_df.iterrows()
    ]

    # 4. Labor vs actual duration
    labor_vs_duration = [
        {
            "project_id": r["project_id"],
            "labor_count": int(r["labor_count"]),
            "actual_duration_days": float(r["actual_duration_days"]),
            "cost_overrun_pct": round(float(r["cost_overrun_pct"]), 1),
            "complexity_level": r["complexity_level"],
        }
        for _, r in sample_df.iterrows()
    ]

    # 5. Overrun distribution (histogram bins)
    counts, bin_edges = np.histogram(df["cost_overrun_pct"].dropna(), bins=25)
    overrun_distribution = [
        {
            "bin_range": f"{round(bin_edges[i], 1)}% to {round(bin_edges[i+1], 1)}%",
            "bin_start": round(float(bin_edges[i]), 1),
            "bin_end": round(float(bin_edges[i+1]), 1),
            "bin_center": round(float((bin_edges[i] + bin_edges[i+1]) / 2), 1),
            "count": int(counts[i]),
        }
        for i in range(len(counts))
    ]

    return {
        "quarterly_costs": quarterly_data,
        "project_type_overruns": project_type_overruns,
        "land_vs_cost": land_vs_cost,
        "labor_vs_duration": labor_vs_duration,
        "overrun_distribution": overrun_distribution,
    }
