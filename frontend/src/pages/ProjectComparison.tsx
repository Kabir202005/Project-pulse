import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { comparisonService } from '../services/comparisonService';
import { ComparisonProject } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusStates';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const ProjectComparison: React.FC = () => {
  const { datasetLoaded, showToast } = useApp();
  const [availableIds, setAvailableIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [projects, setProjects] = useState<ComparisonProject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (datasetLoaded) {
      comparisonService
        .getAvailableProjectIds()
        .then((ids) => {
          setAvailableIds(ids);
          if (ids.length >= 3) {
            const initial = ids.slice(0, 3);
            setSelectedIds(initial);
            runComparison(initial);
          }
        })
        .catch(() => { });
    }
  }, [datasetLoaded]);

  const runComparison = async (ids: string[]) => {
    if (ids.length < 2) {
      showToast('Please select at least 2 projects to compare.', 'info');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await comparisonService.compareProjects(ids);
      setProjects(res.projects);
    } catch (err: any) {
      setError(err.message || 'Failed to compare projects.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleId = (id: string) => {
    let next: string[];
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        showToast('Comparison requires at least 2 projects.', 'info');
        return;
      }
      next = selectedIds.filter((x) => x !== id);
    } else {
      if (selectedIds.length >= 6) {
        showToast('Maximum 6 projects can be compared simultaneously.', 'info');
        return;
      }
      next = [...selectedIds, id];
    }
    setSelectedIds(next);
    runComparison(next);
  };

  if (!datasetLoaded) {
    return (
      <EmptyState
        title="Project Comparison Not Available"
        description="Load a project dataset in the Data Center to benchmark projects side-by-side across cost and duration metrics."
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
              Project Comparison
            </h2>
            <span className="bg-primary/10 text-primary border border-primary/30 px-3 py-1 rounded-full font-label-md text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] fill">compare_arrows</span>
              Side-by-Side Benchmarking (2–6 Projects)
            </span>
          </div>
          <p className="font-body-lg text-sm text-on-surface-variant max-w-2xl">
            Select 2 to 6 project IDs to perform matrix comparisons, financial variance benchmarking, and resource differential analyses.
          </p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => runComparison(selectedIds)} />}

      {/* Project Selector Pills */}
      <div className="bg-surface-container border border-white/5 rounded-xl p-5 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="font-title-md text-xs font-semibold text-on-surface uppercase tracking-wider text-on-surface-variant">
            Select Projects to Compare ({selectedIds.length}/6 selected):
          </h4>
          <span className="text-xs text-primary">Min 2, Max 6</span>
        </div>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
          {availableIds.slice(0, 30).map((id) => {
            const isSelected = selectedIds.includes(id);
            return (
              <button
                key={id}
                onClick={() => handleToggleId(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${isSelected
                  ? 'bg-primary text-on-primary font-bold shadow-md shadow-primary/20 scale-105'
                  : 'bg-surface-dim hover:bg-surface-variant text-on-surface-variant border border-white/10'
                  }`}
              >
                {id}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Extracting multi-project comparative matrix..." />
      ) : projects.length === 0 ? (
        <div className="bg-surface-container border border-white/5 rounded-xl p-12 text-center text-on-surface-variant text-sm">
          Select projects from the pills above to view comparative charts and side-by-side matrices.
        </div>
      ) : (
        <>
          {/* Grouped Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-card-gap">
            {/* Cost Comparison Chart */}
            <div className="bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
              <h3 className="font-title-md text-base text-on-surface font-semibold mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">payments</span>
                Planned vs. Actual Cost (₹)
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant mb-4">
                Budgeted baseline vs realized capital expenditure
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projects} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="project_id" stroke="#8c909f" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#8c909f"
                      fontSize={11}
                      tickFormatter={(v) => `₹${(v / 1_000_000).toFixed(1)}K`}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1d2027', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e1e2ec' }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                    />
                    <Legend />
                    <Bar dataKey="planned_cost" name="Planned Cost" fill="#4edea3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual_cost" name="Actual Cost" fill="#4d8eff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overrun Percentage Comparison */}
            <div className="bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
              <h3 className="font-title-md text-base text-on-surface font-semibold mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-lg">trending_up</span>
                Cost & Schedule Overrun (%)
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant mb-4">
                Comparative deviation rates beyond original baseline
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projects} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="project_id" stroke="#8c909f" fontSize={11} tickLine={false} />
                    <YAxis stroke="#8c909f" fontSize={11} unit="%" tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1d2027', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e1e2ec' }}
                      formatter={(val: any) => [`${Number(val).toFixed(1)}%`, '']}
                    />
                    <Legend />
                    <Bar dataKey="cost_overrun_pct" name="Cost Overrun %" fill="#ffb4ab" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="schedule_overrun_pct" name="Schedule Overrun %" fill="#ffb95f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          <div className="bg-surface-container border border-white/5 rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 bg-surface-container-high/50 flex items-center justify-between">
              <h3 className="font-title-md text-base text-on-surface font-semibold">
                Side-by-Side Project Attribute Matrix
              </h3>
              <span className="text-xs text-on-surface-variant font-mono">
                {projects.length} Projects Benchmarked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-dim border-b border-white/10 text-xs text-on-surface-variant uppercase">
                    <th className="py-3 px-4 font-semibold w-48">Metric / Attribute</th>
                    {projects.map((p) => (
                      <th key={p.project_id} className="py-3 px-4 font-bold text-primary text-center">
                        {p.project_id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-code-sm text-xs text-on-surface divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-sans font-medium text-on-surface-variant">Project Type</td>
                    {projects.map((p) => (
                      <td key={p.project_id} className="py-2.5 px-4 text-center">{p.project_type}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-sans font-medium text-on-surface-variant">Terrain Type</td>
                    {projects.map((p) => (
                      <td key={p.project_id} className="py-2.5 px-4 text-center">{p.terrain_type}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-sans font-medium text-on-surface-variant">Region</td>
                    {projects.map((p) => (
                      <td key={p.project_id} className="py-2.5 px-4 text-center">{p.region}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-sans font-medium text-on-surface-variant">Complexity</td>
                    {projects.map((p) => (
                      <td key={p.project_id} className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${p.complexity_level === 'High' ? 'text-error bg-error/15' : 'text-secondary bg-secondary/15'}`}>
                          {p.complexity_level}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-sans font-medium text-on-surface-variant">Planned Budget</td>
                    {projects.map((p) => (
                      <td key={p.project_id} className="py-2.5 px-4 text-center font-semibold text-secondary">
                        ₹{p.planned_cost.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-sans font-medium text-on-surface-variant">Actual Expenditure</td>
                    {projects.map((p) => (
                      <td key={p.project_id} className="py-2.5 px-4 text-center font-semibold text-primary">
                        ₹{p.actual_cost.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-sans font-medium text-on-surface-variant">Cost Overrun %</td>
                    {projects.map((p) => (
                      <td key={p.project_id} className={`py-2.5 px-4 text-center font-bold ${p.cost_overrun_pct > 15 ? 'text-error' : 'text-secondary'}`}>
                        +{p.cost_overrun_pct.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-sans font-medium text-on-surface-variant">Planned Duration</td>
                    {projects.map((p) => (
                      <td key={p.project_id} className="py-2.5 px-4 text-center">{p.planned_duration_days.toFixed(0)} days</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-sans font-medium text-on-surface-variant">Actual Duration</td>
                    {projects.map((p) => (
                      <td key={p.project_id} className="py-2.5 px-4 text-center">{p.actual_duration_days.toFixed(0)} days</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-sans font-medium text-on-surface-variant">Land Area (sqft)</td>
                    {projects.map((p) => (
                      <td key={p.project_id} className="py-2.5 px-4 text-center">{p.land_area_sqft.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-sans font-medium text-on-surface-variant">Labor / Equipment</td>
                    {projects.map((p) => (
                      <td key={p.project_id} className="py-2.5 px-4 text-center">{p.labor_count} crew / {p.equipment_count} equip</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
