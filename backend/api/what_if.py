"""
Sensitivity & What-If parameter sweep endpoint.
"""

from typing import List
import numpy as np
from fastapi import APIRouter, HTTPException

from state import state
from schemas import WhatIfRequest, WhatIfPoint
from models.cost_timeline_predictor import predict_single

router = APIRouter(prefix="/what-if", tags=["What-If"])


@router.post("", response_model=List[WhatIfPoint])
def run_what_if_analysis(request: WhatIfRequest):
    """Evaluate predicted cost & timeline response curves as a chosen variable is swept over a range."""
    if not state.is_model_trained:
        raise HTTPException(status_code=400, detail="Models must be trained before performing What-If analysis.")

    if request.minimum >= request.maximum:
        raise HTTPException(status_code=422, detail="Minimum value must be strictly less than maximum value.")

    values = np.linspace(request.minimum, request.maximum, request.steps)
    base = request.base_project

    results: List[WhatIfPoint] = []

    for val in values:
        current_val = float(val)
        land_area = current_val if request.variable == "land_area_sqft" else base.land_area_sqft
        labor_cnt = int(round(current_val)) if request.variable == "labor_count" else base.labor_count
        exp_years = int(round(current_val)) if request.variable == "contractor_experience_years" else base.contractor_experience_years

        pred = predict_single(
            cost_pipe=state.cost_pipe,
            duration_pipe=state.duration_pipe,
            land_area_sqft=land_area,
            num_floors=base.num_floors,
            labor_count=labor_cnt,
            equipment_count=base.equipment_count,
            material_cost_index=base.material_cost_index,
            contractor_experience_years=exp_years,
            project_type=base.project_type,
            terrain_type=base.terrain_type,
            region=base.region,
            complexity_level=base.complexity_level,
            season=base.season,
            weather_risk=base.weather_risk,
        )

        results.append(
            WhatIfPoint(
                value=round(current_val, 2),
                predicted_cost=round(float(pred["predicted_cost"]), 2),
                predicted_duration=round(float(pred["predicted_duration_days"]), 1),
            )
        )

    return results
