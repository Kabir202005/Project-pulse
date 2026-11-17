"""
In-memory application state for Project Pulse backend.
Preserves loaded dataset, trained ML models, metrics, and SHAP explainers across requests.
"""

from typing import Optional, Dict, Any
import datetime
import pandas as pd

class AppState:
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.cost_pipe: Optional[Any] = None
        self.duration_pipe: Optional[Any] = None
        self.cost_metrics: Optional[Dict[str, float]] = None
        self.duration_metrics: Optional[Dict[str, float]] = None
        self.cost_explainer: Optional[Any] = None
        self.duration_explainer: Optional[Any] = None
        self.last_trained: Optional[str] = None
        self.cleaning_stats: Dict[str, Any] = {}
        self.otp_store: Dict[str, Dict[str, Any]] = {}
        self.active_sessions: Dict[str, Dict[str, Any]] = {}

    @property
    def is_data_loaded(self) -> bool:
        return self.df is not None and not self.df.empty

    @property
    def is_model_trained(self) -> bool:
        return self.cost_pipe is not None and self.duration_pipe is not None

state = AppState()
