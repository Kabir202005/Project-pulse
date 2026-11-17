"""
Predicting Project Cost & Timeline
-------------------------------------
Run with:  streamlit run app.py
"""

import sys
import io
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

sys.path.append(".")
from utils.data_processing import (
    load_and_clean, add_derived_metrics, portfolio_summary,
    group_performance, flag_high_risk,
)
from models.cost_timeline_predictor import (
    train_cost_model, train_duration_model, predict_single,
    NUMERIC_FEATURES, CATEGORICAL_FEATURES,
)
from models.resource_optimizer import optimize_resources
from utils.explainability import build_explainer, explain_single

st.set_page_config(page_title="Project Cost & Timeline Predictor", layout="wide",
                    page_icon="🏗️")

for key in ["df", "cost_pipe", "duration_pipe", "cost_metrics", "duration_metrics",
            "cost_explainer", "duration_explainer"]:
    if key not in st.session_state:
        st.session_state[key] = None


def get_options(df, col):
    return sorted(df[col].dropna().unique().tolist())


# ------------------------------------------------------------------ sidebar
st.sidebar.title("🏗️ Project Cost & Timeline Predictor")
page = st.sidebar.radio("Navigate", [
    "1. Data Upload & Cleaning",
    "2. Dashboard",
    "3. Project Analysis",
    "4. Visualizations",
    "5. Cost & Timeline Prediction (ML)",
    "6. Resource Optimizer",
    "7. What-If Analysis",
    "8. Project Comparison",
    "9. Business Report",
])
st.sidebar.divider()
if st.session_state.df is not None:
    st.sidebar.success(f"{len(st.session_state.df)} projects loaded")
else:
    st.sidebar.warning("No data loaded yet")

# =========================================================== PAGE 1: UPLOAD
if page.startswith("1"):
    st.title("Data Upload & Cleaning")
    st.write(
        "Upload a project-level CSV, or load the bundled sample dataset "
        "(synthetic, styled after public construction-cost-estimation datasets) "
        "to explore the platform."
    )
    col1, col2 = st.columns(2)
    with col1:
        uploaded = st.file_uploader("Upload project CSV", type=["csv"])
    with col2:
        use_sample = st.button("Load bundled sample dataset", use_container_width=True)

    source = uploaded if uploaded is not None else ("data/construction_projects_raw.csv" if use_sample else None)

    st.caption(
        "Required columns: project_id, project_type, terrain_type, region, "
        "land_area_sqft, num_floors, complexity_level, labor_count, "
        "equipment_count, material_cost_index, contractor_experience_years, "
        "season, weather_risk, start_date, planned_duration_days, planned_cost, "
        "actual_duration_days, actual_cost"
    )

    if source is not None:
        try:
            raw_preview = pd.read_csv(source)
            if hasattr(source, "seek"):
                source.seek(0)
            df_clean = load_and_clean(source)
            df_clean = add_derived_metrics(df_clean)
            st.session_state.df = df_clean

            n_dupes = df_clean.attrs.get("n_duplicates_removed", 0)
            n_cost_imp = df_clean.attrs.get("n_cost_imputed", 0)
            n_exp_imp = df_clean.attrs.get("n_experience_imputed", 0)

            st.success(f"Loaded and cleaned {len(df_clean)} projects.")
            m1, m2, m3, m4 = st.columns(4)
            m1.metric("Raw rows", len(raw_preview))
            m2.metric("Duplicates removed", n_dupes)
            m3.metric("Cost values imputed", n_cost_imp)
            m4.metric("Experience values imputed", n_exp_imp)

            st.subheader("Cleaned data preview")
            st.dataframe(df_clean.head(20), use_container_width=True)

            st.session_state.cost_pipe = None
            st.session_state.duration_pipe = None
        except Exception as e:
            st.error(f"Could not process file: {e}")
    elif st.session_state.df is not None:
        st.info("Using previously loaded data. Upload a new file or reload the sample to replace it.")
        st.dataframe(st.session_state.df.head(20), use_container_width=True)

