"""
Executive business report generation and markdown download endpoints.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from state import state
from schemas import BusinessReportResponse, ReportSection
from utils.data_processing import portfolio_summary, group_performance, flag_high_risk

router = APIRouter(prefix="/reports", tags=["Reports"])


def _generate_report_markdown() -> str:
    df = state.df
    s = portfolio_summary(df)
    perf_terrain = group_performance(df, "terrain_type")
    best_terrain = perf_terrain.iloc[-1]
    worst_terrain = perf_terrain.iloc[0]
    flagged, threshold = flag_high_risk(df)

    report_md = f"""# Project Cost & Timeline Executive Report
**Generated:** {datetime.now().strftime("%B %d, %Y - %H:%M:%S")}
**Platform:** Project Pulse Construction Intelligence

---

## 1. Portfolio Executive Summary

- **Total Analyzed Projects:** {s['n_projects']:,}
- **Total Portfolio Planned Budget:** ${s['total_planned_cost']:,.0f}
- **Total Portfolio Actual Expenditure:** ${s['total_actual_cost']:,.0f}
- **Mean Cost Overrun:** {s['avg_cost_overrun_pct']:.1f}%
- **Mean Schedule Delay:** {s['avg_schedule_overrun_pct']:.1f}%
- **On-Budget Compliance Rate (≤10% deviation):** {s['pct_on_budget']:.1f}%
- **On-Schedule Compliance Rate (≤10% deviation):** {s['pct_on_schedule']:.1f}%
- **Average Cost Intensity:** ${s['avg_cost_per_sqft']:,.2f} per sq.ft.
- **Average Project Duration:** {s['avg_actual_duration']:.0f} calendar days

---

## 2. Key Empirical Findings

1. **Top Cost-Discipline Terrain:**
   - **{best_terrain['terrain_type']}** exhibits the lowest cost variance across the portfolio, averaging a cost overrun of **{best_terrain['avg_cost_overrun_pct']:.1f}%** over **{int(best_terrain['projects'])}** active projects.

2. **Highest Risk Terrain Category:**
   - **{worst_terrain['terrain_type']}** represents the greatest budget vulnerability, demonstrating an average cost escalation of **{worst_terrain['avg_cost_overrun_pct']:.1f}%** across **{int(worst_terrain['projects'])}** projects.

3. **High-Risk Project Flags:**
   - **{len(flagged)} projects** ({len(flagged)/len(df)*100:.1f}% of portfolio) are classified in the critical risk tier, exhibiting cost overrun exceeding the 75th percentile benchmark of **{threshold:.1f}%**.

---

## 3. Strategic Management Recommendations

1. **Terrain-Specific Contingency Weighting:**
   Incorporate dynamic risk multipliers for {worst_terrain['terrain_type']} projects to account for historical budget inflation during early-stage feasibility phases.

2. **Machine-Learning Powered Pre-Bid Estimation:**
   Deploy the Project Pulse AI Estimator prior to tender submission to account for non-linear interactions between terrain complexity, floor count, and seasonal weather variables.

3. **Resource Optimization Prior to Crew Mobilization:**
   Utilize the Smart Resource Optimizer to determine the optimal trade-off between labor headcount and equipment density based on whether timeline acceleration or budget preservation is the prime objective.

---
*Report automatically synthesized by Project Pulse Engine from verified portfolio dataset.*
"""
    return report_md


@router.get("/business", response_model=BusinessReportResponse)
def get_business_report():
    """Get structured executive business report data."""
    if not state.is_data_loaded:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload or load sample data first.")

    df = state.df
    s = portfolio_summary(df)
    perf_terrain = group_performance(df, "terrain_type")
    best_terrain = perf_terrain.iloc[-1].to_dict()
    worst_terrain = perf_terrain.iloc[0].to_dict()
    flagged, threshold = flag_high_risk(df)

    sections = [
        ReportSection(
            title="Portfolio Overview",
            items=[
                f"Evaluated {s['n_projects']:,} capital projects spanning multiple geographical regions.",
                f"Gross portfolio capital expenditure: ${s['total_actual_cost']:,.0f} vs ${s['total_planned_cost']:,.0f} budgeted.",
                f"Overall budget overrun rate averaged {s['avg_cost_overrun_pct']:.1f}%, while schedule slippage averaged {s['avg_schedule_overrun_pct']:.1f}%.",
                f"{s['pct_on_budget']:.0f}% of projects completed within acceptable ±10% budget tolerance."
            ]
        ),
        ReportSection(
            title="Terrain & Complexity Observations",
            items=[
                f"Lowest financial variance observed in {best_terrain['terrain_type']} terrain ({best_terrain['avg_cost_overrun_pct']:.1f}% avg overrun).",
                f"Maximum budget volatility encountered in {worst_terrain['terrain_type']} terrain ({worst_terrain['avg_cost_overrun_pct']:.1f}% avg overrun).",
                f"Identified {len(flagged)} projects in the 75th percentile cost overrun band (>{threshold:.1f}% overrun)."
            ]
        ),
        ReportSection(
            title="Actionable Recommendations",
            items=[
                f"Apply a minimum {worst_terrain['avg_cost_overrun_pct']:.1f}% contingency reserve when initiating projects in {worst_terrain['terrain_type']} regions.",
                "Mandate AI Estimator screening for all bids over $10M to eliminate blind-spot estimation errors.",
                "Calibrate contractor experience requirements: higher experience significantly correlates with reduced schedule drift."
            ]
        ),
    ]

    return {
        "portfolio_summary": s,
        "best_terrain": best_terrain,
        "worst_terrain": worst_terrain,
        "high_risk_count": len(flagged),
        "sections": sections,
        "generated_at": datetime.now().isoformat(),
    }


@router.get("/business/download")
def download_business_report():
    """Download executive business report as a Markdown document."""
    if not state.is_data_loaded:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload or load sample data first.")

    report_content = _generate_report_markdown()
    response = StreamingResponse(iter([report_content]), media_type="text/markdown")
    response.headers["Content-Disposition"] = "attachment; filename=Project_Pulse_Executive_Report.md"
    return response
