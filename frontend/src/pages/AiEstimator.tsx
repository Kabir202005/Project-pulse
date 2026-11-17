import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { predictionService } from '../services/predictionService';
import { PredictionInput, PredictionResult } from '../types';
import { KpiCard } from '../components/KpiCard';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusStates';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export const AiEstimator: React.FC = () => {
  const {
    datasetLoaded,
    modelStatus,
    modelMetrics,
    setModelStatus,
    setModelMetrics,
    showToast,
  } = useApp();

  const [training, setTraining] = useState<boolean>(false);
  const [predicting, setPredicting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form Inputs with default realistic initial values
  const [form, setForm] = useState<PredictionInput>({
    project_type: 'Commercial',
    terrain_type: 'Hilly',
    region: 'North',
    complexity_level: 'High',
    season: 'Monsoon',
    weather_risk: 'High',
    land_area_sqft: 25000,
    num_floors: 6,
    labor_count: 75,
    equipment_count: 6,
    material_cost_index: 110,
    contractor_experience_years: 8,
  });

  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleTrainModels = async () => {
    setTraining(true);
    setError(null);
    try {
      const res = await predictionService.trainModels();
      setModelStatus({ trained: true, last_trained: new Date().toLocaleString() });
      setModelMetrics({ cost: res.cost_model, duration: res.duration_model });
      showToast('ML Models trained & SHAP TreeExplainers built successfully!', 'success');
    } catch (err: any) {
      setError(err.message || 'Model training failed.');
      showToast(err.message || 'Training failed', 'error');
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelStatus.trained) {
      showToast('Please train the prediction models first.', 'info');
      return;
    }

    setPredicting(true);
    setError(null);
    try {
      const res = await predictionService.predict(form);
      setResult(res);
      showToast('AI Estimate & SHAP feature impacts generated!', 'success');
    } catch (err: any) {
      setError(err.message || 'Prediction failed.');
      showToast(err.message || 'Prediction failed', 'error');
    } finally {
      setPredicting(false);
    }
  };

  if (!datasetLoaded) {
    return (
      <EmptyState
        title="Dataset Required for AI Model Training"
        description="Load a project dataset in the Data Center to train GradientBoosting models and perform SHAP-explained inference."
      />
    );
  }

  return (
    <div className="flex flex-col gap-card-gap">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-headline-lg text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight">
              AI Estimator & SHAP Explainability
            </h2>
            <span
              className={`border px-3 py-1 rounded-full font-label-md text-xs flex items-center gap-1.5 ${modelStatus.trained
                  ? 'bg-secondary-container/20 text-secondary border-secondary/30'
                  : 'bg-tertiary-container/20 text-tertiary border-tertiary/30'
                }`}
            >
              <span className="material-symbols-outlined text-[14px] fill">memory</span>
              {modelStatus.trained ? 'GradientBoosting Models Active' : 'Models Not Trained'}
            </span>
          </div>
          <p className="font-body-lg text-sm text-on-surface-variant max-w-2xl">
            Dual GradientBoostingRegressor models forecasting capital expenditure and calendar timeline with TreeSHAP feature attributions.
          </p>
        </div>

        <button
          onClick={handleTrainModels}
          disabled={training}
          className="bg-surface-variant hover:bg-surface-variant/80 border border-white/10 text-on-surface px-5 py-2.5 rounded-lg font-title-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <span className={`material-symbols-outlined text-sm ${training ? 'animate-spin' : ''}`}>
            {training ? 'sync' : 'model_training'}
          </span>
          {training ? 'Training Ensemble Models...' : modelStatus.trained ? 'Retrain Models' : 'Train Prediction Models'}
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={() => setError(null)} />}

      {/* Model Performance Banner (if trained) */}
      {modelMetrics && (
        <div className="bg-surface-container-high/40 border border-white/5 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-title-md text-xs font-semibold text-on-surface uppercase tracking-wider text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">auto_graph</span>
              Verified Holdout Validation Metrics (80/20 Split)
            </h4>
            <span className="text-xs text-on-surface-variant">Tree Depth: 3 | Estimators: 350</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-surface-dim/70 p-3 rounded-lg border border-white/5">
              <p className="text-[11px] text-on-surface-variant">Cost Model R²</p>
              <p className="text-base font-bold text-secondary">{modelMetrics.cost.r2.toFixed(2)}</p>
            </div>
            <div className="bg-surface-dim/70 p-3 rounded-lg border border-white/5">
              <p className="text-[11px] text-on-surface-variant">Cost MAPE</p>
              <p className="text-base font-bold text-on-surface">{modelMetrics.cost.mape.toFixed(1)}%</p>
            </div>
            <div className="bg-surface-dim/70 p-3 rounded-lg border border-white/5">
              <p className="text-[11px] text-on-surface-variant">Cost MAE</p>
              <p className="text-base font-bold text-on-surface">₹{modelMetrics.cost.mae.toLocaleString()}</p>
            </div>
            <div className="bg-surface-dim/70 p-3 rounded-lg border border-white/5">
              <p className="text-[11px] text-on-surface-variant">Duration Model R²</p>
              <p className="text-base font-bold text-secondary">{modelMetrics.duration.r2.toFixed(2)}</p>
            </div>
            <div className="bg-surface-dim/70 p-3 rounded-lg border border-white/5">
              <p className="text-[11px] text-on-surface-variant">Duration MAPE</p>
              <p className="text-base font-bold text-on-surface">{modelMetrics.duration.mape.toFixed(1)}%</p>
            </div>
            <div className="bg-surface-dim/70 p-3 rounded-lg border border-white/5">
              <p className="text-[11px] text-on-surface-variant">Duration MAE</p>
              <p className="text-base font-bold text-on-surface">{modelMetrics.duration.mae.toFixed(1)} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Input Form & Prediction Output */}
      <div className="grid grid-cols-12 gap-card-gap">
        {/* Form Container (Span 5 on Desktop) */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
          <h3 className="font-title-md text-base text-on-surface font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">tune</span>
            Project Scope Parameters
          </h3>

          <form onSubmit={handlePredict} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Project Type</label>
                <select
                  value={form.project_type}
                  onChange={(e) => setForm({ ...form, project_type: e.target.value })}
                  className="w-full bg-surface-dim border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Commercial">Commercial</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Residential">Residential</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Terrain Type</label>
                <select
                  value={form.terrain_type}
                  onChange={(e) => setForm({ ...form, terrain_type: e.target.value })}
                  className="w-full bg-surface-dim border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Flatland">Flatland</option>
                  <option value="Hilly">Hilly</option>
                  <option value="Rocky">Rocky</option>
                  <option value="Sandy/Coastal">Sandy/Coastal</option>
                  <option value="Urban Dense">Urban Dense</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Region</label>
                <select
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full bg-surface-dim border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="Central">Central</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Complexity Level</label>
                <select
                  value={form.complexity_level}
                  onChange={(e) => setForm({ ...form, complexity_level: e.target.value })}
                  className="w-full bg-surface-dim border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Season</label>
                <select
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                  className="w-full bg-surface-dim border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Spring/Fall">Spring/Fall</option>
                  <option value="Summer">Summer</option>
                  <option value="Monsoon">Monsoon</option>
                  <option value="Winter">Winter</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Weather Risk</label>
                <select
                  value={form.weather_risk}
                  onChange={(e) => setForm({ ...form, weather_risk: e.target.value })}
                  className="w-full bg-surface-dim border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Land Area (sqft)</label>
                <input
                  type="number"
                  min={100}
                  value={form.land_area_sqft}
                  onChange={(e) => setForm({ ...form, land_area_sqft: Number(e.target.value) })}
                  className="w-full bg-surface-dim border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Number of Floors</label>
                <input
                  type="number"
                  min={1}
                  value={form.num_floors}
                  onChange={(e) => setForm({ ...form, num_floors: Number(e.target.value) })}
                  className="w-full bg-surface-dim border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Labor Count (Crew)</label>
                <input
                  type="number"
                  min={1}
                  value={form.labor_count}
                  onChange={(e) => setForm({ ...form, labor_count: Number(e.target.value) })}
                  className="w-full bg-surface-dim border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Equipment Count</label>
                <input
                  type="number"
                  min={1}
                  value={form.equipment_count}
                  onChange={(e) => setForm({ ...form, equipment_count: Number(e.target.value) })}
                  className="w-full bg-surface-dim border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Material Cost Index</label>
                <input
                  type="number"
                  min={50}
                  step={1}
                  value={form.material_cost_index}
                  onChange={(e) => setForm({ ...form, material_cost_index: Number(e.target.value) })}
                  className="w-full bg-surface-dim border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Contractor Exp (Yrs)</label>
                <input
                  type="number"
                  min={0}
                  value={form.contractor_experience_years}
                  onChange={(e) => setForm({ ...form, contractor_experience_years: Number(e.target.value) })}
                  className="w-full bg-surface-dim border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={predicting || !modelStatus.trained}
              className="w-full bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 px-4 py-2.5 rounded-lg font-title-md text-sm font-medium transition-colors mt-2 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span className={`material-symbols-outlined text-sm ${predicting ? 'animate-spin' : ''}`}>
                {predicting ? 'sync' : 'psychology'}
              </span>
              {predicting ? 'Running Inference & SHAP...' : 'Generate AI Estimate'}
            </button>
          </form>
        </div>

        {/* Prediction & SHAP Output (Span 7) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-card-gap">
          {!result ? (
            <div className="bg-surface-container border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center flex-1 shadow-lg text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mb-4 text-primary">
                <span className="material-symbols-outlined text-3xl">insights</span>
              </div>
              <h4 className="font-title-md text-base text-on-surface font-semibold mb-1">Ready for Project Estimation</h4>
              <p className="font-body-md text-xs text-on-surface-variant max-w-sm">
                Adjust the scope parameters on the left and click Generate AI Estimate to forecast cost, duration, and feature contributions.
              </p>
            </div>
          ) : (
            <>
              {/* Predicted Values KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-card-gap">
                <KpiCard
                  title="Predicted Capital Cost"
                  value={`₹${result.predicted_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  icon="payments"
                  highlight
                  subtitle={`Baseline expectation: ₹${result.cost_baseline.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                />
                <KpiCard
                  title="Predicted Completion Timeline"
                  value={`${result.predicted_duration_days.toFixed(0)} Days`}
                  icon="schedule"
                  subtitle={`Baseline expectation: ${result.duration_baseline.toFixed(0)} days`}
                />
              </div>

              {/* SHAP Cost Explanations */}
              <div className="bg-surface-container border border-white/5 rounded-xl p-5 shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-title-md text-sm text-on-surface font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">account_tree</span>
                    SHAP Factor Contributions: Cost Variance (₹)
                  </h4>
                  <span className="text-xs text-on-surface-variant font-mono">
                    Baseline: ₹{result.cost_baseline.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <p className="font-body-md text-xs text-on-surface-variant mb-3">
                  Marginal dollar impact of specific project parameters against standard portfolio average.
                </p>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={result.cost_shap}
                      margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        type="number"
                        stroke="#8c909f"
                        fontSize={10}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        dataKey="feature"
                        type="category"
                        stroke="#8c909f"
                        fontSize={10}
                        width={130}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1d2027', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e1e2ec' }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Impact on Cost']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {result.cost_shap.map((entry, index) => (
                          <Cell
                            key={`cost-shap-${index}`}
                            fill={entry.value > 0 ? '#ffb4ab' : '#4edea3'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SHAP Duration Explanations */}
              <div className="bg-surface-container border border-white/5 rounded-xl p-5 shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-title-md text-sm text-on-surface font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-base">timelapse</span>
                    SHAP Factor Contributions: Duration Impact (Days)
                  </h4>
                  <span className="text-xs text-on-surface-variant font-mono">
                    Baseline: {result.duration_baseline.toFixed(0)} days
                  </span>
                </div>
                <p className="font-body-md text-xs text-on-surface-variant mb-3">
                  Schedule acceleration (green) or delay risk (red) driven by specific constraints.
                </p>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={result.duration_shap}
                      margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        type="number"
                        stroke="#8c909f"
                        fontSize={10}
                        unit=" d"
                      />
                      <YAxis
                        dataKey="feature"
                        type="category"
                        stroke="#8c909f"
                        fontSize={10}
                        width={130}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1d2027', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e1e2ec' }}
                        formatter={(val: any) => [`${Number(val).toFixed(1)} days`, 'Impact on Duration']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {result.duration_shap.map((entry, index) => (
                          <Cell
                            key={`dur-shap-${index}`}
                            fill={entry.value > 0 ? '#ffb4ab' : '#4edea3'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
