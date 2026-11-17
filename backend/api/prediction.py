"""
Prediction endpoints: ML Model Training, Status, and Prediction with SHAP explainability.
"""

from datetime import datetime
import pandas as pd
from fastapi import APIRouter, HTTPException

from state import state
from schemas import (
    TrainResponse, ModelStatusResponse, PredictionRequest,
    PredictionResponse, ShapFactor
)
from models.cost_timeline_predictor import (
    train_cost_model, train_duration_model, predict_single,
    NUMERIC_FEATURES, CATEGORICAL_FEATURES, FEATURES
)
from utils.explainability import build_explainer, explain_single

router = APIRouter(prefix="/prediction", tags=["Prediction"])


@router.post("/train", response_model=TrainResponse)
def train_models():
    """Train GradientBoostingRegressor models for cost and duration on the loaded dataset."""
    if not state.is_data_loaded:
        raise HTTPException(status_code=400, detail="No dataset loaded to train models on.")

    try:
        df = state.df
        cost_pipe, cost_metrics = train_cost_model(df, save=True)
        dur_pipe, dur_metrics = train_duration_model(df, save=True)

        feat_df = df[FEATURES]
        cost_explainer = build_explainer(cost_pipe, feat_df)
        dur_explainer = build_explainer(dur_pipe, feat_df)

        state.cost_pipe = cost_pipe
        state.duration_pipe = dur_pipe
        state.cost_metrics = {
            "r2": round(float(cost_metrics["r2"]), 4),
            "mape": round(float(cost_metrics["mape"]), 2),
            "mae": round(float(cost_metrics["mae"]), 2),
        }
        state.duration_metrics = {
            "r2": round(float(dur_metrics["r2"]), 4),
            "mape": round(float(dur_metrics["mape"]), 2),
            "mae": round(float(dur_metrics["mae"]), 2),
        }
        state.cost_explainer = cost_explainer
        state.duration_explainer = dur_explainer
        state.last_trained = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        return {
            "success": True,
            "cost_model": state.cost_metrics,
            "duration_model": state.duration_metrics,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")


@router.get("/status", response_model=ModelStatusResponse)
def get_model_status():
    """Get current training status, metrics, and timestamp of the ML models."""
    return {
        "trained": state.is_model_trained,
        "last_trained": state.last_trained,
        "model_version": "GradientBoostingRegressor v1.2 (scikit-learn)",
    }


@router.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    """Predict project cost and duration, and compute SHAP feature importance factors."""
    if not state.is_model_trained:
        raise HTTPException(status_code=400, detail="Models have not been trained yet. Please train models first.")

    try:
        # Run real prediction
        pred_res = predict_single(
            cost_pipe=state.cost_pipe,
            duration_pipe=state.duration_pipe,
            land_area_sqft=request.land_area_sqft,
            num_floors=request.num_floors,
            labor_count=request.labor_count,
            equipment_count=request.equipment_count,
            material_cost_index=request.material_cost_index,
            contractor_experience_years=request.contractor_experience_years,
            project_type=request.project_type,
            terrain_type=request.terrain_type,
            region=request.region,
            complexity_level=request.complexity_level,
            season=request.season,
            weather_risk=request.weather_risk,
        )

        # Single row dataframe for SHAP calculation
        row = pd.DataFrame([{
            "land_area_sqft": request.land_area_sqft,
            "num_floors": request.num_floors,
            "labor_count": request.labor_count,
            "equipment_count": request.equipment_count,
            "material_cost_index": request.material_cost_index,
            "contractor_experience_years": request.contractor_experience_years,
            "project_type": request.project_type,
            "terrain_type": request.terrain_type,
            "region": request.region,
            "complexity_level": request.complexity_level,
            "season": request.season,
            "weather_risk": request.weather_risk,
        }])

        cost_exp = explain_single(state.cost_pipe, state.cost_explainer, row, top_k=6, unit="$")
        dur_exp = explain_single(state.duration_pipe, state.duration_explainer, row, top_k=6, unit="days")

        cost_shap = [
            ShapFactor(
                feature=item["feature"],
                value=float(item["impact"]),
                direction="positive" if item["impact"] > 0 else "negative"
            )
            for item in cost_exp["top_factors"]
        ]

        dur_shap = [
            ShapFactor(
                feature=item["feature"],
                value=float(item["impact"]),
                direction="positive" if item["impact"] > 0 else "negative"
            )
            for item in dur_exp["top_factors"]
        ]

        return {
            "predicted_cost": round(float(pred_res["predicted_cost"]), 2),
            "predicted_duration_days": round(float(pred_res["predicted_duration_days"]), 1),
            "cost_baseline": round(float(cost_exp["base_value"]), 2),
            "duration_baseline": round(float(dur_exp["base_value"]), 1),
            "cost_shap": cost_shap,
            "duration_shap": dur_shap,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