# ============================================================ PAGE 2: DASH
elif page.startswith("2"):
    st.title("Portfolio Dashboard")
    df = st.session_state.df
    if df is None:
        st.warning("Load data on the 'Data Upload & Cleaning' page first.")
    else:
        s = portfolio_summary(df)
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Projects", s["n_projects"])
        c2.metric("Total Planned Cost", f"${s['total_planned_cost']:,.0f}")
        c3.metric("Total Actual Cost", f"${s['total_actual_cost']:,.0f}")
        c4.metric("Avg. Cost Overrun", f"{s['avg_cost_overrun_pct']:.1f}%")

        c5, c6, c7, c8 = st.columns(4)
        c5.metric("Avg. Schedule Overrun", f"{s['avg_schedule_overrun_pct']:.1f}%")
        c6.metric("% Projects On Budget", f"{s['pct_on_budget']:.0f}%")
        c7.metric("% Projects On Schedule", f"{s['pct_on_schedule']:.0f}%")
        c8.metric("Avg. Cost / sqft", f"${s['avg_cost_per_sqft']:,.2f}")

        st.divider()
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Cost Overrun by Terrain Type")
            perf = group_performance(df, "terrain_type")
            fig = px.bar(perf, x="terrain_type", y="avg_cost_overrun_pct",
                        color="avg_cost_overrun_pct", color_continuous_scale="RdYlGn_r",
                        text_auto=".1f")
            fig.update_layout(showlegend=False, yaxis_title="Avg Cost Overrun (%)")
            st.plotly_chart(fig, use_container_width=True)
        with col2:
            st.subheader("Cost Overrun by Complexity Level")
            perf2 = group_performance(df, "complexity_level")
            fig2 = px.bar(perf2, x="complexity_level", y="avg_cost_overrun_pct",
                         color="avg_cost_overrun_pct", color_continuous_scale="RdYlGn_r",
                         text_auto=".1f")
            fig2.update_layout(showlegend=False, yaxis_title="Avg Cost Overrun (%)")
            st.plotly_chart(fig2, use_container_width=True)

        st.subheader("Highest-Risk Projects")
        flagged, threshold = flag_high_risk(df)
        st.caption(f"Flagged: cost overrun at or above the 75th percentile ({threshold:.1f}%)")
        st.dataframe(
            flagged[["project_id", "project_type", "terrain_type", "complexity_level",
                     "planned_cost", "actual_cost", "cost_overrun_pct",
                     "schedule_overrun_pct"]].head(25),
            use_container_width=True,
        )

# ================================================== PAGE 3: PROJECT ANALYSIS
elif page.startswith("3"):
    st.title("Project Performance Analysis")
    df = st.session_state.df
    if df is None:
        st.warning("Load data first.")
    else:
        group_col = st.selectbox("Analyze performance by:", [
            "project_type", "terrain_type", "region", "complexity_level",
            "season", "weather_risk",
        ])
        perf = group_performance(df, group_col)
        st.dataframe(perf.style.format({
            "avg_cost_overrun_pct": "{:.1f}%", "avg_schedule_overrun_pct": "{:.1f}%",
            "avg_actual_cost": "${:,.0f}", "avg_actual_duration": "{:.0f} days",
            "avg_cost_per_sqft": "${:,.2f}",
        }), use_container_width=True)

        st.subheader(f"Cost vs. Schedule Overrun across {group_col.replace('_', ' ')}")
        fig = px.scatter(perf, x="avg_schedule_overrun_pct", y="avg_cost_overrun_pct",
                         size="projects", color="avg_cost_overrun_pct",
                         hover_name=group_col, color_continuous_scale="RdYlGn_r",
                         labels={"avg_schedule_overrun_pct": "Avg Schedule Overrun (%)",
                                 "avg_cost_overrun_pct": "Avg Cost Overrun (%)"})
        st.plotly_chart(fig, use_container_width=True)

        st.subheader("Factor influence (correlation with cost overrun)")
        st.caption("Simple correlation view. For rigorous causal attribution, see the ML "
                   "prediction + explainability pages.")
        numeric_df = df[["land_area_sqft", "num_floors", "labor_count", "equipment_count",
                          "material_cost_index", "contractor_experience_years",
                          "cost_overrun_pct"]]
        corr = numeric_df.corr()["cost_overrun_pct"].drop("cost_overrun_pct").sort_values()
        fig2 = px.bar(corr, orientation="h",
                     labels={"value": "Correlation with Cost Overrun", "index": ""})
        fig2.update_layout(showlegend=False)
        st.plotly_chart(fig2, use_container_width=True)

