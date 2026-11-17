"""
Explainable AI helpers: SHAP values for the cost/duration models, converted
into plain-language feature contribution summaries for a single prediction.
"""

import numpy as np
import pandas as pd
import shap


def get_feature_names(pipe):
    preprocess = pipe.named_steps["preprocess"]
    num_features = preprocess.transformers_[0][2]
    cat_encoder = preprocess.transformers_[1][1]
    cat_features = list(cat_encoder.get_feature_names_out(preprocess.transformers_[1][2]))
    return list(num_features) + cat_features


def build_explainer(pipe, background_df: pd.DataFrame, sample_size: int = 200):
    model = pipe.named_steps["model"]
    preprocess = pipe.named_steps["preprocess"]
    bg = background_df.sample(min(sample_size, len(background_df)), random_state=42)
    bg_transformed = preprocess.transform(bg)
    if hasattr(bg_transformed, "toarray"):
        bg_transformed = bg_transformed.toarray()
    return shap.TreeExplainer(model, bg_transformed)


def explain_single(pipe, explainer, row_df: pd.DataFrame, top_k: int = 6, unit: str = ""):
    preprocess = pipe.named_steps["preprocess"]
    transformed = preprocess.transform(row_df)
    if hasattr(transformed, "toarray"):
        transformed = transformed.toarray()

    shap_values = explainer.shap_values(transformed)
    feature_names = get_feature_names(pipe)

    contributions = list(zip(feature_names, shap_values[0]))
    contributions.sort(key=lambda x: abs(x[1]), reverse=True)

    readable = []
    for name, impact in contributions[:top_k]:
        readable.append({
            "feature": _humanize_feature(name),
            "impact": round(float(impact), 2),
            "direction": "increases" if impact > 0 else "decreases",
        })

    base_val = explainer.expected_value
    if isinstance(base_val, (np.ndarray, list)):
        base_value = float(base_val[0])
    else:
        base_value = float(base_val)

    prediction = base_value + float(np.sum(shap_values[0]))

    return {"base_value": round(base_value, 2), "prediction": round(prediction, 2),
            "top_factors": readable, "unit": unit}


def _humanize_feature(raw_name: str) -> str:
    mapping = {
        "land_area_sqft": "Land area", "num_floors": "Number of floors",
        "labor_count": "Labor count", "equipment_count": "Equipment count",
        "material_cost_index": "Material cost index",
        "contractor_experience_years": "Contractor experience",
    }
    if raw_name in mapping:
        return mapping[raw_name]
    for prefix, label in [("project_type_", "Project type"), ("terrain_type_", "Terrain"),
                            ("region_", "Region"), ("complexity_level_", "Complexity"),
                            ("season_", "Season"), ("weather_risk_", "Weather risk")]:
        if raw_name.startswith(prefix):
            return f"{label} = {raw_name[len(prefix):]}"
    return raw_name
