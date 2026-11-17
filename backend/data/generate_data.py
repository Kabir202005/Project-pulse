"""
Synthetic Construction Project Dataset Generator
---------------------------------------------------
Generates a project-level dataset in the style of public civil-engineering /
construction cost-estimation datasets. Columns:

    project_id, project_type, terrain_type, region, land_area_sqft,
    num_floors, complexity_level, labor_count, equipment_count,
    material_cost_index, contractor_experience_years, season,
    weather_risk, start_date, planned_duration_days, planned_cost,
    actual_duration_days, actual_cost   <- ML targets

Design note: actual_cost and actual_duration_days are generated so that
labor_count and equipment_count have a genuine trade-off effect (more crew
speeds up the job with diminishing returns, but costs more per day; a
longer job also accrues more equipment-rental and labor-day cost) --
this is what makes the resource optimizer's search meaningful rather than
a boundary-value artifact.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

RNG_SEED = 42
N_ROWS = 3000
np.random.seed(RNG_SEED)

PROJECT_TYPES = ["Residential", "Commercial", "Industrial", "Infrastructure", "Institutional"]
TERRAIN_TYPES = ["Flat", "Hilly", "Rocky", "Wetland/Marshy", "Sandy/Coastal"]
REGIONS = ["North", "South", "East", "West", "Central"]
COMPLEXITY_LEVELS = ["Low", "Medium", "High", "Very High"]
SEASONS = ["Winter", "Summer", "Monsoon", "Spring/Fall"]
WEATHER_RISK = ["Low", "Moderate", "High"]

TERRAIN_COST_MULT = {"Flat": 1.00, "Hilly": 1.25, "Rocky": 1.45,
                      "Wetland/Marshy": 1.55, "Sandy/Coastal": 1.15}
TERRAIN_TIME_MULT = {"Flat": 1.00, "Hilly": 1.20, "Rocky": 1.35,
                      "Wetland/Marshy": 1.40, "Sandy/Coastal": 1.10}
COMPLEXITY_COST_MULT = {"Low": 0.90, "Medium": 1.05, "High": 1.30, "Very High": 1.60}
COMPLEXITY_TIME_MULT = {"Low": 0.88, "Medium": 1.00, "High": 1.25, "Very High": 1.55}
SEASON_TIME_MULT = {"Winter": 1.10, "Summer": 1.00, "Monsoon": 1.30, "Spring/Fall": 0.98}
WEATHER_TIME_MULT = {"Low": 1.00, "Moderate": 1.10, "High": 1.28}
PROJECT_TYPE_COST_PER_SQFT = {
    "Residential": 120, "Commercial": 160, "Industrial": 140,
    "Infrastructure": 190, "Institutional": 155,
}
REGION_WAGE_INDEX = {"North": 1.05, "South": 0.90, "East": 0.95, "West": 1.15, "Central": 1.00}


def random_date(start, end):
    delta = end - start
    return start + timedelta(days=np.random.randint(0, delta.days))


def generate():
    rows = []
    start_range = datetime(2021, 1, 1)
    end_range = datetime(2025, 12, 31)

    for i in range(1, N_ROWS + 1):
        project_type = np.random.choice(PROJECT_TYPES)
        terrain = np.random.choice(TERRAIN_TYPES)
        region = np.random.choice(REGIONS)
        complexity = np.random.choice(COMPLEXITY_LEVELS, p=[0.30, 0.35, 0.25, 0.10])
        season = np.random.choice(SEASONS)
        weather_risk = np.random.choice(WEATHER_RISK, p=[0.5, 0.35, 0.15])

        land_area = float(np.round(np.random.gamma(shape=4, scale=2500) + 800, 1))
        num_floors = int(np.clip(np.random.poisson(3) + 1, 1, 40))

        optimal_labor = land_area / 220 + num_floors * 4
        labor_count = int(np.clip(np.random.normal(loc=optimal_labor, scale=optimal_labor * 0.25), 5, 500))
        optimal_equipment = labor_count / 12
        equipment_count = int(np.clip(np.random.normal(loc=optimal_equipment, scale=2), 1, 60))

        material_cost_index = float(np.round(np.random.normal(100, 15), 1))
        contractor_experience = int(np.clip(np.random.exponential(scale=8), 0, 40))

        start_date = random_date(start_range, end_range)

        # ---- Planned baseline (naive quoted estimate, doesn't know true multipliers) ----
        base_cost_per_sqft = PROJECT_TYPE_COST_PER_SQFT[project_type]
        planned_material_cost = land_area * base_cost_per_sqft * (1 + 0.06 * (num_floors - 1)) \
            * (material_cost_index / 100)
        planned_duration = 40 + land_area / 50 + num_floors * 10
        planned_labor_cost = labor_count * 45 * planned_duration
        planned_equipment_cost = equipment_count * 300 * planned_duration
        planned_cost = planned_material_cost + planned_labor_cost + planned_equipment_cost
        planned_duration = float(np.clip(planned_duration, 30, 1500))

        # ---- Actual duration: scope-driven base, modulated by terrain/complexity/
        # season/weather/experience, and by labor & equipment relative to the
        # "optimal" crew size for this scope (diminishing returns both directions) ----
        experience_relief = np.clip(1 - contractor_experience * 0.008, 0.78, 1.0)
        labor_ratio = np.clip(optimal_labor / max(labor_count, 1), 0.35, 2.8)
        duration_labor_factor = labor_ratio ** 0.55         # understaffed -> slower, overstaffed -> faster (diminishing)
        equip_ratio = np.clip(optimal_equipment / max(equipment_count, 1), 0.5, 2.5)
        duration_equipment_factor = equip_ratio ** 0.25

        base_duration_scope = 40 + land_area / 50 + num_floors * 10
        time_mult = (TERRAIN_TIME_MULT[terrain] * COMPLEXITY_TIME_MULT[complexity]
                     * SEASON_TIME_MULT[season] * WEATHER_TIME_MULT[weather_risk])
        time_noise = np.random.normal(1.0, 0.06)
        actual_duration = max(15.0, base_duration_scope * time_mult * experience_relief
                               * duration_labor_factor * duration_equipment_factor * time_noise)

        # ---- Actual cost: materials (terrain/complexity/experience-driven) +
        # labor-days + equipment-rental-days, so cost and duration are genuinely
        # linked through labor_count/equipment_count ----
        cost_mult = TERRAIN_COST_MULT[terrain] * COMPLEXITY_COST_MULT[complexity]
        cost_noise = np.random.normal(1.0, 0.06)
        material_cost = planned_material_cost * cost_mult * experience_relief * cost_noise

        daily_wage = 45 * REGION_WAGE_INDEX[region] * np.random.normal(1.0, 0.05)
        daily_equip_rate = 300 * np.random.normal(1.0, 0.05)
        labor_cost = labor_count * daily_wage * actual_duration
        equipment_cost = equipment_count * daily_equip_rate * actual_duration

        actual_cost = material_cost + labor_cost + equipment_cost

        rows.append({
            "project_id": f"PRJ{i:05d}",
            "project_type": project_type,
            "terrain_type": terrain,
            "region": region,
            "land_area_sqft": land_area,
            "num_floors": num_floors,
            "complexity_level": complexity,
            "labor_count": labor_count,
            "equipment_count": equipment_count,
            "material_cost_index": material_cost_index,
            "contractor_experience_years": contractor_experience,
            "season": season,
            "weather_risk": weather_risk,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "planned_duration_days": round(planned_duration, 1),
            "planned_cost": round(planned_cost, 2),
            "actual_duration_days": round(actual_duration, 1),
            "actual_cost": round(actual_cost, 2),
        })

    df = pd.DataFrame(rows)

    messy_idx = np.random.choice(df.index, size=int(0.03 * len(df)), replace=False)
    df.loc[messy_idx[:len(messy_idx)//3], "actual_cost"] = np.nan
    df.loc[messy_idx[len(messy_idx)//3:2*len(messy_idx)//3], "contractor_experience_years"] = np.nan
    dup_rows = df.sample(15, random_state=RNG_SEED)
    df = pd.concat([df, dup_rows], ignore_index=True)

    return df


if __name__ == "__main__":
    df = generate()
    out_path = "data/construction_projects_raw.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} rows -> {out_path}")