# =================================================== PAGE 4: VISUALIZATIONS
elif page.startswith("4"):
    st.title("Interactive Visualizations")
    df = st.session_state.df
    if df is None:
        st.warning("Load data first.")
    else:
        st.subheader("Planned vs. Actual Cost Over Time")
        monthly = df.set_index("start_date").resample("QS").agg(
            planned=("planned_cost", "sum"), actual=("actual_cost", "sum")).reset_index()
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=monthly["start_date"], y=monthly["planned"],
                                  name="Planned Cost", mode="lines+markers"))
        fig.add_trace(go.Scatter(x=monthly["start_date"], y=monthly["actual"],
                                  name="Actual Cost", mode="lines+markers"))
        fig.update_layout(xaxis_title="Quarter", yaxis_title="$")
        st.plotly_chart(fig, use_container_width=True)

        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Cost Overrun by Project Type")
            perf = group_performance(df, "project_type")
            fig2 = px.bar(perf.sort_values("avg_cost_overrun_pct"), x="avg_cost_overrun_pct",
                          y="project_type", orientation="h", color="avg_cost_overrun_pct",
                          color_continuous_scale="RdYlGn_r")
            st.plotly_chart(fig2, use_container_width=True)
        with col2:
            st.subheader("Land Area vs. Actual Cost")
            fig3 = px.scatter(df, x="land_area_sqft", y="actual_cost", color="terrain_type",
                              opacity=0.6)
            st.plotly_chart(fig3, use_container_width=True)

        st.subheader("Labor Count vs. Duration (colored by cost overrun)")
        fig4 = px.scatter(df, x="labor_count", y="actual_duration_days",
                          color="cost_overrun_pct", color_continuous_scale="RdYlGn_r",
                          opacity=0.6)
        st.plotly_chart(fig4, use_container_width=True)

        st.subheader("Cost Overrun Distribution")
        fig5 = px.histogram(df, x="cost_overrun_pct", nbins=40, color_discrete_sequence=["#2E86AB"])
        fig5.add_vline(x=df["cost_overrun_pct"].median(), line_dash="dash", annotation_text="Median")
        st.plotly_chart(fig5, use_container_width=True)

