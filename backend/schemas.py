"""
Pydantic schemas for request / response validation.
"""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


# ── Auth ──────────────────────────────────────────────────────────────

class SendOtpRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)


class SendOtpResponse(BaseModel):
    success: bool
    message: str
    dev_otp: Optional[str] = None


class VerifyOtpRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    otp: str = Field(..., min_length=4, max_length=10)


class AuthResponse(BaseModel):
    success: bool
    token: str
    email: str
    message: str


class UserResponse(BaseModel):
    authenticated: bool
    email: Optional[str] = None


# ── Data ──────────────────────────────────────────────────────────────

class DataUploadResponse(BaseModel):
    success: bool
    raw_rows: int
    cleaned_rows: int
    duplicates_removed: int
    cost_imputations: int
    experience_imputations: int
    columns: list[str]
    preview: list[dict[str, Any]]


class DataPreviewResponse(BaseModel):
    page: int
    page_size: int
    total_rows: int
    total_pages: int
    data: list[dict[str, Any]]


# ── Analytics ─────────────────────────────────────────────────────────

class PortfolioResponse(BaseModel):
    total_projects: int
    planned_cost: float
    actual_cost: float
    avg_cost_overrun: float
    avg_schedule_overrun: float
    on_budget_rate: float
    on_schedule_rate: float
    avg_cost_per_sqft: float
    terrain_overruns: list[dict[str, Any]]
    complexity_overruns: list[dict[str, Any]]
    high_risk_projects: list[dict[str, Any]]
    high_risk_threshold: float


class PerformanceResponse(BaseModel):
    dimension: str
    data: list[dict[str, Any]]


class DriversResponse(BaseModel):
    correlations: list[dict[str, Any]]


class VisualizationsResponse(BaseModel):
    quarterly_costs: list[dict[str, Any]]
    project_type_overruns: list[dict[str, Any]]
    land_vs_cost: list[dict[str, Any]]
    labor_vs_duration: list[dict[str, Any]]
    overrun_distribution: list[dict[str, Any]]


# ── Prediction ────────────────────────────────────────────────────────

class TrainResponse(BaseModel):
    success: bool
    cost_model: dict[str, float]
    duration_model: dict[str, float]


class ModelStatusResponse(BaseModel):
    trained: bool
    last_trained: Optional[str] = None
    model_version: Optional[str] = None


class PredictionRequest(BaseModel):
    project_type: str
    terrain_type: str
    region: str
    complexity_level: str
    season: str
    weather_risk: str
    land_area_sqft: float = Field(gt=0)
    num_floors: int = Field(ge=1)
    labor_count: int = Field(ge=1)
    equipment_count: int = Field(ge=1)
    material_cost_index: float = Field(gt=0)
    contractor_experience_years: int = Field(ge=0)


class ShapFactor(BaseModel):
    feature: str
    value: float
    direction: str


class PredictionResponse(BaseModel):
    predicted_cost: float
    predicted_duration_days: float
    cost_baseline: float
    duration_baseline: float
    cost_shap: list[ShapFactor]
    duration_shap: list[ShapFactor]


# ── Optimization ──────────────────────────────────────────────────────

class OptimizationRequest(BaseModel):
    project_type: str
    terrain_type: str
    region: str
    complexity_level: str
    season: str
    weather_risk: str
    land_area_sqft: float = Field(gt=0)
    num_floors: int = Field(ge=1)
    material_cost_index: float = Field(gt=0)
    contractor_experience_years: int = Field(ge=0)
    labor_count: int = Field(ge=1, default=50)
    equipment_count: int = Field(ge=1, default=5)
    optimization_priority: str = Field(default="balanced", pattern="^(cost|timeline|balanced)$")


class OptimizationResponse(BaseModel):
    recommended_labor: int
    recommended_equipment: int
    predicted_cost: float
    predicted_duration_days: float
    baseline_cost: float
    baseline_duration_days: float
    cost_change_pct: float
    duration_change_pct: float
    recommendation: str


# ── What-If ───────────────────────────────────────────────────────────

class WhatIfRequest(BaseModel):
    base_project: PredictionRequest
    variable: str = Field(pattern="^(labor_count|land_area_sqft|contractor_experience_years)$")
    minimum: float
    maximum: float
    steps: int = Field(ge=2, le=100, default=20)


class WhatIfPoint(BaseModel):
    value: float
    predicted_cost: float
    predicted_duration: float


# ── Comparison ────────────────────────────────────────────────────────

class ComparisonRequest(BaseModel):
    project_ids: list[str] = Field(min_length=2, max_length=6)


class ComparisonProject(BaseModel):
    project_id: str
    project_type: str
    terrain_type: str
    region: str
    complexity_level: str
    planned_cost: float
    actual_cost: float
    cost_overrun_pct: float
    planned_duration_days: float
    actual_duration_days: float
    schedule_overrun_pct: float
    land_area_sqft: float
    num_floors: int
    labor_count: int
    equipment_count: int


class ComparisonResponse(BaseModel):
    projects: list[ComparisonProject]


# ── Reports ───────────────────────────────────────────────────────────

class ReportSection(BaseModel):
    title: str
    items: list[str]


class BusinessReportResponse(BaseModel):
    portfolio_summary: dict[str, Any]
    best_terrain: dict[str, Any]
    worst_terrain: dict[str, Any]
    high_risk_count: int
    sections: list[ReportSection]
    generated_at: str
