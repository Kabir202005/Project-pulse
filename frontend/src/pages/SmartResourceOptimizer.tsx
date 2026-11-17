import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { optimizationService } from '../services/optimizationService';
import { OptimizationInput, OptimizationResult } from '../types';
import { KpiCard } from '../components/KpiCard';
import { ErrorState, EmptyState } from '../components/StatusStates';

export const SmartResourceOptimizer: React.FC = () => {
  const { datasetLoaded, modelStatus, showToast } = useApp();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<OptimizationInput>({
    project_type: 'Commercial',
    terrain_type: 'Hilly',
    region: 'North',
    complexity_level: 'High',
    season: 'Monsoon',
    weather_risk: 'High',
    land_area_sqft: 20000,
    num_floors: 6,
    labor_count: 50,
    equipment_count: 5,
    material_cost_index: 100,
    contractor_experience_years: 8,
    optimization_priority: 'balanced',
  });

  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelStatus.trained) {
      showToast('Please train the prediction models in AI Estimator first.', 'info');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await optimizationService.optimize(form);
      setResult(res);
      showToast('Optimal resource allocation solved on ML surface!', 'success');
    } catch (err: any) {
      setError(err.message || 'Optimization failed.');
      showToast(err.message || 'Optimization failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!datasetLoaded) {
    return (
      <EmptyState
        title="Dataset Required for Resource Optimization"
        description="Load a project dataset in the Data Center and train models in AI Estimator to run the resource optimizer."
      />
    );
  }

  if (!modelStatus.trained) {
    return (
      <EmptyState
        title="Models Not Trained"
        description="The resource optimizer uses the trained GradientBoosting models to search the prediction surface for optimal labor and equipment allocations."
        actionText="Train Models in AI Estimator"
        actionPath="/estimator"
        icon="psychology"
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
              Smart Resource Optimizer
            </h2>
            <span className="bg-secondary-container/20 text-secondary border border-secondary/30 px-3 py-1 rounded-full font-label-md text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] fill">smart_toy</span>
              Tree Surface Grid Search
            </span>
          </div>
          <p className="font-body-lg text-sm text-on-surface-variant max-w-2xl">
            For a fixed project scope, evaluate the multi-dimensional surface to discover the ideal labor and heavy equipment configuration.
          </p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => setError(null)} />}

      <div className="grid grid-cols-12 gap-card-gap">
        {/* Scope Parameters & Priority Selection */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
          <h3 className="font-title-md text-base text-on-surface font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">tune</span>
            Fixed Project Parameters
          </h3>

          <form onSubmit={handleOptimize} className="flex flex-col gap-4">
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
                <label className="text-xs text-on-surface-variant font-medium block mb-1">Complexity</label>
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

            {/* Optimization Priority */}
            <div className="border-t border-white/5 pt-3">
              <label className="text-xs text-on-surface-variant font-semibold block mb-2">
                Optimization Strategic Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cost', label: 'Minimize Cost', icon: 'savings' },
                  { id: 'timeline', label: 'Fastest Timeline', icon: 'bolt' },
                  { id: 'balanced', label: 'Balanced Trade-off', icon: 'balance' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setForm({ ...form, optimization_priority: item.id as any })}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-all ${form.optimization_priority === item.id
                        ? 'bg-primary/15 border-primary text-primary font-bold shadow-sm'
                        : 'bg-surface-dim border-white/10 text-on-surface-variant hover:bg-white/5'
                      }`}
                  >
                    <span className="material-symbols-outlined text-lg mb-1">{item.icon}</span>
                    <span className="text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary hover:bg-primary/90 px-4 py-2.5 rounded-lg font-title-md text-sm font-medium transition-colors mt-2 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>
                {loading ? 'sync' : 'auto_fix_high'}
              </span>
              {loading ? 'Executing Grid Surface Search...' : 'Find Optimal Resource Allocation'}
            </button>
          </form>
        </div>

        {/* Results Container (Span 7) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-card-gap">
          {!result ? (
            <div className="bg-surface-container border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center flex-1 shadow-lg text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mb-4 text-secondary">
                <span className="material-symbols-outlined text-3xl">precision_manufacturing</span>
              </div>
              <h4 className="font-title-md text-base text-on-surface font-semibold mb-1">Optimizer Ready</h4>
              <p className="font-body-md text-xs text-on-surface-variant max-w-sm">
                Select your priority (Cost, Timeline, or Balanced) and launch the optimizer to determine the ideal crew and machine allocation.
              </p>
            </div>
          ) : (
            <>
              {/* Recommended Resources KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-card-gap">
                <KpiCard
                  title="Recommended Labor Crew"
                  value={`${result.recommended_labor} Workers`}
                  icon="groups"
                  highlight
                  trend={{
                    value: `${result.recommended_labor >= result.baseline_cost ? '+' : ''}${result.recommended_labor - 50} vs. baseline (50)`,
                    isPositive: true,
                  }}
                  subtitle="Optimal site manpower headcount"
                />
                <KpiCard
                  title="Recommended Heavy Equipment"
                  value={`${result.recommended_equipment} Units`}
                  icon="precision_manufacturing"
                  highlight
                  trend={{
                    value: `${result.recommended_equipment >= 5 ? '+' : ''}${result.recommended_equipment - 5} vs. baseline (5)`,
                    isPositive: true,
                  }}
                  subtitle="Cranes, excavators, and earthmovers"
                />
              </div>

              {/* Financial & Schedule Impacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-card-gap">
                <KpiCard
                  title="Optimized Projected Cost"
                  value={`₹${result.predicted_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  icon="payments"
                  trend={{
                    value: `${result.cost_change_pct > 0 ? '+' : ''}${result.cost_change_pct.toFixed(1)}% vs baseline crew`,
                    isPositive: result.cost_change_pct <= 0,
                  }}
                  subtitle={`Baseline cost: ₹${result.baseline_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                />
                <KpiCard
                  title="Optimized Projected Duration"
                  value={`${result.predicted_duration_days.toFixed(0)} Days`}
                  icon="timelapse"
                  trend={{
                    value: `${result.duration_change_pct > 0 ? '+' : ''}${result.duration_change_pct.toFixed(1)}% vs baseline crew`,
                    isPositive: result.duration_change_pct <= 0,
                  }}
                  subtitle={`Baseline duration: ${result.baseline_duration_days.toFixed(0)} days`}
                />
              </div>

              {/* AI Strategic Recommendation Box */}
              <div className="bg-surface-container border border-primary/20 bg-primary/5 rounded-xl p-6 shadow-lg flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">psychology</span>
                  </div>
                  <h4 className="font-title-md text-base text-on-surface font-semibold">
                    AI Strategic Recommendation
                  </h4>
                </div>
                <p className="font-body-lg text-sm text-on-surface leading-relaxed">
                  {result.recommendation}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