# ===================================================== PAGE 5: ML PREDICTION
elif page.startswith("5"):
    st.title("Cost & Timeline Prediction (Machine Learning)")
    df = st.session_state.df
    if df is None:
        st.warning("Load data first.")
    else:
        if st.session_state.cost_pipe is None:
            if st.button("Train prediction models", type="primary"):
                with st.spinner("Training cost & duration models..."):
                    cost_pipe, cost_metrics = train_cost_model(df, save=False)
                    dur_pipe, dur_metrics = train_duration_model(df, save=False)
                    st.session_state.cost_pipe = cost_pipe
                    st.session_state.duration_pipe = dur_pipe
                    st.session_state.cost_metrics = cost_metrics
                    st.session_state.duration_metrics = dur_metrics
                    feat_df = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
                    st.session_state.cost_explainer = build_explainer(cost_pipe, feat_df)
                    st.session_state.duration_explainer = build_explainer(dur_pipe, feat_df)
                st.success("Models trained.")
                st.rerun()
        else:
            cm, dm = st.session_state.cost_metrics, st.session_state.duration_metrics
            st.subheader("Model performance")
            c1, c2, c3 = st.columns(3)
            c1.metric("Cost model R²", f"{cm['r2']:.2f}")
            c2.metric("Cost model MAPE", f"{cm['mape']:.1f}%")
            c3.metric("Cost model MAE", f"${cm['mae']:,.0f}")
            c4, c5, c6 = st.columns(3)
            c4.metric("Duration model R²", f"{dm['r2']:.2f}")
            c5.metric("Duration model MAPE", f"{dm['mape']:.1f}%")
            c6.metric("Duration model MAE", f"{dm['mae']:.1f} days")

            st.divider()
            st.subheader("Predict cost & timeline for a new project")
            c1, c2, c3 = st.columns(3)
            land_area = c1.number_input("Land area (sqft)", min_value=100.0, value=10000.0, step=500.0)
            num_floors = c2.number_input("Number of floors", min_value=1, value=5, step=1)
            labor_count = c3.number_input("Labor count", min_value=1, value=50, step=5)
            c4, c5, c6 = st.columns(3)
            equipment_count = c4.number_input("Equipment count", min_value=1, value=5, step=1)
            material_cost_index = c5.number_input("Material cost index (100 = baseline)",
                                                    min_value=50.0, value=100.0, step=5.0)
            contractor_experience = c6.number_input("Contractor experience (years)",
                                                      min_value=0, value=8, step=1)
            c7, c8, c9 = st.columns(3)
            project_type = c7.selectbox("Project type", get_options(df, "project_type"))
            terrain_type = c8.selectbox("Terrain type", get_options(df, "terrain_type"))
            region = c9.selectbox("Region", get_options(df, "region"))
            c10, c11, c12 = st.columns(3)
            complexity_level = c10.selectbox("Complexity level", get_options(df, "complexity_level"))
            season = c11.selectbox("Season", get_options(df, "season"))
            weather_risk = c12.selectbox("Weather risk", get_options(df, "weather_risk"))

            if st.button("Predict", type="primary"):
                result = predict_single(
                    st.session_state.cost_pipe, st.session_state.duration_pipe,
                    land_area, num_floors, labor_count, equipment_count,
                    material_cost_index, contractor_experience, project_type,
                    terrain_type, region, complexity_level, season, weather_risk)
                c1, c2 = st.columns(2)
                c1.metric("Predicted Cost", f"${result['predicted_cost']:,.0f}")
                c2.metric("Predicted Duration", f"{result['predicted_duration_days']:.0f} days")

                row = pd.DataFrame([{
                    "land_area_sqft": land_area, "num_floors": num_floors,
                    "labor_count": labor_count, "equipment_count": equipment_count,
                    "material_cost_index": material_cost_index,
                    "contractor_experience_years": contractor_experience,
                    "project_type": project_type, "terrain_type": terrain_type,
                    "region": region, "complexity_level": complexity_level,
                    "season": season, "weather_risk": weather_risk,
                }])

                col1, col2 = st.columns(2)
                with col1:
                    st.subheader("Why this cost prediction?")
                    exp = explain_single(st.session_state.cost_pipe,
                                          st.session_state.cost_explainer, row, unit="$")
                    st.caption(f"Baseline (average project): ${exp['base_value']:,.0f}")
                    fdf = pd.DataFrame(exp["top_factors"])
                    fig = px.bar(fdf, x="impact", y="feature", orientation="h",
                                color="impact", color_continuous_scale="RdYlGn_r",
                                labels={"impact": "Impact on cost ($)", "feature": ""})
                    fig.update_layout(showlegend=False)
                    st.plotly_chart(fig, use_container_width=True)
                with col2:
                    st.subheader("Why this timeline prediction?")
                    exp2 = explain_single(st.session_state.duration_pipe,
                                           st.session_state.duration_explainer, row, unit="days")
                    st.caption(f"Baseline (average project): {exp2['base_value']:.0f} days")
                    fdf2 = pd.DataFrame(exp2["top_factors"])
                    fig2 = px.bar(fdf2, x="impact", y="feature", orientation="h",
                                 color="impact", color_continuous_scale="RdYlGn_r",
                                 labels={"impact": "Impact on duration (days)", "feature": ""})
                    fig2.update_layout(showlegend=False)
                    st.plotly_chart(fig2, use_container_width=True)

            if st.button("Retrain models"):
                st.session_state.cost_pipe = None
                st.session_state.duration_pipe = None
                st.rerun()

