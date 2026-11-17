"""
Resource optimization endpoint using tree model surface search.
"""

from fastapi import APIRouter, HTTPException

from state import state
from schemas import OptimizationRequest, OptimizationResponse
from models.resource_optimizer import optimize_resources

router = APIRouter(prefix="/optimization", tags=["Optimization"])


@router.post("/resources", response_model=OptimizationResponse)
def optimize_project_resources(request: OptimizationRequest):
    """Find optimal labor and equipment allocations to minimize cost/time objective."""
    if not state.is_model_trained:
        raise HTTPException(status_code=400, detail="Models must be trained before running resource optimization.")

    fixed_attrs = {
        "land_area_sqft": request.land_area_sqft,
        "num_floors": request.num_floors,
        "material_cost_index": request.material_cost_index,
        "contractor_experience_years": request.contractor_experience_years,
        "project_type": request.project_type,
        "terrain_type": request.terrain_type,
        "region": request.region,
        "complexity_level": request.complexity_level,
        "season": request.season,
        "weather_risk": request.weather_risk,
        "labor_count": request.labor_count,
        "equipment_count": request.equipment_count,
    }

    try:
        opt_res = optimize_resources(
            cost_pipe=state.cost_pipe,
            duration_pipe=state.duration_pipe,
            fixed_attrs=fixed_attrs,
            priority=request.optimization_priority,
        )

        rec_labor = opt_res["recommended_labor_count"]
        rec_equip = opt_res["recommended_equipment_count"]

        # Generate contextual recommendation text
        if request.optimization_priority == "cost":
            recommendation = (
                f"A lean resource deployment ({rec_labor} workers, {rec_equip} heavy equipment units) "
                f"achieves maximum cost efficiency with an estimated cost change of {opt_res['cost_change_pct']:+.1f}% "
                f"relative to standard baseline crew."
            )
        elif request.optimization_priority == "timeline":
            recommendation = (
                f"A ramped resource configuration ({rec_labor} workers, {rec_equip} heavy equipment units) "
                f"optimizes critical path duration, reducing schedule by {abs(opt_res['duration_change_pct']):.1f}%."
            )
        else:
            recommendation = (
                f"A balanced deployment of {rec_labor} workers and {rec_equip} equipment units "
                f"strikes an optimal equilibrium between project expenditure (${opt_res['predicted_cost']:,.0f}) "
                f"and delivery timeline ({opt_res['predicted_duration_days']:.0f} days)."
            )

        return {
            "recommended_labor": rec_labor,
            "recommended_equipment": rec_equip,
            "predicted_cost": opt_res["predicted_cost"],
            "predicted_duration_days": opt_res["predicted_duration_days"],
            "baseline_cost": opt_res["baseline_predicted_cost"],
            "baseline_duration_days": opt_res["baseline_predicted_duration_days"],
            "cost_change_pct": opt_res["cost_change_pct"],
            "duration_change_pct": opt_res["duration_change_pct"],
            "recommendation": recommendation,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")
