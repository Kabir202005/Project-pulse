import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { analyticsService } from '../services/analyticsService';
import { VisualizationsData } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusStates';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from 'recharts';

export const InteractiveVisualizations: React.FC = () => {
  const { datasetLoaded } = useApp();
  const [data, setData] = useState<VisualizationsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVisualizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getVisualizations();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load interactive visualizations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (datasetLoaded) {
      fetchVisualizations();
    }
  }, [datasetLoaded]);

  if (!datasetLoaded) {
    return (
      <EmptyState
        title="Visualizations Not Available"
        description="Load a project dataset in Data Center to unlock multi-axis time series, cost distributions, and scatter analytics."
      />
    );
  }

  if (loading) {
    return <LoadingState message="Synthesizing multi-variable visualization models..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchVisualizations} />;
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-card-gap">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="font-headline-lg text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight">
            Interactive Visualizations
          </h2>
          <p className="font-body-lg text-sm text-on-surface-variant max-w-2xl">
            Multi-dimensional analytical plots mapping capital outlay, resource density, land scale, and risk distributions.
          </p>
        </div>
      </div>

      {/* Chart 1: Quarterly Planned vs Actual Cost (Full Width) */}
      <div className="bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-title-md text-base text-on-surface font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">timeline</span>
              Planned vs. Actual Capital Expenditure Over Time (Quarterly)
            </h3>
            <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
              Aggregated portfolio disbursement curves by project start quarter
            </p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.quarterly_costs} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="quarter" stroke="#8c909f" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#8c909f"
                fontSize={11}
                tickFormatter={(val) => `₹${(val / 1_000_000).toFixed(0)}K`}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1d2027', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e1e2ec' }}
                formatter={(val: any) => [`₹${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="planned_cost" name="Planned Budget" stroke="#4edea3" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="actual_cost" name="Actual Expenditure" stroke="#4d8eff" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-card-gap">
        {/* Project Type Overruns */}
        <div className="bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
          <h3 className="font-title-md text-base text-on-surface font-semibold mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">apartment</span>
            Cost Overrun by Project Type
          </h3>
          <p className="font-body-md text-xs text-on-surface-variant mb-4">
            Average cost overrun percentage across building categories
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data.project_type_overruns} margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#8c909f" fontSize={11} unit="%" />
                <YAxis dataKey="project_type" type="category" stroke="#8c909f" fontSize={11} width={110} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1d2027', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e1e2ec' }}
                  formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Avg Overrun']}
                />
                <Bar dataKey="avg_cost_overrun_pct" radius={[0, 4, 4, 0]}>
                  {data.project_type_overruns.map((entry, index) => (
                    <Cell
                      key={`ptype-${index}`}
                      fill={entry.avg_cost_overrun_pct > 20 ? '#ffb4ab' : entry.avg_cost_overrun_pct > 10 ? '#ffb95f' : '#4edea3'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Overrun Distribution */}
        <div className="bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
          <h3 className="font-title-md text-base text-on-surface font-semibold mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-lg">bar_chart</span>
            Cost Overrun Distribution (Histogram)
          </h3>
          <p className="font-body-md text-xs text-on-surface-variant mb-4">
            Frequency distribution of cost deviation percentage
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.overrun_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="bin_center" stroke="#8c909f" fontSize={10} unit="%" tickLine={false} />
                <YAxis stroke="#8c909f" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1d2027', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e1e2ec' }}
                  labelFormatter={(lbl) => `Bin Center: ${lbl}%`}
                  formatter={(val: any) => [val, 'Projects']}
                />
                <Bar dataKey="count" fill="#4d8eff" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Scatter Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-card-gap">
        {/* Land Area vs Actual Cost */}
        <div className="bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
          <h3 className="font-title-md text-base text-on-surface font-semibold mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">scatter_plot</span>
            Land Area (sqft) vs. Actual Cost (₹)
          </h3>
          <p className="font-body-md text-xs text-on-surface-variant mb-4">
            Scale-to-cost elasticity across construction projects
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  type="number"
                  dataKey="land_area_sqft"
                  name="Land Area"
                  stroke="#8c909f"
                  fontSize={10}
                  unit=" sqft"
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="number"
                  dataKey="actual_cost"
                  name="Actual Cost"
                  stroke="#8c909f"
                  fontSize={10}
                  tickFormatter={(v) => `₹${(v / 1_000_000).toFixed(1)}K`}
                />
                <ZAxis range={[20, 20]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#1d2027', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e1e2ec' }}
                  formatter={(val: any, name: any) => [
                    name === 'Actual Cost' ? `₹${Number(val).toLocaleString()}` : `${Number(val).toLocaleString()} sqft`,
                    name,
                  ]}
                />
                <Scatter name="Projects" data={data.land_vs_cost} fill="#4edea3" opacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Labor Count vs Duration */}
        <div className="bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
          <h3 className="font-title-md text-base text-on-surface font-semibold mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">engineering</span>
            Labor Crew vs. Actual Duration (Days)
          </h3>
          <p className="font-body-md text-xs text-on-surface-variant mb-4">
            Manpower allocation vs. completion calendar timeline
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  type="number"
                  dataKey="labor_count"
                  name="Labor Crew"
                  stroke="#8c909f"
                  fontSize={10}
                  unit=" workers"
                />
                <YAxis
                  type="number"
                  dataKey="actual_duration_days"
                  name="Duration"
                  stroke="#8c909f"
                  fontSize={10}
                  unit=" days"
                />
                <ZAxis range={[20, 20]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#1d2027', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e1e2ec' }}
                  formatter={(val: any, name: any) => [
                    name === 'Duration' ? `${Number(val).toFixed(0)} days` : `${val} crew`,
                    name,
                  ]}
                />
                <Scatter name="Projects" data={data.labor_vs_duration} fill="#adc6ff" opacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