# ==================================================== PAGE 6: RESOURCE OPTIMIZER
elif page.startswith("6"):
    st.title("Resource Optimizer")
    df = st.session_state.df
    if df is None:
        st.warning("Load data first.")
    elif st.session_state.cost_pipe is None:
        st.warning("Train the models on the 'Cost & Timeline Prediction' page first.")
    else:
        st.write(
            "For a fixed project scope, search labor & equipment levels to find "
            "the best trade-off between cost and timeline, based on your priority."
        )
        c1, c2, c3 = st.columns(3)
        land_area = c1.number_input("Land area (sqft)", min_value=100.0, value=10000.0, step=500.0, key="opt_land")
        num_floors = c2.number_input("Number of floors", min_value=1, value=5, step=1, key="opt_floors")
        material_cost_index = c3.number_input("Material cost index", min_value=50.0, value=100.0, step=5.0, key="opt_mci")
        c4, c5, c6 = st.columns(3)
        contractor_experience = c4.number_input("Contractor experience (years)", min_value=0, value=8, key="opt_exp")
        project_type = c5.selectbox("Project type", get_options(df, "project_type"), key="opt_ptype")
        terrain_type = c6.selectbox("Terrain type", get_options(df, "terrain_type"), key="opt_terrain")
        c7, c8, c9 = st.columns(3)
        region = c7.selectbox("Region", get_options(df, "region"), key="opt_region")
        complexity_level = c8.selectbox("Complexity level", get_options(df, "complexity_level"), key="opt_complexity")
        season = c9.selectbox("Season", get_options(df, "season"), key="opt_season")
        weather_risk = st.selectbox("Weather risk", get_options(df, "weather_risk"), key="opt_weather")

        priority = st.radio("Optimization priority", ["cost", "time", "balanced"], horizontal=True,
                            format_func=lambda x: {"cost": "Minimize cost", "time": "Minimize timeline",
                                                    "balanced": "Balanced"}[x])

        if st.button("Find optimal resource allocation", type="primary"):
            fixed_attrs = {
                "land_area_sqft": land_area, "num_floors": num_floors,
                "material_cost_index": material_cost_index,
                "contractor_experience_years": contractor_experience,
                "project_type": project_type, "terrain_type": terrain_type,
                "region": region, "complexity_level": complexity_level,
                "season": season, "weather_risk": weather_risk,
                "labor_count": 50, "equipment_count": 5,
            }
            with st.spinner("Searching resource allocation space..."):
                result = optimize_resources(st.session_state.cost_pipe,
                                             st.session_state.duration_pipe,
                                             fixed_attrs, priority=priority)

            c1, c2 = st.columns(2)
            c1.metric("Recommended Labor Count", result["recommended_labor_count"],
                     delta=f"{result['recommended_labor_count'] - result['baseline_labor_count']} vs. baseline")
            c2.metric("Recommended Equipment Count", result["recommended_equipment_count"],
                     delta=f"{result['recommended_equipment_count'] - result['baseline_equipment_count']} vs. baseline")
            c3, c4 = st.columns(2)
            c3.metric("Predicted Cost", f"${result['predicted_cost']:,.0f}",
                     delta=f"{result['cost_change_pct']:+.1f}% vs. baseline crew")
            c4.metric("Predicted Duration", f"{result['predicted_duration_days']:.0f} days",
                     delta=f"{result['duration_change_pct']:+.1f}% vs. baseline crew",
                     delta_color="inverse")

            st.subheader("AI Recommendation")
            if priority == "cost":
                st.info(
                    f"A smaller, more efficient crew ({result['recommended_labor_count']} workers, "
                    f"{result['recommended_equipment_count']} equipment units) minimizes total cost "
                    f"for this scope, accepting a longer timeline in exchange."
                )
            elif priority == "time":
                st.info(
                    f"A larger crew ({result['recommended_labor_count']} workers, "
                    f"{result['recommended_equipment_count']} equipment units) minimizes the timeline "
                    f"for this scope, at a modest cost premium."
                )
            else:
                st.info(
                    f"A crew of {result['recommended_labor_count']} workers and "
                    f"{result['recommended_equipment_count']} equipment units balances cost and "
                    f"timeline reasonably for this scope."
                )

