"""
Resource Allocation Optimizer.

Given a project's fixed attributes (land area, terrain, complexity, etc.),
finds the labor_count / equipment_count combination that minimizes a
weighted objective of predicted cost and predicted duration, subject to
bounds on how much labor/equipment can realistically flex.

Uses grid search rather than gradient-based optimization: gradient-boosted
tree models produce a stair-step (piecewise-constant) prediction surface,
so local optimizers like Nelder-Mead/SLSQP can get stuck with zero
apparent gradient right at the starting point. A grid search over the
realistic resource range is slower but reliably finds the actual best
point on a tree model's surface.
"""

import numpy as np
import pandas as pd


def _predict_batch(labor_grid, equip_grid, cost_pipe, duration_pipe, fixed_attrs):
    rows = pd.DataFrame([
        {**fixed_attrs, "labor_count": l, "equipment_count": e}
        for l in labor_grid for e in equip_grid
    ])
    costs = cost_pipe.predict(rows)
    durations = duration_pipe.predict(rows)
    return rows["labor_count"].values, rows["equipment_count"].values, costs, durations


def optimize_resources(cost_pipe, duration_pipe, fixed_attrs: dict,
                        priority: str = "balanced",
                        labor_bounds=(5, 500), equipment_bounds=(1, 60),
                        grid_steps: int = 20):
    """
    priority: "cost" (minimize cost, duration secondary), "time" (minimize
    duration, cost secondary), or "balanced" (normalized weighted sum).
    """
    weights = {"cost": (1.0, 0.15), "time": (0.15, 1.0), "balanced": (0.5, 0.5)}
    w_cost, w_time = weights.get(priority, (0.5, 0.5))

    baseline_labor = fixed_attrs.get("labor_count", 50)
    baseline_equipment = fixed_attrs.get("equipment_count", 5)
    base_row = pd.DataFrame([{**fixed_attrs, "labor_count": baseline_labor,
                               "equipment_count": baseline_equipment}])
    base_cost = float(cost_pipe.predict(base_row)[0])
    base_duration = float(duration_pipe.predict(base_row)[0])

    labor_grid = np.linspace(labor_bounds[0], labor_bounds[1], grid_steps)
    equip_grid = np.linspace(equipment_bounds[0], equipment_bounds[1], grid_steps)

    labor_vals, equip_vals, costs, durations = _predict_batch(
        labor_grid, equip_grid, cost_pipe, duration_pipe, fixed_attrs)

    objective = w_cost * (costs / base_cost) + w_time * (durations / base_duration)
    best_idx = int(np.argmin(objective))

    best_cost = float(costs[best_idx])
    best_duration = float(durations[best_idx])

    return {
        "success": True,
        "recommended_labor_count": int(round(labor_vals[best_idx])),
        "recommended_equipment_count": int(round(equip_vals[best_idx])),
        "predicted_cost": round(best_cost, 2),
        "predicted_duration_days": round(best_duration, 2),
        "baseline_labor_count": int(baseline_labor),
        "baseline_equipment_count": int(baseline_equipment),
        "baseline_predicted_cost": round(base_cost, 2),
        "baseline_predicted_duration_days": round(base_duration, 2),
        "cost_change_pct": round((best_cost - base_cost) / base_cost * 100, 1),
        "duration_change_pct": round((best_duration - base_duration) / base_duration * 100, 1),
    }
