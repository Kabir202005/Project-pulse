"""
Data ingestion, cleaning, preview, and download endpoints.
"""

import io
import os
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse

from state import state
from schemas import DataUploadResponse, DataPreviewResponse
from utils.data_processing import load_and_clean, add_derived_metrics, REQUIRED_COLUMNS

router = APIRouter(prefix="/data", tags=["Data"])

SAMPLE_CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "construction_projects_raw.csv")


def _process_dataframe(raw_df: pd.DataFrame, source_buffer_or_path):
    """Clean and enrich DataFrame, store in state, and return response dict."""
    df_clean = load_and_clean(source_buffer_or_path)
    df_clean = add_derived_metrics(df_clean)
    
    n_dupes = int(df_clean.attrs.get("n_duplicates_removed", 0))
    n_cost_imp = int(df_clean.attrs.get("n_cost_imputed", 0))
    n_exp_imp = int(df_clean.attrs.get("n_experience_imputed", 0))

    state.df = df_clean
    state.cost_pipe = None
    state.duration_pipe = None
    state.cost_metrics = None
    state.duration_metrics = None
    state.cost_explainer = None
    state.duration_explainer = None
    state.last_trained = None

    state.cleaning_stats = {
        "raw_rows": len(raw_df),
        "cleaned_rows": len(df_clean),
        "duplicates_removed": n_dupes,
        "cost_imputations": n_cost_imp,
        "experience_imputations": n_exp_imp,
    }

    preview_df = df_clean.head(20).copy()
    # Format datetimes and numbers for JSON serialization
    if "start_date" in preview_df.columns:
        preview_df["start_date"] = preview_df["start_date"].astype(str)

    # Convert preview records
    records = preview_df.to_dict(orient="records")

    return {
        "success": True,
        "raw_rows": len(raw_df),
        "cleaned_rows": len(df_clean),
        "duplicates_removed": n_dupes,
        "cost_imputations": n_cost_imp,
        "experience_imputations": n_exp_imp,
        "columns": list(df_clean.columns),
        "preview": records,
    }


@router.post("/upload", response_model=DataUploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    """Upload and clean a CSV project dataset."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    contents = await file.read()
    try:
        raw_df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {str(e)}")

    missing = [c for c in REQUIRED_COLUMNS if c not in raw_df.columns]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required columns: {', '.join(missing)}")

    try:
        return _process_dataframe(raw_df, io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cleaning dataset: {str(e)}")


@router.post("/sample", response_model=DataUploadResponse)
def load_sample_dataset():
    """Load and clean the bundled sample construction project dataset."""
    if not os.path.exists(SAMPLE_CSV_PATH):
        raise HTTPException(status_code=404, detail="Sample dataset not found on server.")
    
    try:
        raw_df = pd.read_csv(SAMPLE_CSV_PATH)
        return _process_dataframe(raw_df, SAMPLE_CSV_PATH)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing sample dataset: {str(e)}")


@router.get("/preview", response_model=DataPreviewResponse)
def get_data_preview(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", description="Search by project_id, type, terrain, region, etc.")
):
    """Get paginated, searchable preview of the loaded and cleaned dataset."""
    if not state.is_data_loaded:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload or load sample data first.")

    df = state.df.copy()

    if search.strip():
        q = search.strip().lower()
        # Search string across textual and ID columns
        mask = (
            df["project_id"].astype(str).str.lower().str.contains(q, na=False) |
            df["project_type"].astype(str).str.lower().str.contains(q, na=False) |
            df["terrain_type"].astype(str).str.lower().str.contains(q, na=False) |
            df["region"].astype(str).str.lower().str.contains(q, na=False) |
            df["complexity_level"].astype(str).str.lower().str.contains(q, na=False)
        )
        df = df[mask]

    total_rows = len(df)
    total_pages = max(1, (total_rows + page_size - 1) // page_size)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size

    sliced_df = df.iloc[start_idx:end_idx].copy()
    if "start_date" in sliced_df.columns:
        sliced_df["start_date"] = sliced_df["start_date"].astype(str)

    # Convert numeric fields properly for clean JSON
    data = sliced_df.to_dict(orient="records")

    return {
        "page": page,
        "page_size": page_size,
        "total_rows": total_rows,
        "total_pages": total_pages,
        "data": data,
    }


@router.get("/download")
def download_cleaned_csv():
    """Download the full cleaned dataset as a CSV file."""
    if not state.is_data_loaded:
        raise HTTPException(status_code=400, detail="No dataset loaded to download.")

    stream = io.StringIO()
    state.df.to_csv(stream, index=False)
    stream.seek(0)

    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=cleaned_construction_projects.csv"
    return response