# ==================================================== PAGE 7: WHAT-IF ANALYSIS
elif page.startswith("7"):
    st.title("What-If Analysis")
    df = st.session_state.df
    if df is None:
        st.warning("Load data first.")
    elif st.session_state.cost_pipe is None:
        st.warning("Train the models on the 'Cost & Timeline Prediction' page first.")
    else:
        st.write("Sweep one variable and see how predicted cost & duration change, holding everything else fixed.")
        c1, c2, c3 = st.columns(3)
        project_type = c1.selectbox("Project type", get_options(df, "project_type"))
        terrain_type = c2.selectbox("Terrain type", get_options(df, "terrain_type"))
        region = c3.selectbox("Region", get_options(df, "region"))
        c4, c5 = st.columns(2)
        complexity_level = c4.selectbox("Complexity level", get_options(df, "complexity_level"))
        season = c5.selectbox("Season", get_options(df, "season"))
        weather_risk = st.selectbox("Weather risk", get_options(df, "weather_risk"))

        sweep_var = st.radio("Variable to sweep", ["Labor count", "Land area", "Contractor experience"],
                             horizontal=True)

        base_kwargs = dict(equipment_count=5, material_cost_index=100.0,
                            project_type=project_type, terrain_type=terrain_type,
                            region=region, complexity_level=complexity_level,
                            season=season, weather_risk=weather_risk)

        if sweep_var == "Labor count":
            lo, hi = st.slider("Labor count range", 5, 300, (10, 150), step=5)
            xs = np.linspace(lo, hi, 25)
            rows = [predict_single(st.session_state.cost_pipe, st.session_state.duration_pipe,
                                    land_area_sqft=10000, num_floors=5, labor_count=int(x),
                                    contractor_experience_years=8, **base_kwargs) for x in xs]
            xlabel = "labor_count"
        elif sweep_var == "Land area":
            lo, hi = st.slider("Land area range (sqft)", 1000, 60000, (2000, 30000), step=1000)
            xs = np.linspace(lo, hi, 25)
            rows = [predict_single(st.session_state.cost_pipe, st.session_state.duration_pipe,
                                    land_area_sqft=x, num_floors=5, labor_count=50,
                                    contractor_experience_years=8, **base_kwargs) for x in xs]
            xlabel = "land_area_sqft"
        else:
            lo, hi = st.slider("Contractor experience range (years)", 0, 40, (0, 25), step=1)
            xs = np.linspace(lo, hi, 25)
            rows = [predict_single(st.session_state.cost_pipe, st.session_state.duration_pipe,
                                    land_area_sqft=10000, num_floors=5, labor_count=50,
                                    contractor_experience_years=int(x), **base_kwargs) for x in xs]
            xlabel = "contractor_experience_years"

        plot_df = pd.DataFrame(rows)
        plot_df[xlabel] = xs

        col1, col2 = st.columns(2)
        with col1:
            fig = px.line(plot_df, x=xlabel, y="predicted_cost", markers=True,
                         labels={"predicted_cost": "Predicted Cost ($)"})
            st.plotly_chart(fig, use_container_width=True)
        with col2:
            fig2 = px.line(plot_df, x=xlabel, y="predicted_duration_days", markers=True,
                          labels={"predicted_duration_days": "Predicted Duration (days)"})
            st.plotly_chart(fig2, use_container_width=True)
        st.dataframe(plot_df, use_container_width=True)

