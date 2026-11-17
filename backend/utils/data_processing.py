"""
Data cleaning + engineered metrics for the project cost & timeline predictor.
"""

import numpy as np
import pandas as pd

REQUIRED_COLUMNS = [
    "project_id", "project_type", "terrain_type", "region", "land_area_sqft",
    "num_floors", "complexity_level", "labor_count", "equipment_count",
    "material_cost_index", "contractor_experience_years", "season",
    "weather_risk", "start_date", "planned_duration_days", "planned_cost",
    "actual_duration_days", "actual_cost",
]


def load_and_clean(path_or_buffer) -> pd.DataFrame:
    df = pd.read_csv(path_or_buffer)

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    before = len(df)
    df = df.drop_duplicates(subset=[c for c in df.columns if c != "project_id"])
    df = df.drop_duplicates(subset="project_id", keep="first")
    n_dupes = before - len(df)

    df["start_date"] = pd.to_datetime(df["start_date"], errors="coerce")

    numeric_cols = ["land_area_sqft", "num_floors", "labor_count", "equipment_count",
                     "material_cost_index", "contractor_experience_years",
                     "planned_duration_days", "planned_cost",
                     "actual_duration_days", "actual_cost"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    n_missing_cost = df["actual_cost"].isna().sum()
    n_missing_exp = df["contractor_experience_years"].isna().sum()

    group_cols = ["project_type", "terrain_type", "complexity_level"]
    for col in ["actual_cost", "contractor_experience_years"]:
        df[col] = df.groupby(group_cols)[col].transform(lambda s: s.fillna(s.median()))
        df[col] = df[col].fillna(df[col].median())

    for col in ["land_area_sqft", "labor_count", "planned_cost", "actual_cost",
                "planned_duration_days", "actual_duration_days"]:
        df = df[df[col] > 0]

    df = df.reset_index(drop=True)
    df.attrs["n_duplicates_removed"] = n_dupes
    df.attrs["n_cost_imputed"] = int(n_missing_cost)
    df.attrs["n_experience_imputed"] = int(n_missing_exp)
    return df


def add_derived_metrics(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    eps = 1e-9

    df["cost_overrun_pct"] = (df["actual_cost"] - df["planned_cost"]) / (df["planned_cost"] + eps) * 100
    df["schedule_overrun_pct"] = ((df["actual_duration_days"] - df["planned_duration_days"])
                                    / (df["planned_duration_days"] + eps) * 100)
    df["cost_per_sqft"] = df["actual_cost"] / (df["land_area_sqft"] + eps)
    df["labor_per_1000sqft"] = df["labor_count"] / (df["land_area_sqft"] / 1000 + eps)
    df["duration_per_floor"] = df["actual_duration_days"] / (df["num_floors"] + eps)
    df["on_budget"] = df["cost_overrun_pct"] <= 10
    df["on_schedule"] = df["schedule_overrun_pct"] <= 10

    for col in ["cost_overrun_pct", "schedule_overrun_pct", "cost_per_sqft"]:
        upper = df[col].quantile(0.995)
        df[col] = df[col].clip(upper=upper)

    return df


def portfolio_summary(df: pd.DataFrame) -> dict:
    return {
        "n_projects": len(df),
        "total_planned_cost": df["planned_cost"].sum(),
        "total_actual_cost": df["actual_cost"].sum(),
        "avg_cost_overrun_pct": df["cost_overrun_pct"].mean(),
        "avg_schedule_overrun_pct": df["schedule_overrun_pct"].mean(),
        "pct_on_budget": df["on_budget"].mean() * 100,
        "pct_on_schedule": df["on_schedule"].mean() * 100,
        "avg_cost_per_sqft": df["cost_per_sqft"].mean(),
        "avg_actual_duration": df["actual_duration_days"].mean(),
    }


def group_performance(df: pd.DataFrame, group_col: str) -> pd.DataFrame:
    agg = df.groupby(group_col).agg(
        projects=("project_id", "count"),
        avg_cost_overrun_pct=("cost_overrun_pct", "mean"),
        avg_schedule_overrun_pct=("schedule_overrun_pct", "mean"),
        avg_actual_cost=("actual_cost", "mean"),
        avg_actual_duration=("actual_duration_days", "mean"),
        avg_cost_per_sqft=("cost_per_sqft", "mean"),
    ).reset_index().sort_values("avg_cost_overrun_pct", ascending=False)
    return agg


def flag_high_risk(df: pd.DataFrame, overrun_threshold_pct: float = None):
    if overrun_threshold_pct is None:
        overrun_threshold_pct = df["cost_overrun_pct"].quantile(0.75)
    flagged = df[df["cost_overrun_pct"] >= overrun_threshold_pct].sort_values(
        "cost_overrun_pct", ascending=False)
    return flagged, overrun_threshold_pct
