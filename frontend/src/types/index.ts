export interface User {
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  dev_otp?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  token: string;
  email: string;
  message: string;
}

export interface UserResponse {
  authenticated: boolean;
  email: string | null;
}

export interface DataCleaningStats {
  raw_rows: number;
  cleaned_rows: number;
  duplicates_removed: number;
  cost_imputations: number;
  experience_imputations: number;
  columns?: string[];
}

export interface DataUploadResponse {
  success: boolean;
  raw_rows: number;
  cleaned_rows: number;
  duplicates_removed: number;
  cost_imputations: number;
  experience_imputations: number;
  columns: string[];
  preview: Record<string, any>[];
}

export interface DataPreviewResponse {
  page: number;
  page_size: number;
  total_rows: number;
  total_pages: number;
  data: Record<string, any>[];
}

export interface PortfolioData {
  total_projects: number;
  planned_cost: number;
  actual_cost: number;
  avg_cost_overrun: number;
  avg_schedule_overrun: number;
  on_budget_rate: number;
  on_schedule_rate: number;
  avg_cost_per_sqft: number;
  terrain_overruns: Array<{
    terrain_type: string;
    projects: number;
    avg_cost_overrun_pct: number;
    avg_schedule_overrun_pct: number;
    avg_actual_cost: number;
  }>;
  complexity_overruns: Array<{
    complexity_level: string;
    projects: number;
    avg_cost_overrun_pct: number;
    avg_schedule_overrun_pct: number;
  }>;
  high_risk_projects: Array<{
    project_id: string;
    project_type: string;
    terrain_type: string;
    complexity_level: string;
    planned_cost: number;
    actual_cost: number;
    cost_overrun_pct: number;
    schedule_overrun_pct: number;
  }>;
  high_risk_threshold: number;
}

export interface PerformanceDimensionData {
  dimension: string;
  data: Array<{
    [key: string]: any;
    projects: number;
    avg_cost_overrun_pct: number;
    avg_schedule_overrun_pct: number;
    avg_actual_cost: number;
    avg_actual_duration: number;
    avg_cost_per_sqft: number;
  }>;
}

export interface DriverCorrelation {
  feature: string;
  raw_feature: string;
  correlation: number;
  impact: 'positive' | 'negative';
}

export interface VisualizationsData {
  quarterly_costs: Array<{
    quarter: string;
    date: string;
    planned_cost: number;
    actual_cost: number;
  }>;
  project_type_overruns: Array<{
    project_type: string;
    projects: number;
    avg_cost_overrun_pct: number;
    avg_schedule_overrun_pct: number;
    avg_actual_cost: number;
  }>;
  land_vs_cost: Array<{
    project_id: string;
    land_area_sqft: number;
    actual_cost: number;
    terrain_type: string;
    cost_overrun_pct: number;
  }>;
  labor_vs_duration: Array<{
    project_id: string;
    labor_count: number;
    actual_duration_days: number;
    cost_overrun_pct: number;
    complexity_level: string;
  }>;
  overrun_distribution: Array<{
    bin_range: string;
    bin_start: number;
    bin_end: number;
    bin_center: number;
    count: number;
  }>;
}

export interface ModelMetrics {
  r2: number;
  mape: number;
  mae: number;
}

export interface TrainResponse {
  success: boolean;
  cost_model: ModelMetrics;
  duration_model: ModelMetrics;
}

export interface ModelStatus {
  trained: boolean;
  last_trained?: string | null;
  model_version?: string | null;
}

export interface PredictionInput {
  project_type: string;
  terrain_type: string;
  region: string;
  complexity_level: string;
  season: string;
  weather_risk: string;
  land_area_sqft: number;
  num_floors: number;
  labor_count: number;
  equipment_count: number;
  material_cost_index: number;
  contractor_experience_years: number;
}

export interface ShapFactor {
  feature: string;
  value: number;
  direction: 'positive' | 'negative';
}

export interface PredictionResult {
  predicted_cost: number;
  predicted_duration_days: number;
  cost_baseline: number;
  duration_baseline: number;
  cost_shap: ShapFactor[];
  duration_shap: ShapFactor[];
}

export interface OptimizationInput extends PredictionInput {
  optimization_priority: 'cost' | 'timeline' | 'balanced';
}

export interface OptimizationResult {
  recommended_labor: number;
  recommended_equipment: number;
  predicted_cost: number;
  predicted_duration_days: number;
  baseline_cost: number;
  baseline_duration_days: number;
  cost_change_pct: number;
  duration_change_pct: number;
  recommendation: string;
}

export interface WhatIfInput {
  base_project: PredictionInput;
  variable: 'labor_count' | 'land_area_sqft' | 'contractor_experience_years';
  minimum: number;
  maximum: number;
  steps: number;
}

export interface WhatIfPoint {
  value: number;
  predicted_cost: number;
  predicted_duration: number;
}

export interface ComparisonProject {
  project_id: string;
  project_type: string;
  terrain_type: string;
  region: string;
  complexity_level: string;
  planned_cost: number;
  actual_cost: number;
  cost_overrun_pct: number;
  planned_duration_days: number;
  actual_duration_days: number;
  schedule_overrun_pct: number;
  land_area_sqft: number;
  num_floors: number;
  labor_count: number;
  equipment_count: number;
}

export interface BusinessReportData {
  portfolio_summary: {
    n_projects: number;
    total_planned_cost: number;
    total_actual_cost: number;
    avg_cost_overrun_pct: number;
    avg_schedule_overrun_pct: number;
    pct_on_budget: number;
    pct_on_schedule: number;
    avg_cost_per_sqft: number;
    avg_actual_duration: number;
  };
  best_terrain: Record<string, any>;
  worst_terrain: Record<string, any>;
  high_risk_count: number;
  sections: Array<{
    title: string;
    items: string[];
  }>;
  generated_at: string;
}
