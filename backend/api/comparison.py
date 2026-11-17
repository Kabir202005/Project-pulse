"""
Project Comparison endpoints for multi-project side-by-side benchmarking.
"""

from typing import List
from fastapi import APIRouter, HTTPException

from state import state
from schemas import ComparisonRequest, ComparisonResponse, ComparisonProject

router = APIRouter(prefix="/projects", tags=["Comparison"])


@router.get("/ids", response_model=List[str])
def get_available_project_ids():
    """Get list of all project IDs loaded in the current dataset."""
    if not state.is_data_loaded:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload or load sample data first.")
    return state.df["project_id"].astype(str).tolist()


@router.post("/compare", response_model=ComparisonResponse)
def compare_projects(request: ComparisonRequest):
    """Compare 2 to 6 specific projects side-by-side across cost, timeline, and physical parameters."""
    if not state.is_data_loaded:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload or load sample data first.")

    if len(request.project_ids) < 2 or len(request.project_ids) > 6:
        raise HTTPException(status_code=422, detail="Comparison requires between 2 and 6 projects.")

    df = state.df
    matched_df = df[df["project_id"].isin(request.project_ids)]

    if matched_df.empty:
        raise HTTPException(status_code=404, detail="None of the specified project IDs were found in the dataset.")

    projects = []
    for _, row in matched_df.iterrows():
        projects.append(
            ComparisonProject(
                project_id=str(row["project_id"]),
                project_type=str(row["project_type"]),
                terrain_type=str(row["terrain_type"]),
                region=str(row["region"]),
                complexity_level=str(row["complexity_level"]),
                planned_cost=round(float(row["planned_cost"]), 2),
                actual_cost=round(float(row["actual_cost"]), 2),
                cost_overrun_pct=round(float(row["cost_overrun_pct"]), 2),
                planned_duration_days=round(float(row["planned_duration_days"]), 1),
                actual_duration_days=round(float(row["actual_duration_days"]), 1),
                schedule_overrun_pct=round(float(row["schedule_overrun_pct"]), 2),
                land_area_sqft=round(float(row["land_area_sqft"]), 2),
                num_floors=int(row["num_floors"]),
                labor_count=int(row["labor_count"]),
                equipment_count=int(row["equipment_count"]),
            )
        )

    return {"projects": projects}