# ================================================ PAGE 8: PROJECT COMPARISON
elif page.startswith("8"):
    st.title("Project Comparison")
    df = st.session_state.df
    if df is None:
        st.warning("Load data first.")
    else:
        options = df["project_id"].tolist()
        selected = st.multiselect("Select projects to compare (2-6)", options,
                                   default=options[:3] if len(options) >= 3 else options)
        if len(selected) >= 2:
            sub = df[df["project_id"].isin(selected)]
            metrics = ["planned_cost", "actual_cost", "planned_duration_days",
                       "actual_duration_days", "cost_overrun_pct", "schedule_overrun_pct"]
            melted = sub.melt(id_vars="project_id", value_vars=metrics,
                              var_name="metric", value_name="value")
            fig = px.bar(melted, x="metric", y="value", color="project_id", barmode="group")
            st.plotly_chart(fig, use_container_width=True)

            st.subheader("Side-by-side detail")
            display_cols = ["project_id", "project_type", "terrain_type", "complexity_level",
                             "planned_cost", "actual_cost", "cost_overrun_pct",
                             "planned_duration_days", "actual_duration_days", "schedule_overrun_pct"]
            st.dataframe(sub[display_cols].set_index("project_id").T, use_container_width=True)
        else:
            st.info("Select at least 2 projects.")

# ===================================================== PAGE 9: BUSINESS REPORT
elif page.startswith("9"):
    st.title("Business Report")
    df = st.session_state.df
    if df is None:
        st.warning("Load data first.")
    else:
        s = portfolio_summary(df)
        best_terrain = group_performance(df, "terrain_type").iloc[-1]
        worst_terrain = group_performance(df, "terrain_type").iloc[0]
        flagged, threshold = flag_high_risk(df)

        report_md = f"""# Project Cost & Timeline Report

**Projects analyzed:** {s['n_projects']}
**Total planned cost:** ${s['total_planned_cost']:,.0f}
**Total actual cost:** ${s['total_actual_cost']:,.0f}
**Avg. cost overrun:** {s['avg_cost_overrun_pct']:.1f}%
**Avg. schedule overrun:** {s['avg_schedule_overrun_pct']:.1f}%
**% projects on budget:** {s['pct_on_budget']:.0f}%
**% projects on schedule:** {s['pct_on_schedule']:.0f}%
**Avg. cost per sqft:** ${s['avg_cost_per_sqft']:,.2f}

## Key Findings

- **Best cost discipline:** {best_terrain['terrain_type']} terrain — average cost overrun of {best_terrain['avg_cost_overrun_pct']:.1f}% across {best_terrain['projects']} projects.
- **Highest risk terrain:** {worst_terrain['terrain_type']} — average cost overrun of {worst_terrain['avg_cost_overrun_pct']:.1f}% across {worst_terrain['projects']} projects.
- **{len(flagged)} projects** are flagged as high-risk (cost overrun at or above {threshold:.1f}%, the portfolio's 75th percentile).

## Recommendations

1. Apply extra cost contingency for projects on {worst_terrain['terrain_type']} terrain, which shows the highest historical overrun.
2. Use the Cost & Timeline Prediction page before quoting new projects to get a data-driven estimate instead of a flat per-sqft rate.
3. Use the Resource Optimizer to right-size labor/equipment before mobilizing a crew, based on whether cost or schedule is the priority for that project.

*Generated from current loaded dataset. Figures are illustrative (synthetic/demo data unless a real dataset was uploaded).*
"""
        st.markdown(report_md)
        st.download_button("Download report (Markdown)", report_md,
                            file_name="project_cost_timeline_report.md")
        csv_buf = io.StringIO()
        df.to_csv(csv_buf, index=False)
        st.download_button("Download full cleaned dataset (CSV)", csv_buf.getvalue(),
                            file_name="cleaned_project_data.csv")
