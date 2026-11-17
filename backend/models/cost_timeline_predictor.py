"""
Project Cost & Timeline Prediction Models.

Two separate GradientBoostingRegressor models (cost tends to have different
drivers/scale than duration, so separate models generalize better than one
multi-output model here) sharing the same feature preprocessing.

Inputs (the "7-8 constraints"): project_type, terrain_type, region,
land_area_sqft, num_floors, complexity_level, labor_count, equipment_count,
material_cost_index, contractor_experience_years, season, weather_risk.
"""

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score, mean_absolute_percentage_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

CATEGORICAL_FEATURES = ["project_type", "terrain_type", "region",
                          "complexity_level", "season", "weather_risk"]
NUMERIC_FEATURES = ["land_area_sqft", "num_floors", "labor_count", "equipment_count",
                      "material_cost_index", "contractor_experience_years"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COST_MODEL_PATH = os.path.join(BASE_DIR, "cost_model.joblib")
TIME_MODEL_PATH = os.path.join(BASE_DIR, "duration_model.joblib")


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(transformers=[
        ("num", StandardScaler(), NUMERIC_FEATURES),
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
    ])
    model = GradientBoostingRegressor(
        n_estimators=350, max_depth=3, learning_rate=0.05,
        subsample=0.9, random_state=42,
    )
    return Pipeline(steps=[("preprocess", preprocessor), ("model", model)])


def _train_one(df, target, save_path=None):
    X = df[FEATURES]
    y = df[target]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pipe = build_pipeline()
    pipe.fit(X_train, y_train)
    preds = pipe.predict(X_test)

    metrics = {
        "mae": mean_absolute_error(y_test, preds),
        "r2": r2_score(y_test, preds),
        "mape": mean_absolute_percentage_error(y_test, preds) * 100,
        "n_train": len(X_train), "n_test": len(X_test),
    }
    if save_path:
        joblib.dump({"pipeline": pipe, "features": FEATURES}, save_path)
    return pipe, metrics


def train_cost_model(df, save: bool = True):
    return _train_one(df, "actual_cost", COST_MODEL_PATH if save else None)


def train_duration_model(df, save: bool = True):
    return _train_one(df, "actual_duration_days", TIME_MODEL_PATH if save else None)


def load_model(path: str):
    return joblib.load(path)


def predict_single(cost_pipe, duration_pipe, land_area_sqft, num_floors, labor_count,
                    equipment_count, material_cost_index, contractor_experience_years,
                    project_type, terrain_type, region, complexity_level, season, weather_risk):
    row = pd.DataFrame([{
        "land_area_sqft": land_area_sqft, "num_floors": num_floors,
        "labor_count": labor_count, "equipment_count": equipment_count,
        "material_cost_index": material_cost_index,
        "contractor_experience_years": contractor_experience_years,
        "project_type": project_type, "terrain_type": terrain_type,
        "region": region, "complexity_level": complexity_level,
        "season": season, "weather_risk": weather_risk,
    }])
    predicted_cost = float(cost_pipe.predict(row)[0])
    predicted_duration = float(duration_pipe.predict(row)[0])
    return {"predicted_cost": predicted_cost, "predicted_duration_days": predicted_duration}


if __name__ == "__main__":
    import sys
    sys.path.append(".")
    from utils.data_processing import load_and_clean, add_derived_metrics

    df = load_and_clean("data/construction_projects_raw.csv")
    df = add_derived_metrics(df)

    cost_pipe, cost_metrics = train_cost_model(df)
    print("Cost model metrics:", cost_metrics)

    dur_pipe, dur_metrics = train_duration_model(df)
    print("Duration model metrics:", dur_metrics)
